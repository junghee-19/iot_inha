# websocket/websocket.mjs.md

## 개요
브라우저 WebSocket 클라이언트 이니셜라이저입니다.

## 동작
- URL 해석: `import.meta.env.VITE_WS_URL` → `process.env.VITE_WS_URL` → `process.env.WS_URL` → `ws://localhost:6060`.
- 중복 소켓을 방지하고, 브라우저 환경이 아니면 건너뜁니다.
- open/message/close/error에 콘솔 로그 핸들러를 붙이고 소켓을 반환합니다.
