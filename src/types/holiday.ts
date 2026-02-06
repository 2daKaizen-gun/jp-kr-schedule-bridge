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

// phase 3 data
export interface ScheduleAdvice {
    status: 'work' | 'holiday' | 'caution';
    message: string;
    jpStatus: string;
    krStatus: string;
}

export interface UserEvent {
    id: string;
    date: string;
    title: string;
    type: 'meeting' | 'holiday' | 'personal' | 'deadline'; // 일정 성격
    countryCode?: 'KR' | 'JP' | 'Both'; // 관련 국가
}