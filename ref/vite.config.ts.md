# vite.config.ts.md

## 개요
React 플러그인과 crypto 폴리필이 포함된 Vite 설정입니다.

## 하이라이트
- `globalThis.crypto`가 없을 때 `webcrypto`로 폴리필.
- 개발 서버: host 0.0.0.0, port 3000.
- 환경 변수로부터 `process.env.API_KEY`/`GEMINI_API_KEY` 정의.
- 별칭: `@` → 프로젝트 루트, `@assets` → ./assets.
