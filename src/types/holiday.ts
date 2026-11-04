export type Lang = 'ko' | 'ja';
export type EventScope = 'KR' | 'JP' | 'Both';

export interface Holiday {
    date: string;
    localName: string;
    isPublicHoliday: boolean; // 법정 공휴일 여부 (기념일·祭日은 false)
}

export interface UserEvent {
    id: string;
    date: string;
    title: string;
    type: 'meeting' | 'holiday'; // 일정 성격
    countryCode: EventScope; // 관련 국가
}

export interface ConflictMarkers {
    [date: string]: {
        type: 'kr' | 'jp' | 'both';
    };
}

// 컴포넌트 Props 규격
export interface DashboardProps {
    jpHolidays: Holiday[];
    krHolidays: Holiday[];
    initialMonth: string; // 서버 기준 월 (yyyy-MM-01), 타임존과 무관하게 동일하게 해석됨
}

export interface ScheduleAdvice {
    status: 'work' | 'holiday' | 'match' | 'kr-only' | 'jp-only';
    message: string;
}

// 추천 일정 아이템 타입
export interface RecommendedDay {
    date: string;
    score: number;
    reason: string;
}
