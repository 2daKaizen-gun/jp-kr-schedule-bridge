import { Holiday } from "@/types/holiday";
import { cache } from "react"; // react 캐시 기능 불러오기
import { format, addDays, getDay } from 'date-fns';

// Google Calendar API
const GOOGLE_API_KEY = process.env.GOOGLE_CALENDAR_API_KEY;

// 국가별 캘린더 ID
const CALENDAR_IDS: {[key: string]: string } = {
    KR: 'ko.south_korea#holiday@group.v.calendar.google.com',
    JP: 'japanese__ja@holiday.calendar.google.com'
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
        if (data.error) {
            console.error(`Google API Error (${countryCode}):`, data.error.message);
        return [];
        }

        // [체크 2] items 데이터가 있는지 확인
        if (!data.items) {
            console.warn(`No items found for ${countryCode}`);
        return [];
        }

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
        console.error("Critical Fetch Error:", error);
        //error 발생 시 빈 배열 반환해 protect
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
    jpHolidays: Holiday[]
) {
    const iskrHoliday = krHolidays.some(h => h.date === targetDate);
    const isjpHoliday = jpHolidays.some(h => h.date === targetDate);

    if (iskrHoliday && isjpHoliday) {
        return {
            status: 'match',
            message: '양국 모두 공휴일이므로 긴급 업무 외는 대응이 어렵습니다.',
            color: 'gray'
        };
    } else if (iskrHoliday) {
        return {
            status: 'kr-only',
            message: '한국만 휴일입니다. 일본 측 업무는 진행되나 한국 측 확인이 늦어질 수 있습니다.',
            color: 'red'
        };
    } else if (isjpHoliday) {
        return {
            status: 'jp-only',
            message: '일본만 휴일입니다. 일본 파트너사 회신 지연 가능성 있으니 미리 일정을 조율하세요.',
            color: 'blue'
        };
    }
    return {
        status: 'work',
        message: '양국 모두 근무일입니다. 협업 및 미팅 진행에 최적화된 날입니다.',
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
export function getRecommendedMeetingDays(krHolidays: Holiday[], jpHolidays: Holiday[]) {
    const recommedations: {date: string; score: number; reason: string }[] = [];
    const today = new Date();

    // 오늘부터 14일간 날짜
    for (let i=1; i<=14; i++) {
        const target = addDays(today, i);
        
        // 주말 및 금요일 제외 로직
        const day = getDay(target);
        if (day === 0 || day === 6 || day === 5) continue;

        // 한국, 일본 시간 기준
        const dateStr = format(target, 'yyyy-MM-dd');

        const isjpHoliday = jpHolidays.some(h => h.date.trim() === dateStr);
        const iskrHoliday = krHolidays.some(h => h.date.trim() === dateStr);
        
        if (!iskrHoliday && !isjpHoliday) {
            //basic: 100
            let score = 100;
            let reason = "양국 모두 정상 근무입니다.";

            // 앞뒤 2일 내 장기 연휴 체크(집중도 하락 방지)
            const hasNearbyHoliday = [...krHolidays, ...jpHolidays].some(h => {
                return Math.abs(new Date(h.date).getTime() - target.getTime()) / (1000*60*60*24) <= 2;
            });

            if (hasNearbyHoliday) {
                score = 70;
                reason = "인접 공휴일이 있어 업무 집중도가 낮을 수 있습니다.";
            }

            recommedations.push({ date: dateStr, score, reason});
        }
    }

    // 점수 높은 순 TOP3 반환
    return recommedations.sort((a,b) => b.score - a.score).slice(0,3);
}