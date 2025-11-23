# types.ts.md

## 개요
건물 데이터에 쓰이는 공용 TypeScript 타입입니다.

## 타입
- `BuildingName`: `BUILDING_NAMES`에서 생성된 유니온.
- `Room { name }`.
- `DirectoryRow { level, columns: Room[][] }`.
- `FloorPlanLabel { level, image }`.
- `Building { id, name, image, floorPlanLabels, directory }`.
