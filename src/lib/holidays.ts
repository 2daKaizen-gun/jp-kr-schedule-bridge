import { Holiday } from "@/types/holiday";
import { cache } from "react"; // react 캐시 기능 불러오기
import { format, addDays, getDay, parseISO } from 'date-fns';

// Google Calendar API
const GOOGLE_API_KEY = process.env.GOOGLE_CALENDAR_API_KEY;

// 국가별 캘린더 ID
const CALENDAR_IDS: {[key: string]: string } = {
    KR: 'ko.south_korea#holiday@group.v.calendar.google.com',
    JP: 'japanese__ja@holiday.calendar.google.com'
};

// 실질적인 휴무일인지 판별 (한국의 어버이날 등 제외)
export const isActualPublicHoliday = (holiday: Holiday) => {
    const EXCLUDED = ["노동절", "어버이날", "스승의날", "제헌절", "국군의날"];
    return (
        (!holiday.localName.includes("Day") || 
         holiday.localName.includes("Replacement") || 
         holiday.localName.includes("Memorial")) && 
        !EXCLUDED.includes(holiday.localName)
    );
};

export async function getHolidays(countryCode:string, year: number = 2026): Promise<Holiday[]> {
    const calendarId = CALENDAR_IDS[countryCode];
    const timeMin = `${year}-01-01T00:00:00Z`;
    const timeMax = `${year}-12-31T23:59:59Z`;
  
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${GOOGLE_API_KEY}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;

    try {
        const response = await fetch(url)
        const data = await response.json();
        // [체크 1] API가 에러를 반환했는지 확인
        if (data.error) return [];
        // [체크 2] items 데이터가 있는지 확인
        if (!data.items) return [];

        // 우리 Holiday 인터페이스에 맞게 가공함
        return data.items.map((item: any) => ({
            date: item.start.date || item.start.dateTime.split('T')[0],
            localName: item.summary,
            name: item.summary,
            countryCode: countryCode,
            // 기존 인터페이스 호환
            fixed: true,
            global: true,
            counties: null,
            launchYear: null,
            types: ['Public']
        }));
    } catch (error) {
        return [];
    }
}

// 같은 요청 여러 번 해도 한 번만 실행 (Memoization)
export const getCachedHolidays = cache(async (countryCode: string, year: number = 2026) => {
    return await getHolidays(countryCode, year);
});

// 양국 공휴일 비교, 비즈니스 조언 생성
export function analyzeBusinessDay(
    targetDate: string,
    krHolidays: Holiday[],
    jpHolidays: Holiday[],
    lang: 'ko' | 'ja' = 'ko'
) {
    const date = parseISO(targetDate);
    const day = getDay(date);

    if (day === 0 || day === 6) {
        return {
            status: 'holiday',
            message: lang === 'ko' 
                ? '오늘은 주말입니다. 양국 모두 업무일이 아니므로 충분한 휴식을 취하세요.' 
                : '本日は週末です。両国とも休業日のため、十分な休息をお取りください。',
            color: 'gray'
        };
    }

    const iskrHoliday = krHolidays.some(h => h.date === targetDate && isActualPublicHoliday(h));
    const isjpHoliday = jpHolidays.some(h => h.date === targetDate && isActualPublicHoliday(h));

    if (iskrHoliday && isjpHoliday) {
        return {
            status: 'match',
            message: lang === 'ko'
                ? '양국 모두 공휴일이므로 긴급 업무 외에는 대응이 어렵습니다.'
                : '両国とも祝日のため、緊急業務以外の対応は困難です。',
            color: 'gray'
        };
    } else if (iskrHoliday) {
        return {
            status: 'kr-only',
            message: lang === 'ko'
                ? '한국만 휴일입니다. 일본 측 업무는 진행되나 한국 측 확인이 늦어질 수 있습니다.'
                : '韓国のみ祝日です。日本側の業務は進行しますが、韓国側の確認が遅れる可能性があります。',
            color: 'red'
        };
    } else if (isjpHoliday) {
        return {
            status: 'jp-only',
            message: lang === 'ko'
                ? '일본만 휴일입니다. 일본 파트너사 회신 지연 가능성이 있으니 미리 일정을 조율하세요.'
                : '日本のみ祝日です。日本のパートナーからの返信が遅れる可能性があるため、事前に調整してください。',
            color: 'blue'
        };
    }

    // 정상 근무일
    return {
        status: 'work',
        message: lang === 'ko'
            ? '양국 모두 영업일입니다. 원활한 파트너십과 미팅 진행에 최적화된 날입니다.'
            : '両国ともに営業日です。円滑な連携やミーティングの実施に最適な日です。',
        color: 'green'
    };
}

// 연속된 휴일(주말 + 공휴일)을 찾아내 연휴 블록 반환 함수
export function getVacationBlocks(holidays: Holiday[]) {
    if(!holidays || holidays.length === 0) return [];

    // 날짜순 정렬
    const sortedHolidays = [...holidays].sort((a,b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const blocks: {start: string; end: string; count: number; displayNames: string }[] = [];

    // 간단한 구현(3일 이상 연속되는 공휴일 덩어리부터)
    // 실제 주말 결합 로직 -> 복잡 -> 일단 기초 설계
    let currentBlock: Holiday[] = [];

    for (let i=0; i<sortedHolidays.length; i++) {
        const current = new Date(sortedHolidays[i].date);
        const next= sortedHolidays[i+1] ? new Date(sortedHolidays[i+1].date) : null;

        currentBlock.push(sortedHolidays[i]);

        if (next) {
            const diffTime = next.getTime() - current.getTime();
            const diffDays = diffTime / (1000*60*60*24);
        
            // 날짜 차이가 3일 이내면 (즉, 사이에 주말이 끼어있어도) 하나의 블록
            if (diffDays <= 3) {
                continue;
            }
        }

        // 블록 확정 로직
        if (currentBlock.length >= 1) {
            const startDate = new Date(currentBlock[0].date);
            const endDate = new Date(currentBlock[currentBlock.length-1].date);

            // 실제 날짜 차이 계산 (끝날-시작날+1)
            const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000*60*60*24)) + 1;

            // 만약 단독 공휴일인데 주말(토,일)과 붙어있는지 체크하고 싶다면 
            // 여기서 추가 로직이 필요하지만, 일단 모든 공휴일이 나오게 1 이상으로 설정합니다.
            const uniqueNames = Array.from(new Set(currentBlock.map(h => h.localName))).join(', ');
            
            blocks.push({
                start: currentBlock[0].date,
                end: currentBlock[currentBlock.length-1].date,
                count: totalDays,
                displayNames: uniqueNames 
            });
        }
        currentBlock = [];
    }
    return blocks;
}

// 다가오는 2주 내의 날짜 중 협업하기 좋은 날 TOP3 추천
export function getRecommendedMeetingDays(
    krHolidays: Holiday[],
    jpHolidays: Holiday[],
    lang: 'ko' | 'ja' = 'ko'
) {
    const recommendations: {date: string; score: number; reason: string }[] = [];
    const today = new Date();

    for (let i=1; i<=14; i++) {
        const target = addDays(today, i);
        const day = getDay(target);
        if (day === 0 || day === 6 || day === 5) continue;

        const dateStr = format(target, 'yyyy-MM-dd');
        const isTodayHoliday = [...krHolidays, ...jpHolidays].some(h => h.date.trim() === dateStr && isActualPublicHoliday(h));
        if (isTodayHoliday) continue;

        const tomorrow = addDays(target, 1);
        const isTomorrowHoliday = [...krHolidays, ...jpHolidays].some(h => h.date.trim() === format(tomorrow, 'yyyy-MM-dd') && isActualPublicHoliday(h));
        const isTomorrowWeekend = (getDay(tomorrow) === 6);

        if (isTomorrowHoliday || isTomorrowWeekend) continue;

        let score = 100;
        let reason = lang === 'ko' 
            ? "양국 모두 정상 근무일이며, 협업 효율이 극대화되는 날입니다." 
            : "両国ともに通常勤務日であり、協業効率が最大化される日です";

        const hasNearbyHoliday = [...krHolidays, ...jpHolidays].some(h => {
            const diff = Math.abs(new Date(h.date).getTime() - target.getTime()) / (1000 * 60 * 60 * 24);
            return diff === 2 && isActualPublicHoliday(h);
        });

        if (hasNearbyHoliday) {
            score = 70;
            reason = lang === 'ko' 
                ? "인접 공휴일이 있어 업무 집중도가 낮을 수 있습니다." 
                : "近隣に祝日があるため、業務集中度が低下する可能性があります";
        }
        recommendations.push({ date: dateStr, score, reason});
    }
    return recommendations.sort((a,b) => b.score - a.score).slice(0,3);
}