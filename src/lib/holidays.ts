import { Holiday } from "@/types/holiday";
import { cache } from "react"; // react 캐시 기능 불러오기

/**
 * 특정 국가와 연도의 공휴일 데이터를 가져오는 함수
 * @param countryCode 'KR' 또는 'JP'
 * @param year 연도 (기본값 2026)
 */

export async function getHolidays(countryCode:string, year: number = 2026): Promise<Holiday[]> {
    const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`;

    try {
        const response = await fetch(url, {
            //data 변동 거의 없으므로 24hour cash
            next: {revalidate: 86400} // 나중에 강제로 캐시 비울 때 사용하는 태그
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch holidays for ${countryCode}`);
        }

        const data: Holiday[] = await response.json();
        return data;
    } catch (error) {
        console.error("Holiday Fetch Error:", error);
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