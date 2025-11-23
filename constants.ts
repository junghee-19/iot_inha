// FIX: Import the `BuildingName` type to fix reference errors caused by a circular dependency between `types.ts` and `constants.ts`.
import type { Building, DirectoryRow, FloorPlanLabel, BuildingName } from './types';

export const BUILDING_NAMES = ['본관','1호관', '2호관', '3호관', '4호관', '5호관', '6호관', '7호관', '8호관', '9호관', '10호관', '11호관'] as const;

// Helper to generate placeholder floor plan labels in descending order for the UI
const generateFloorPlanLabels = (
    levels: string[],
    overrides?: Record<string, string>,
): FloorPlanLabel[] => {
    const images = [
        'https://i.imgur.com/sC3a3gC.png',
        'https://i.imgur.com/V7XJ4er.png',
        'https://i.imgur.com/8z2Q5M4.png',
        'https://i.imgur.com/gO0A3v1.png',
    ];
    return [...levels].reverse().map((level, index) => ({
        level,
        image: overrides?.[level] ?? images[index % images.length],
    }));
};

// Helper to generate placeholder directory rows in ascending order
const generateDirectory = (levels: string[]): DirectoryRow[] => {
    return levels.map(level => ({
        level,
        columns: [[{ name: `${level} 주요 시설` }], [{ name: `${level} 기타 시설` }]],
    }));
};

const createDirectoryRow = (level: string, roomNames: string[]): DirectoryRow => ({
    level,
    columns: [roomNames.map(name => ({ name }))],
});

const customDirectories: Partial<Record<BuildingName, DirectoryRow[]>> = {
    '본관': [
        createDirectoryRow('B1F', [
            'B101호: 학생상담실',
        ]),
        createDirectoryRow('3F', [
            '303호: 소회의실',
            '313호: 다목적 서비스 프로젝트 실습실',
        ]),
        createDirectoryRow('4F', [
            '403호: EOP강의실(1)',
            '404호: EOP강의실(2)',
            '405호: EOP강의실(3)',
            '406호: EOP강의실(4)',
            '407호: EOP강의실(5)',
            '408호: EOP강의실(6)',
            '409호: 유학생 강의실 & EOP강의실(9)',
            '410호: 글로벌 라운지',
            '413호: 기도실',
        ]),
        createDirectoryRow('5F', [
            '520호: 공동훈련센터',
        ]),
        createDirectoryRow('옥상', [
            '물탱크실 · 탱크실(실습실/휴게실 없음)',
        ]),
    ],
    '1호관': [
        createDirectoryRow('1F', [
            '101호: 이미지메이킹실습실',
            '103호: 여학생휴게실(1)',
            '105호: 비행실습실(2)',
            '106호: 비행실습준비실(1)',
            '107호: 비행실습실(1)',
        ]),
        createDirectoryRow('2F', [
            '201호: 서비스기초실습실(1)',
            '202호: 관광/호텔실무실습실',
            '204호: 항공실무실습실(1)',
            '204호: 항공실무실습실(2)',
        ]),
        createDirectoryRow('3F', [
            '301호: 서비스기초실습실(2)',
            '303호: 의사전달실습실(1)',
            '304호: 식음료실습준비실',
            '305호: 식음료 실습실',
        ]),
        createDirectoryRow('4F', [
            '401호: 항공종합실 실습실',
        ]),
        createDirectoryRow('5F', [
            '501호: 의사전달실습실(3)',
        ]),
    ],
    '2호관': [
        createDirectoryRow('B1F', [
            'B101호: 소성실',
            'B102호: 서비스학부공용실습실(1)',
            'B103호: 서비스학부공용실습실(2)',
            'B104호: 서비스학부공용실습실(3)',
            'B106호: 창업동아리 운영실',
            'B107호: 항공종합프로젝트실(1)',
            'B108호: 항공종합프로젝트실(2)',
            'B109호: 항공종합프로젝트실(3)',
            'B110호: 항공종합프로젝트실(4)',
            'B111호: 항공종합실습실',
            'B112호: 관광종합실습실',
            'B113호: 도자공예실습실',
        ]),
        createDirectoryRow('1F', [
            '101호: 양생 실습실',
        ]),
        createDirectoryRow('2F', [
            '201호: 실습준비실',
            '202호: 비행실습실(3)',
            '203호: 융합서비스실습실',
            '207호: 소묘실습실',
        ]),
        createDirectoryRow('3F', [
            '303호: 산업디자인과 PC실습실',
            '304호: 마스터실습실',
            '305호: 실습준비실',
            '306호: 컴퓨터디자인실습실(Mac실)',
            '307호: 기계요소설계실습실',
        ]),
        createDirectoryRow('4F', [
            '401호: 패턴실습실',
            '403호: 의복구성실습실',
            '404호: 실습준비실',
            '405호: 디자인실습실',
            '406호: 패션 선정보실습실',
        ]),
        createDirectoryRow('5F', [
            '502호: 시청각교육실',
            '502A호: 시청각준비실',
        ]),
        createDirectoryRow('옥상', [
            '601호: 교육방송국(선곡실 · 스튜디오 · 제작실 · 기술실 포함)',
        ]),
    ],
    '3호관': [
        createDirectoryRow('B1F', [
            'B101호: 제도실',
        ]),
        createDirectoryRow('1F', [
            '104호: 카페',
            '106b호: VR 체험실습실',
        ]),
        createDirectoryRow('2F', [
            '203B호: VR 모의면접체험실',
        ]),
        createDirectoryRow('3F', [
            '303호: 사이버프라자(3)',
        ]),
        createDirectoryRow('4F', [
            '403호: 사이버프라자(4)',
        ]),
        createDirectoryRow('5F', [
            '503호: 강의준비실',
        ]),
    ],
    '4호관': [
        createDirectoryRow('1F', [
            '101호: 전자계측실험실',
            '102호: 전력실습실',
            '103호: 구조실험실',
            '103A호: 구조실험 제어실',
            '104호: 건설재료양생실습실',
            '104A호: 건설재료실험실',
        ]),
        createDirectoryRow('2F', [
            '201호: 실습운영실(1)',
            '203호: 정보통신시스템실습실',
            '204호: 임베디드 실습실',
            '205호: IOT실습실',
            '206호: 자동제어실습실',
        ]),
        createDirectoryRow('3F', [
            '301호: 전자CAD실습실',
            '302호: 마이크로프로세서실습실',
            '303호: 개방 PC실',
            '305호: PC실(5)',
            '306호: 네트워크장비실습실',
            '307호: 컴퓨터네트워크실습실',
        ]),
        createDirectoryRow('4F', [
            '401호: 웹프로그래밍실습실',
            '402호: 데이터베이스 프로그래밍실습실',
            '403호: 클라우드 컴퓨팅실습실',
            '404호: 임베디드 SW실습실',
            '405호: 사물인터넷실습실',
            '406호: 컴퓨터시스템실습실',
            '407호: 전자회로실습실',
            '408호: PC지원실(2)',
        ]),
        createDirectoryRow('5F', [
            '501호: 건축설계실습실',
            '501A호: 건축설계 PC실',
            '502호: 도시단지설계실',
            '503호: BIM통합설계실',
            '504호: 모형제작 준비실',
            '505호: 모형제작실습실',
            '506호: 건축의장실습실',
            '507호: 건축제도실습실',
        ]),
        createDirectoryRow('6F', [
            '601호: 세미나실(1)',
            '602호: 세미나실(2)',
            '603호: 세미나실(3)',
            '604호: 창업스페이스',
            '605호: 개방실습실(2)',
        ]),
    ],
    '5호관': [
        createDirectoryRow('B1F', [
            'B104호: 회류수조실험실',
            'B105호: 동아리실',
        ]),
        createDirectoryRow('1F', [
            '108호: 보건실(대기실 · 처치실 · 안정실 포함)',
            '109호: 사무실무실습실',
            '110호: 사무실무실습실(회의)',
            '111호: 사무실무실습실(면접)',
            '112호: U-강의실',
            '113호: 교수학습지원실',
        ]),
        createDirectoryRow('2F', [
            '208호: 사이버프라자(1)',
            '218호: 네트워크설계 PC실',
            '219호: PC실(7)',
            '220호: CAD/CAE실습실',
        ]),
        createDirectoryRow('3F', [
            '308호: 강사실',
            '312호: 캡스톤디자인실',
            '315A호: 매체제작실(1)',
            '316호: eLive class',
        ]),
        createDirectoryRow('4F', [
            '408호: PC지원실(1)',
            '409호: CAD실(2)',
            '410호: CAD실(1)',
            '411호: CAD실(3)',
            '412호: W/S실',
            '413호: PC실(3)',
            '414호: PC실(2)',
            '415호: PC실(1)',
        ]),
    ],
    '6호관': [
        createDirectoryRow('1F', [
            '109호: 여학생휴게실',
        ]),
        createDirectoryRow('2F', [
            '210호: 공간정보 특성화 프로그램실',
        ]),
        createDirectoryRow('3F', [
            '309호: emu 운영센터',
            '310호: 공간분석실습실',
            '311호: 원격탐사실습실',
        ]),
    ],
    '7호관': [
        createDirectoryRow('2F', [
            '201호: 제1일반열람실',
            '202호: 복도/휴게 공간',
            '203호: 그룹스터디(6)',
            '204호: 그룹스터디(5)',
            '205호: 그룹스터디(4)',
            '206호: 그룹스터디(3)',
            '207호: 그룹스터디(2)',
            '208호: 그룹스터디룸',
            '209호: 사이버프라자(5)',
            '210호: 그룹스터디룸(8)',
            '211호: 제2일반열람실',
        ]),
        createDirectoryRow('3F', [
            '301호: 인공지능 S/W 실습실',
            '302호: START-UP프로젝트실습실(3)',
            '310호: 매체제작실(2)',
            '315호: PC실(6)',
            '318호: PC실(7)',
        ]),
        createDirectoryRow('4F', [
            '401호: 지능응용SW실습실',
            '401A호: 실습관 준비실',
            '410호: 시스템 운영실',
            '413호: Studyroom',
        ]),
        createDirectoryRow('5F', [
            '501호: 첨단 강의실 3',
            '503호: 연구지원실(1)',
            '519호: 원격강의 스튜디오',
            '520호: 연구지원실(3)',
            '521호: 연구지원실(2)',
            '522호: 첨단 강의실 4',
        ]),
        createDirectoryRow('옥상', [
            '물탱크실(실습실/휴게실 없음)',
        ]),
    ],
    '10호관': [
        createDirectoryRow('1F', [
            '101호: 가구제작실습',
            '102호: 목구조/시공실습실',
        ]),
        createDirectoryRow('2F', [
            '203호: GIS실습실',
            '203A호: 도화실습실',
        ]),
        createDirectoryRow('3F', [
            '301호: 실내건축재료실습실',
            '303호: 실내건축모형제작실',
            '304호: 기초디자인실습실',
        ]),
        createDirectoryRow('4F', [
            '401호: 실내건축설계실',
            '404호: 디지털디자인출판설계실',
        ]),
        createDirectoryRow('옥상', [
            '물탱크실(실습실/휴게실 없음)',
        ]),
    ],
};

const buildDirectoryFor = (name: BuildingName, floors: string[]): DirectoryRow[] => {
    const base = generateDirectory(floors);
    const overrides = customDirectories[name];
    if (!overrides) return base;

    const overrideMap = new Map(overrides.map(row => [row.level, row]));
    return base.map(row => overrideMap.get(row.level) ?? row);
};

const customFloorPlanImages: Partial<Record<BuildingName, Record<string, string>>> = {
    '본관': {
        'B1F': '/floor/KakaoTalk_Photo_2025-11-11-20-18-49 016.jpeg',
        '1F': '/floor/KakaoTalk_Photo_2025-11-11-20-18-49 017.jpeg',
        '2F': '/floor/KakaoTalk_Photo_2025-11-11-20-18-49 018.jpeg',
        '3F': '/floor/KakaoTalk_Photo_2025-11-11-20-18-49 019.jpeg',
        '4F': '/floor/KakaoTalk_Photo_2025-11-11-20-18-49 020.jpeg',
        '5F': '/floor/KakaoTalk_Photo_2025-11-11-20-18-49 021.jpeg',
        '옥상': '/floor/KakaoTalk_Photo_2025-11-11-20-18-49 022.jpeg',
    },
    '1호관': {
        '1F': '/floor/1호관_1층 평면도 Model.jpg',
        '2F': '/floor/1호관_2층 평면도 Model.pdf.jpg',
        '3F': '/floor/1호관_3층 평면도 Model.pdf (1).jpg',
        '4F': '/floor/1호관_4층 평면도 Model.jpg',
        '5F': '/floor/1호관_5층 평면도 Model.pdf.jpg',
        '옥상': '/floor/1호관_옥상층층 평면도 Model.pdf.jpg',
    },
    '2호관': {
        'B1F': '/floor/2호관_지하 평면도 Model.pdf.jpg',
        '1F': '/floor/2호관_1층 평면도 Model.pdf.jpg',
        '2F': '/floor/2호관_2층 평면도 Model.pdf.jpg',
        '3F': '/floor/2호관_3층 평면도 Model.pdf.jpg',
        '4F': '/floor/2호관_4층 평면도 Model.pdf.jpg',
        '5F': '/floor/2호관_5층 평면도 Model.pdf.jpg',
        '옥상': '/floor/2호관_옥상 평면도 Model.pdf.jpg',
    },
    '3호관': {
        'B1F': '/floor/3호관_지하 평면도 Model.pdf.jpg',
        '1F': '/floor/3호관_1층 평면도 Model.pdf.jpg',
        '2F': '/floor/3호관_2층 평면도 Model.pdf.jpg',
        '3F': '/floor/3호관_3층 평면도 Model.pdf.jpg',
        '5F': '/floor/3호관_5층, 옥상 평면도 Model.pdf.jpg',
        '옥상': '/floor/3호관_5층, 옥상 평면도 Model.pdf.jpg',
    },
    '4호관': {
        'B1F': '/floor/4호관_지하 Model.pdf.jpg',
        '1F': '/floor/4호관_1층, 옥상 평면도 Model.pdf.jpg',
        '2F': '/floor/4호관_2층평면도 Model.pdf.jpg',
        '3F': '/floor/4호관_3층평면도 Model.pdf.jpg',
        '4F': '/floor/4호관_4층평면도 Model.pdf.jpg',
        '5F': '/floor/4호관_5층평면도 Model.pdf.jpg',
        '6F': '/floor/4호관_6층평면도 Model.pdf.jpg',
        '옥상': '/floor/4호관_1층, 옥상 평면도 Model.pdf.jpg',
    },
    '5호관': {
        'B1F': '/floor/5호관_지하층 Model.pdf.jpg',
        '1F': '/floor/5호관_1층 Model.pdf.jpg',
        '2F': '/floor/5호관_2층 Model.pdf.jpg',
        '3F': '/floor/5호관_3층 Model.pdf.jpg',
        '4F': '/floor/5호관_4층 Model.pdf.jpg',
        '옥상': '/floor/5호관_옥상 Model.pdf.jpg',
    },
    '6호관': {
        '1F': '/floor/KakaoTalk_Photo_2025-11-11-20-18-49 001.jpeg',
        '2F': '/floor/KakaoTalk_Photo_2025-11-11-20-18-49 002.jpeg',
        '3F': '/floor/KakaoTalk_Photo_2025-11-11-20-18-49 003.jpeg',
        'B1F': '/floor/KakaoTalk_Photo_2025-11-11-20-18-49 004.jpeg',
        '옥상': '/floor/KakaoTalk_Photo_2025-11-11-20-18-49 010.jpeg',
    },
    '7호관': {
        '1F': '/floor/KakaoTalk_Photo_2025-11-11-20-18-49 005.jpeg',
        '2F': '/floor/KakaoTalk_Photo_2025-11-11-20-18-49 006.jpeg',
        '3F': '/floor/KakaoTalk_Photo_2025-11-11-20-18-49 007.jpeg',
        '4F': '/floor/KakaoTalk_Photo_2025-11-11-20-18-49 008.jpeg',
        '5F': '/floor/KakaoTalk_Photo_2025-11-11-20-18-49 009.jpeg',
        '옥상': '/floor/KakaoTalk_Photo_2025-11-11-20-18-49 010.jpeg',
    },
    '10호관': {
        '1F': '/floor/KakaoTalk_Photo_2025-11-11-20-18-49 011.jpeg',
        '2F': '/floor/KakaoTalk_Photo_2025-11-11-20-18-49 012.jpeg',
        '3F': '/floor/KakaoTalk_Photo_2025-11-11-20-18-49 013.jpeg',
        '4F': '/floor/KakaoTalk_Photo_2025-11-11-20-18-49 014.jpeg',
        '옥상': '/floor/KakaoTalk_Photo_2025-11-11-20-18-49 015.jpeg',
    },
    '11호관': {
        'B2F': '/floor/4호관_지하 Model.pdf.jpg',
        'B1F': '/floor/5호관_지하층 Model.pdf.jpg',
        '1F': '/floor/4호관_1층, 옥상 평면도 Model.pdf.jpg',
        '2F': '/floor/4호관_2층평면도 Model.pdf.jpg',
        '3F': '/floor/4호관_3층평면도 Model.pdf.jpg',
        '4F': '/floor/4호관_4층평면도 Model.pdf.jpg',
        '5F': '/floor/4호관_5층평면도 Model.pdf.jpg',
        '옥상': '/floor/4호관_1층, 옥상 평면도 Model.pdf.jpg',
    },
};

  
// Defines the floor structure for each building
const buildingFloors: Record<string, string[]> = {
    '본관': ['B1F', '1F', '2F', '3F', '4F', '5F', '옥상'],
    '1호관': ['1F', '2F', '3F', '4F', '5F', '옥상'],
    '2호관': ['B1F', '1F', '2F', '3F', '4F', '5F', '옥상'],
    '3호관': ['B1F', '1F', '2F', '3F', '4F', '5F', '옥상'],
    '4호관': ['B1F', '1F', '2F', '3F', '4F', '5F', '6F', '옥상'],
    '5호관': ['B1F', '1F', '2F', '3F', '4F', '옥상'],
    '6호관': ['B1F', '1F', '2F', '3F', '옥상'],
    '7호관': ['1F', '2F', '3F', '4F', '5F', '옥상'],
    '8호관': ['1F', '2F', '3F'], // Default as per original template
    '9호관': ['1F', '2F', '3F'], // Default as per original template
    '10호관': ['1F', '2F', '3F', '4F', '옥상'],
    '11호관': ['B2F', 'B1F', '1F', '2F', '3F', '4F', '5F', '옥상'],
};

// constants.ts
export const buildingImages: Record<string, string> = {
    '본관': '/assets/본관.jpg', 
    '1호관': '/assets/1호관.jpg',
    '2호관': '/assets/2호관.jpg',
    '3호관': '/assets/3호관.jpg',
    '4호관': '/assets/4호관.jpg',
    '5호관': '/assets/5호관.jpg',
    '6호관': '/assets/6호관.jpg',
    '7호관': '/assets/7호관.jpg',
    '8호관': '/assets/8호관.jpg',
    '9호관': '/assets/9호관.jpg',
    '10호관': '/assets/10호관.jpg',
    '11호관': '/assets/11호관.jpg',
  };
  // 모든 `import buildingXImage from 'public/...';` 줄은 삭제
  

// Generate the final data for all buildings
export const BUILDING_DATA: Building[] = BUILDING_NAMES.map((name, index) => {
    const floors = buildingFloors[name as BuildingName] || [];
    return {
        id: index + 1,
        name: name as BuildingName,
        image: buildingImages[name as BuildingName],
        floorPlanLabels: generateFloorPlanLabels(floors, customFloorPlanImages[name as BuildingName]),
        directory: buildDirectoryFor(name as BuildingName, floors),
    };
});
