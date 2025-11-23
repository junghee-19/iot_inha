# services/buildingFeed.ts.md

## 개요
건물 센서 피드를 가져오고 정규화합니다.

## 로직
- 검증 헬퍼: `isBuildingName`, `parseNumeric`, `getBuildingById`, `getBuildingFromSensorCode`.
- `fetchCurrentBuilding(signal?)`: `BUILDING_FEED_ENDPOINT`에 GET 요청; 실패 시 상태/본문을 포함해 throw. name/id/sensorCode에서 `buildingName`을 결정해 `{ buildingName|null, touchedAt, sensorCode, raw }`로 반환.

## 설정
엔드포인트는 `config.ts`에서(`VITE_BACKEND_URL` 또는 기본 localhost:4000) 구성됩니다.
