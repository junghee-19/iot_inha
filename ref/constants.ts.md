# constants.ts.md

## 개요
건물 메타데이터(이름, 이미지, 층 라벨, 디렉터리) 집합입니다.

## 구성
- `BUILDING_NAMES`: 정렬된 건물 이름 목록(일부 한글이 깨져 있음).
- 헬퍼: `generateFloorPlanLabels`, `generateDirectory`, `createDirectoryRow`.
- `customDirectories`: 건물별 층/시설 오버라이드.
- `buildDirectoryFor`: 기본값과 오버라이드를 병합.
- `customFloorPlanImages`: 건물·층별 플로어 플랜 이미지 경로.
- `buildingImages`: 이름 → /assets 이미지 경로 매핑.
- `buildingFloors`: 건물별 층 라벨 배열.
- `BUILDING_DATA`: `Building[]`(id, name, image, floorPlanLabels, directory)로 조립.

## 메모
여러 한글 문자열·파일명이 깨져 있으므로 UTF-8 소스와 자산 경로를 확인하세요.
