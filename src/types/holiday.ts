export interface Holiday {
    date: string;
    localName: string;
    name: string;
    countryCode: string;
    fixed: boolean;
    global: boolean;
    counties: string[] | null;
    launchYear: number[] | null;
    types: string[];
}

export interface UserEvent {
    id: string;
    date: string;
    title: string;
    type: 'meeting' | 'holiday' | 'personal' | 'deadline'; // 일정 성격
    countryCode?: 'KR' | 'JP' | 'Both'; // 관련 국가
}

// 비즈니스 로직용 타입
export type Lang = 'ko' | 'ja';

export interface ConflictMarkers {
    [date: string]: {
        type: 'kr' | 'jp' | 'both';
    };
}

// 컴포넌트 Props 규격
export interface DashboardProps {
    jpHolidays: Holiday[];
    krHolidays: Holiday[];
    initialTimestamp: number;
}

export interface ScheduleAdvice {
    status: 'work' | 'holiday' | 'caution' | 'match' | 'kr-only' | 'jp-only';
    message: string;
    color: string; // UI 색상 제어용
}

// 추천 일정 아이템 타입
export interface RecommendedDay {
    date: string;
    score: number;
    reason: string;
}