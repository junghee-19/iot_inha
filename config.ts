const DEFAULT_BACKEND_URL = 'http://localhost:8000';

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || DEFAULT_BACKEND_URL;

export const BUILDING_FEED_ENDPOINT = `${BACKEND_URL}/api/building`;

// 크롤링 전용 Node API (없으면 기본 백엔드 URL을 사용)
const DEFAULT_CRAWL_API_URL = BACKEND_URL;
export const CRAWL_API_URL =
  import.meta.env.VITE_CRAWL_API_URL?.replace(/\/$/, '') || DEFAULT_CRAWL_API_URL;

console.log(CRAWL_API_URL);
