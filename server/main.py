# main.py
import os
import json
from typing import List, Optional
from datetime import datetime

import requests
import pymysql
from pymysql.cursors import DictCursor
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel
from bs4 import BeautifulSoup
import urllib3

# ----- 환경 변수 & Ollama(OpenAI 호환) 클라이언트 설정 -----
# 상위 폴더(../.env)에 있는 환경변수 로드 (DB 설정 등에 사용)
load_dotenv(dotenv_path="../.env")

# Ollama 서버(OpenAI 호환 /v1 엔드포인트 사용)
# OLLAMA_BASE_URL은 필요 시 .env에 넣어서 변경 가능
client = OpenAI(
    base_url=os.getenv("OPENAI_BASE_URL", "http://localhost:11434/v1"),
    api_key=os.getenv("OPENAI_API_KEY", "ollama"),  # 형식상 필요, 실제로는 무시됨
)


# ----- FastAPI 앱 구성 -----
app = FastAPI()


class CurrentBuildingResponse(BaseModel):
    buildingName: str | None = None
    touchedAt: str | None = None  # ISO 문자열


@app.get("/api/building", response_model=CurrentBuildingResponse)
async def get_current_building():
    # TODO: 여기에서 실제 센서/DB 값 읽어오도록 나중에 교체
    return CurrentBuildingResponse(
        buildingName=None,  # 혹은 "1호관" 같은 기본값
        touchedAt=datetime.utcnow().isoformat(),
    )


# 필요 시 도메인 제한
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # 배포 시에는 ["https://your-domain"] 로 제한 권장
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----- DB 연결 함수 -----
def connect_db():
    return pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "iot"),
        charset="utf8mb4",
        cursorclass=DictCursor,  # 결과를 dict로 받기
    )


# ----- 크롤링 기반 FAQ 생성: 요청 모델 & 유틸 -----
class CrawlBuildingFaqRequest(BaseModel):
    buildingId: str           # buildings.id (varchar)
    buildingName: Optional[str] = None  # UI에서 보여줄 이름 (선택)
    url: str                  # 크롤링할 페이지 URL
    replaceExisting: bool = True  # 기존 FAQ를 지우고 다시 채울지 여부


def fetch_html(url: str) -> str:
    """주어진 URL에서 HTML을 가져온다. SSL 오류 시 한번 더 검증 없이 시도."""
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        return resp.text
    except requests.exceptions.SSLError as e:
        # 내부망/구형 TLS 이슈 대비: verify=False 로 재시도 (경고 억제)
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        try:
            resp = requests.get(url, timeout=10, verify=False)
            resp.raise_for_status()
            return resp.text
        except Exception as e2:
            # https -> http 강제 다운그레이드 시도
            if url.startswith("https://"):
                downgraded = "http://" + url[len("https://") :]
                try:
                    resp = requests.get(downgraded, timeout=10)
                    resp.raise_for_status()
                    return resp.text
                except Exception as e3:
                    print(f"[ERROR] fetch_html({url}) http fallback 실패: {e3!r}")
                    raise HTTPException(status_code=502, detail=f"HTML fetch error (SSL/http): {e3}")
            print(f"[ERROR] fetch_html({url}) SSL fallback 실패: {e2!r}")
            raise HTTPException(status_code=502, detail=f"HTML fetch error (SSL): {e2}")
    except requests.exceptions.RequestException as e:
        # 기타 연결 오류에서도 https였다면 http로 한번 강제 시도
        if url.startswith("https://"):
            downgraded = "http://" + url[len("https://") :]
            try:
                resp = requests.get(downgraded, timeout=10)
                resp.raise_for_status()
                return resp.text
            except Exception as e3:
                print(f"[ERROR] fetch_html({url}) http fallback 실패: {e3!r}")
                raise HTTPException(status_code=502, detail=f"HTML fetch error (http fallback): {e3}")
        print(f"[ERROR] fetch_html({url}) 실패: {e!r}")
        raise HTTPException(status_code=502, detail=f"HTML fetch error: {e}")
    except Exception as e:
        print(f"[ERROR] fetch_html({url}) 실패: {e!r}")
        raise HTTPException(status_code=502, detail=f"HTML fetch error: {e}")


def html_to_text(html: str) -> str:
    """HTML에서 불필요한 태그를 제거하고 순수 텍스트만 추출한다."""
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()

    text = soup.get_text(separator="\n")
    lines = [line.strip() for line in text.splitlines()]
    lines = [line for line in lines if line]
    return "\n".join(lines)


def llm_extract_faqs_from_page(
    building_id: str,
    building_name: Optional[str],
    url: str,
    page_text: str,
) -> List[dict]:
    """
    LLM에게 페이지 텍스트를 전달해 FAQ 목록을 뽑는다.
    반환 형식: [{ "question": "...", "answer": "..." }, ...]
    """
    system_prompt = """
당신은 한국 대학 캠퍼스의 건물 안내 및 행정 안내 FAQ를 만드는 어시스턴트입니다.

입력으로 웹페이지의 전체 텍스트와 건물 이름, URL이 주어집니다.
이 페이지를 읽고, 학생들이 자주 물어볼 법한 질문과 그에 대한 답변을 뽑아서
FAQ 항목들로 만들어 주세요.

반드시 아래 JSON 형식으로만 출력하세요:

{
  "faqs": [
    { "question": "질문1", "answer": "답변1" },
    { "question": "질문2", "answer": "답변2" }
  ]
}

규칙:
- 문서에 명시된 정보만 사용하고, 문서에 없는 내용을 상상해서 만들지 마세요.
- 질문은 한국어로, 짧고 명확하게 표현합니다.
- 답변은 해당 건물이나 관련 부서 기준으로, 한두 문단 안에서 정리합니다.
- FAQ가 만들기 애매하면 빈 배열 faqs: [] 를 반환해도 됩니다.
""".strip()

    user_prompt = f"""
[건물 ID]
{building_id}

[건물 이름]
{building_name or "알 수 없음"}

[페이지 URL]
{url}

[페이지 전체 텍스트]
{page_text}
""".strip()

    completion = client.chat.completions.create(
        model=os.getenv("LLM_MODEL"),  # 로컬에 pull된 모델명으로 설정
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,
        response_format={"type": "json_object"},
    )

    content = completion.choices[0].message.content
    try:
        data = json.loads(content)
    except Exception as e:
        print("LLM JSON 파싱 실패:", content)
        raise HTTPException(status_code=500, detail=f"LLM JSON parse error: {e}")

    faqs = data.get("faqs") or []
    clean_faqs = []
    for item in faqs:
        q = (item.get("question") or "").strip()
        a = (item.get("answer") or "").strip()
        if q and a:
            clean_faqs.append({"question": q, "answer": a})

    return clean_faqs


def save_building_faqs(building_id: str, faqs: List[dict], replace_existing: bool = True):
    """building_faq 테이블에 FAQ 목록을 저장한다."""
    if not faqs:
        print(f"[INFO] building_id={building_id} 에 저장할 FAQ 없음")
        return

    conn = connect_db()
    try:
        with conn.cursor() as cur:
            # FK 존재 여부 확인
            cur.execute("SELECT id FROM buildings WHERE id = %s", (building_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(
                    status_code=400,
                    detail=f"building_id '{building_id}' 가 buildings 테이블에 없습니다.",
                )

            if replace_existing:
                cur.execute(
                    "DELETE FROM building_faq WHERE building_id = %s",
                    (building_id,),
                )
                print(f"[INFO] building_faq 기존 데이터 삭제 building_id={building_id}")

            for item in faqs:
                cur.execute(
                    """
                    INSERT INTO building_faq (building_id, question, answer)
                    VALUES (%s, %s, %s)
                    """,
                    (building_id, item["question"], item["answer"]),
                )

            conn.commit()
            print(f"[OK py] building_id={building_id} 에 FAQ {len(faqs)}개 저장 완료")
    finally:
        conn.close()


# ----- Pydantic 모델 (일반 AI 답변) -----
class BuildingAIRequest(BaseModel):
    question: str
    # 건물 화면에서 쓰면 넘겨주고, 캠퍼스 전체 질문이면 null
    buildingId: Optional[str | int] = None
    buildingName: Optional[str] = None
    context: Optional[str] = None


class BuildingAIResponse(BaseModel):
    answer: str


# ----- 키워드 검색 함수들 -----
def search_by_keyword(building_id: str, user_question: str):
    """
    특정 building_id 안에서:
    - building_faq.question (키워드)가
    - user_question 문자열에 포함되어 있는지 검색 (MySQL, INSTR 사용)
    """
    conn = connect_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT question, answer
                FROM building_faq
                WHERE building_id = %s
                  AND INSTR(LOWER(%s), LOWER(question)) > 0
                ORDER BY LENGTH(question) DESC
                LIMIT 5
                """,
                (building_id, user_question),
            )
            rows = cur.fetchall()
            return rows
    finally:
        conn.close()


def search_keyword_all_buildings(user_question: str, limit: int = 10):
    """
    buildingId 없이 캠퍼스 전체에서:
    - user_question 안에 포함된 키워드를 가진 FAQ들을 찾는다.
    - buildings 와 조인해서 몇 호관인지까지 가져온다.
    """
    conn = connect_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                  b.ho_number,
                  b.name AS building_name,
                  f.question AS keyword,
                  f.answer
                FROM building_faq f
                JOIN buildings b ON f.building_id = b.id
                WHERE INSTR(LOWER(%s), LOWER(f.question)) > 0
                ORDER BY LENGTH(f.question) DESC
                LIMIT %s
                """,
                (user_question, limit),
            )
            rows = cur.fetchall()
            return rows
    finally:
        conn.close()


# ----- 엔드포인트: 관리자 크롤링 → FAQ 자동 생성 -----
@app.post("/api/admin/crawl-building-faq")
async def crawl_building_faq(req: CrawlBuildingFaqRequest):
    """
    프론트엔드 '불러오기' 버튼에서 호출.
    - 페이지 HTML 크롤링 → 텍스트 변환
    - LLM으로 FAQ 추출
    - building_faq 테이블에 저장
    """
    html = fetch_html(req.url)
    page_text = html_to_text(html)
    faqs = llm_extract_faqs_from_page(
        building_id=req.buildingId,
        building_name=req.buildingName,
        url=req.url,
        page_text=page_text,
    )
    save_building_faqs(req.buildingId, faqs, replace_existing=req.replaceExisting)
    return {"buildingId": req.buildingId, "faqCount": len(faqs)}


# ----- Ollama(Llama 등) 호출을 포함한 메인 엔드포인트 (기존 기능) -----
@app.post("/api/building-ai", response_model=BuildingAIResponse)
async def building_ai(req: BuildingAIRequest):
    """
    - buildingId 가 있으면: 해당 건물 안에서 우선 FAQ/키워드 검색
    - 해당 건물에서 못 찾으면: 캠퍼스 전체에서 키워드 검색 (fallback)
    - buildingId 가 없으면: 처음부터 캠퍼스 전체에서 키워드 검색
    - 그 결과(knowledge)를 LLM에게 넘겨서 자연스럽게 답변 생성
    """
    building_id: Optional[str] = None
    if req.buildingId is not None:
        building_id = str(req.buildingId)

    knowledge_items: List[dict] = []

    # 1) buildingId 있는 경우: 해당 건물 스코프에서 먼저 검색
    if building_id:
        rows = search_by_keyword(building_id, req.question)
        for row in rows:
            knowledge_items.append(
                {
                    "scope": "building",
                    "building_label": req.buildingName or "해당 건물",
                    "keyword": row["question"],
                    "answer": row["answer"],
                }
            )

    # 2) 해당 건물에서 못 찾았거나 buildingId 가 없는 경우: 캠퍼스 전체 검색
    if not knowledge_items:
        matches = search_keyword_all_buildings(req.question, limit=10)
        for row in matches:
            label = f"{row['ho_number']}호관({row['building_name']})"
            knowledge_items.append(
                {
                    "scope": "campus",
                    "building_label": label,
                    "keyword": row["keyword"],
                    "answer": row["answer"],
                }
            )

    # 3) knowledge_items 를 텍스트 블록으로 변환
    if knowledge_items:
        knowledge_lines: List[str] = []
        for i, item in enumerate(knowledge_items, start=1):
            knowledge_lines.append(
                f"[{i}] 위치: {item['building_label']}\n"
                f"키워드: {item['keyword']}\n"
                f"설명: {item['answer']}\n"
            )
        knowledge_block = "\n".join(knowledge_lines)
    else:
        knowledge_block = "지식 없음"

    # 4) 프롬프트 구성
    user_prompt = f"""
너는 대학교 캠퍼스 건물 안내 도우미야.

아래는 데이터베이스에서 가져온 내부 지식이야.
이 지식을 최우선으로 사용해서, 사용자 질문에 대한 답을 자연스럽게 한국어로 설명해 줘.

지식:
---
{knowledge_block}
---

건물 이름(선택): {req.buildingName or '알 수 없음'}
추가 컨텍스트(선택): {req.context or ''}

사용자 질문:
"{req.question}"

규칙:
1. 지식이 있으면, 어떤 호관에 무엇이 있는지 쉽게 풀어서 설명한다.
2. 여러 건물이 나오면, 보기 좋게 정리해서 안내한다.
3. 지식이 전혀 없으면, 모른다고 말하거나 정확하지 않을 수 있다고 주의해 준다.
4. '~호관에 ~가 있습니다' 형태를 사용하면 좋다.
    """.strip()

    # 🔥 Ollama(OpenAI 호환 /v1/chat/completions) 호출
    completion = client.chat.completions.create(
        model= os.getenv("LLM_MODEL"),  # ← Ollama에 pull 해둔 모델 이름으로 변경
        messages=[
            {
                "role": "system",
                "content": "당신은 대학 캠퍼스의 건물과 시설을 안내하는 챗봇입니다.",
            },
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
    )

    answer = completion.choices[0].message.content
    return BuildingAIResponse(answer=answer)
