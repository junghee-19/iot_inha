# websocket/server.mjs.md

## 개요
센서 코드를 수신하고 최신 값을 제공하는 예시 Node HTTP + WebSocket 서버입니다.

## HTTP API
- `GET /api/building`: `{ buildingId, touchedAt, sensorCode }` 반환.
- `OPTIONS`: CORS 헤더와 함께 204. 기타: 404 JSON.

## WebSocket
- 기본 `ws://0.0.0.0:6060`에서 수신. 연결 시 인사 메시지 전송, 메시지 수신 시 센서 코드를 파싱해 `latestReading`을 갱신하고 매핑을 로그로 남깁니다.

## 매핑
- 코드 0–11을 허용하며 `BUILDING_COUNT` 환경변수(기본 11)로 상한을 둡니다. 오버라이드는 주석 처리됨.
- `latestReading`은 buildingId/sensorCode/touchedAt ISO 문자열을 저장합니다.

## 사용법
`initSocket()`이 두 서버를 시작하며, 파일을 직접 실행할 때 자동 실행됩니다. `npm run sockStart`가 이를 사용합니다.
