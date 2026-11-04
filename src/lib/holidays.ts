import type { Holiday, Lang, RecommendedDay, ScheduleAdvice } from "@/types/holiday";
import { format, addDays, differenceInCalendarDays, getDay, parseISO } from 'date-fns';

// Google Calendar API
const GOOGLE_API_KEY = process.env.GOOGLE_CALENDAR_API_KEY;

// 국가별 캘린더 ID
const CALENDAR_IDS = {
    KR: 'ko.south_korea#holiday@group.v.calendar.google.com',
    JP: 'japanese__ja@holiday.calendar.google.com'
};

interface GoogleCalendarItem {
    summary: string;
    description?: string;
    start: { date?: string; dateTime?: string };
}

// Google 캘린더 일정의 description 첫 줄이 공휴일 분류를 나타냄
// (KR: 공휴일/기념일, JP: 祝日/祭日)
const PUBLIC_HOLIDAY_LABELS = ["공휴일", "祝日"];

export const isPublicHolidayDescription = (description?: string) => {
    const label = description?.split("\n")[0].trim() ?? "";
    return PUBLIC_HOLIDAY_LABELS.includes(label);
};

async function getHolidays(countryCode: keyof typeof CALENDAR_IDS, year: number): Promise<Holiday[]> {
    if (!GOOGLE_API_KEY) {
        console.warn("GOOGLE_CALENDAR_API_KEY is not set; holidays will be empty.");
        return [];
    }

    const calendarId = CALENDAR_IDS[countryCode];
    const timeMin = `${year}-01-01T00:00:00Z`;
    const timeMax = `${year}-12-31T23:59:59Z`;

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${GOOGLE_API_KEY}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;

    const response = await fetch(url, { next: { revalidate: 86400 } });

    // 실패 시 빈 배열 대신 예외를 던져, 재생성 중이면 직전 정상 페이지가 유지되게 함
    // (메시지에 API 키가 포함된 URL을 넣지 않음)
    if (!response.ok) {
        throw new Error(`Holiday API failed for ${countryCode} ${year}: ${response.status}`);
    }

    const data: { items?: GoogleCalendarItem[] } = await response.json();

    return (data.items ?? []).map((item) => ({
        date: item.start.date ?? item.start.dateTime?.split('T')[0] ?? "",
        localName: item.summary,
        isPublicHoliday: isPublicHolidayDescription(item.description)
    }));
}

// 연말에도 다음 해 달력과 추천일이 동작하도록 여러 연도를 합쳐서 반환
export async function getHolidaysForYears(countryCode: keyof typeof CALENDAR_IDS, years: number[]) {
    const results = await Promise.all(years.map(year => getHolidays(countryCode, year)));
    return results.flat();
}

// 양국 공휴일 비교, 비즈니스 조언 생성
export function analyzeBusinessDay(
    targetDate: string,
    krHolidays: Holiday[],
    jpHolidays: Holiday[],
    lang: Lang = 'ko'
): ScheduleAdvice {
    const day = getDay(parseISO(targetDate));

    if (day === 0 || day === 6) {
        return {
            status: 'holiday',
            message: lang === 'ko'
                ? '오늘은 주말입니다. 양국 모두 업무일이 아니므로 충분한 휴식을 취하세요.'
                : '本日は週末です。両国とも休業日のため、十分な休息をお取りください。'
        };
    }

    const isKrHoliday = krHolidays.some(h => h.date === targetDate && h.isPublicHoliday);
    const isJpHoliday = jpHolidays.some(h => h.date === targetDate && h.isPublicHoliday);

    if (isKrHoliday && isJpHoliday) {
        return {
            status: 'match',
            message: lang === 'ko'
                ? '양국 모두 공휴일이므로 긴급 업무 외에는 대응이 어렵습니다.'
                : '両国とも祝日のため、緊急業務以外の対応は困難です。'
        };
    }
    if (isKrHoliday) {
        return {
            status: 'kr-only',
            message: lang === 'ko'
                ? '한국만 휴일입니다. 일본 측 업무는 진행되나 한국 측 확인이 늦어질 수 있습니다.'
                : '韓国のみ祝日です。日本側の業務は進行しますが、韓国側の確認が遅れる可能性があります。'
        };
    }
    if (isJpHoliday) {
        return {
            status: 'jp-only',
            message: lang === 'ko'
                ? '일본만 휴일입니다. 일본 파트너사 회신 지연 가능성이 있으니 미리 일정을 조율하세요.'
                : '日本のみ祝日です。日本のパートナーからの返信が遅れる可能性があるため、事前に調整してください。'
        };
    }

    // 정상 근무일
    return {
        status: 'work',
        message: lang === 'ko'
            ? '양국 모두 영업일입니다. 원활한 파트너십과 미팅 진행에 최적화된 날입니다.'
            : '両国ともに営業日です。円滑な連携やミーティングの実施に最適な日です。'
    };
}

// 3일 이내로 이어지는 공휴일(사이에 주말이 낀 경우 포함)을 하나의 연휴 블록으로 묶음
export function getVacationBlocks(holidays: Holiday[]) {
    const publicHolidays = holidays
        .filter(h => h.isPublicHoliday)
        .sort((a, b) => a.date.localeCompare(b.date));

    const groups: Holiday[][] = [];
    for (const holiday of publicHolidays) {
        const currentGroup = groups.at(-1);
        const previous = currentGroup?.at(-1);
        if (currentGroup && previous && differenceInCalendarDays(parseISO(holiday.date), parseISO(previous.date)) <= 3) {
            currentGroup.push(holiday);
        } else {
            groups.push([holiday]);
        }
    }

    return groups.map(group => ({
        start: group[0].date,
        end: group[group.length - 1].date,
        displayNames: Array.from(new Set(group.map(h => h.localName))).join(', ')
    }));
}

// 추천 계산에서 제외할 날 (공휴일 또는 사용자 일정)
type BlockedDay = Pick<Holiday, 'date' | 'isPublicHoliday'>;

// 다가오는 2주 내의 날짜 중 협업하기 좋은 날 TOP3 추천
export function getRecommendedMeetingDays(
    days: BlockedDay[],
    today: Date,
    lang: Lang = 'ko'
): RecommendedDay[] {
    const blockedDates = new Set(days.filter(d => d.isPublicHoliday).map(d => d.date));
    const isBlocked = (date: Date) => blockedDates.has(format(date, 'yyyy-MM-dd'));
    const recommendations: RecommendedDay[] = [];

    for (let i = 1; i <= 14; i++) {
        const target = addDays(today, i);
        const day = getDay(target);
        // 주말과 금요일(회신이 다음 주로 밀리기 쉬움)은 추천하지 않음
        if (day === 0 || day === 6 || day === 5) continue;

        // 당일이나 다음 날이 휴일이면 제외
        if (isBlocked(target) || isBlocked(addDays(target, 1))) continue;

        // 2일 전후에 휴일이 있으면 점수를 낮춤
        const hasNearbyHoliday = isBlocked(addDays(target, -2)) || isBlocked(addDays(target, 2));

        recommendations.push({
            date: format(target, 'yyyy-MM-dd'),
            score: hasNearbyHoliday ? 70 : 100,
            reason: hasNearbyHoliday
                ? (lang === 'ko'
                    ? "인접 공휴일이 있어 업무 집중도가 낮을 수 있습니다."
                    : "近隣に祝日があるため、業務集中度が低下する可能性があります。")
                : (lang === 'ko'
                    ? "양국 모두 정상 근무일이며, 협업 효율이 극대화되는 날입니다."
                    : "両国ともに通常勤務日であり、協業効率が最大化される日です。")
        });
    }
    return recommendations.sort((a, b) => b.score - a.score).slice(0, 3);
}
