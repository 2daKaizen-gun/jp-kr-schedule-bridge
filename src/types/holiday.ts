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