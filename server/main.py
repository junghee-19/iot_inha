# main.py
import os
from typing import List, Optional
from datetime import datetime

import pymysql
from pymysql.cursors import DictCursor
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel

# ----- 환경 변수 & 클라이언트 설정 -----
# 상위 폴더(../.env)에 있는 환경변수 로드
load_dotenv(dotenv_path="../.env")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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
        touchedAt=datetime.utcnow().isoformat()
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


# ----- Pydantic 모델 -----
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


# ----- GPT 호출을 포함한 메인 엔드포인트 -----
@app.post("/api/building-ai", response_model=BuildingAIResponse)
async def building_ai(req: BuildingAIRequest):
    """
    - buildingId 가 있으면: 해당 건물 안에서 우선 FAQ/키워드 검색
    - 해당 건물에서 못 찾으면: 캠퍼스 전체에서 키워드 검색 (fallback)
    - buildingId 가 없으면: 처음부터 캠퍼스 전체에서 키워드 검색
    - 그 결과(knowledge)를 GPT에게 넘겨서 자연스럽게 답변 생성
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

    # 🔥 2) 해당 건물에서 아무것도 못 찾았거나 buildingId 자체가 없는 경우:
    #     캠퍼스 전체에서 검색 (fallback / global 검색)
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

    # 4) GPT 프롬프트 구성
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

    completion = client.chat.completions.create(
        model="gpt-4.1-mini",  # 필요하면 다른 모델로 변경
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