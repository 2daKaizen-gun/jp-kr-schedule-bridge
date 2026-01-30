import { Holiday } from "@/types/holiday";

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
            next: {revalidate: 86400}
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
