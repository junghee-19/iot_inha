# index.tsx.md

## 개요
React 엔트리포인트로, WebSocket 클라이언트를 초기화하고 `<App />`을 렌더링합니다.

## 동작
- `#root`를 가져오며 없으면 예외를 던집니다.
- `websocket/websocket.mjs`의 `initSocket()`을 호출해 콘솔 로그용 소켓을 연다.
- `ReactDOM.createRoot`로 `<App />`을 `React.StrictMode` 안에 렌더링합니다.
