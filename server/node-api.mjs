import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import { OpenAI } from 'openai';
import * as cheerio from 'cheerio';
import mysql from 'mysql2/promise';
import 'dotenv/config';

// ----- 환경설정 -----
const PORT = Number(process.env.API_PORT ?? 8000);
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN ?? '*';

// OpenAI(API) 우선, 없으면 Ollama 호환(baseURL)으로 fallback
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OLLAMA_API_KEY || 'ollama',
  baseURL: process.env.OPENAI_BASE_URL || process.env.OLLAMA_BASE_URL || undefined,
});

// ----- DB 연결 -----
const createPool = () =>
  mysql.createPool({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'iot',
    waitForConnections: true,
    connectionLimit: 10,
  });

const pool = createPool();

// ----- HTML fetch & 파싱 -----
const fetchHtml = async (url) => {
  // 1) 정상 fetch
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`status ${res.status}`);
    return await res.text();
  } catch (err) {
    // 2) SSL 우회 (verify 끔)
    if (url.startsWith('https://')) {
      const insecureAgent = new https.Agent({ rejectUnauthorized: false });
      try {
        const res = await fetch(url, { agent: insecureAgent });
        if (!res.ok) throw new Error(`status ${res.status}`);
        return await res.text();
      } catch (err2) {
        // 3) http 강제 다운그레이드
        const downgraded = 'http://' + url.slice('https://'.length);
        try {
          const res = await fetch(downgraded);
          if (!res.ok) throw new Error(`status ${res.status}`);
          return await res.text();
        } catch (err3) {
          throw new Error(`HTML fetch failed: ${err3.message}`);
        }
      }
    }
    throw new Error(`HTML fetch failed: ${err.message}`);
  }
};

const htmlToText = (html) => {
  const $ = cheerio.load(html);
  $('script,style,nav,footer,header').remove();
  const text = $('body').text();
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n');
};

// ----- LLM FAQ 추출 -----
const extractFaqsWithLlm = async ({ buildingId, buildingName, url, pageText }) => {
  const systemPrompt = `
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
`.trim();

  const userPrompt = `
[건물 ID]
${buildingId}

[건물 이름]
${buildingName || '알 수 없음'}

[페이지 URL]
${url}

[페이지 전체 텍스트]
${pageText}
`.trim();

  const completion = await client.chat.completions.create({
    model: process.env.LLM_MODEL || process.env.SLM_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  });

  let data;
  try {
    data = JSON.parse(completion.choices[0].message.content || '{}');
  } catch (err) {
    throw new Error(`LLM JSON parse error: ${err.message}`);
  }

  const faqs = Array.isArray(data.faqs) ? data.faqs : [];
  return faqs
    .map((item) => ({
      question: (item?.question || '').trim(),
      answer: (item?.answer || '').trim(),
    }))
    .filter((item) => item.question && item.answer);
};

// ----- DB 저장 -----
const saveFaqs = async ({ buildingId, faqs, replaceExisting }) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute('SELECT id FROM buildings WHERE id = ?', [buildingId]);
    if (!rows || rows.length === 0) {
      const err = new Error(`building_id '${buildingId}' not found in buildings`);
      err.status = 400;
      throw err;
    }

    await conn.beginTransaction();
    if (replaceExisting) {
      await conn.execute('DELETE FROM building_faq WHERE building_id = ?', [buildingId]);
    }

    if (faqs.length) {
      const values = faqs.map((f) => [buildingId, f.question, f.answer]);
      await conn.query(
        'INSERT INTO building_faq (building_id, question, answer) VALUES ?',
        [values],
      );
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// ----- 유틸 -----
const readJson = (req) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        const json = JSON.parse(body || '{}');
        resolve(json);
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });

const sendJson = (res, status, payload) => {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
};

// ----- 서버 -----
const server = http.createServer(async (req, res) => {
  const parsed = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === 'POST' && parsed.pathname === '/api/admin/crawl-building-faq') {
    try {
      const body = await readJson(req);
      const { buildingId, buildingName = null, url, replaceExisting = true } = body || {};
      if (!buildingId || !url) {
        sendJson(res, 400, { detail: 'buildingId and url are required' });
        return;
      }

      const html = await fetchHtml(String(url));
      const text = htmlToText(html);
      const faqs = await extractFaqsWithLlm({
        buildingId: String(buildingId),
        buildingName: buildingName ? String(buildingName) : null,
        url: String(url),
        pageText: text,
      });
      await saveFaqs({ buildingId: String(buildingId), faqs, replaceExisting: !!replaceExisting });

      sendJson(res, 200, { buildingId: String(buildingId), faqCount: faqs.length });
    } catch (err) {
      console.error('[crawl] error:', err);
      const status = err.status || 502;
      sendJson(res, status, { detail: err.message || 'server error' });
    }
    return;
  }

  // Not found
  sendJson(res, 404, { detail: 'Not Found' });
});

server.listen(PORT, () => {
  console.log(`[api] node crawl server listening on http://localhost:${PORT}`);
});
