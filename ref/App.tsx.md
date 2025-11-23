# App.tsx.md

## 개요
캠퍼스 안내 메인 React 앱 셸로, 선택된 건물과 센서 상태를 관리하며 전체 레이아웃을 구성합니다.

## 주요 상태
- `activeBuilding`: 현재 선택된 건물(`BuildingName`).
- `sensorStatus`: `idle | syncing | live | waiting | error`.
- `sensorError`, `lastTouchedAt`: 센서 피드 오류와 타임스탬프.

## 동작
- 마운트 시 3초 주기로 `fetchCurrentBuilding`을 폴링해 센서 데이터를 갱신하고 Abort/에러를 처리합니다.
- Header, 센서 상태 배너, Navigation, BuildingInfo를 렌더링하며, 푸터에 SparkleIcon을 표시합니다.

## 의존성
`Header`, `Navigation`, `BuildingInfo`, `SparkleIcon`, `BUILDING_DATA`, `fetchCurrentBuilding`, Tailwind 스타일.
