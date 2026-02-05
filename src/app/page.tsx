import { getCachedHolidays, analyzeBusinessDay, getVacationBlocks, getRecommendedMeetingDays } from "@/lib/holidays";
import ScheduleDashboard from "@/components/ScheduleDashboard";

export default async function Home() {
  // 데이터 가져오기 (병렬)
  const [jpHolidays, krHolidays] = await Promise.all([
    getCachedHolidays("JP"),
    getCachedHolidays("KR"),
  ]);
/*
  // 제외할 기념일 목록 정의
  const EXCLUDED_HOLIDAYS = ["노동절", "어버이날", "스승의날", "제헌절", "국군의날"];

  // 비즈니스 셧다운(진짜 공휴일인지) 판별 헬퍼 함수
  const isTrueBusinessHoliday = (h: any) => {
    return (
      (!h.localName.includes("Day") ||
      h.localName.includes("Replacement") ||
      h.localName.includes("Memorial")) &&
      !EXCLUDED_HOLIDAYS.includes(h.localName)
    );
  };

  // 충돌 마커 생성 시 필터링 적용
  const conflictMarkers: Record <string, {type: 'kr' | 'jp' | 'both'}> = {};

  // 진짜 공휴일들만 따로 추출
  const trueKrHolidays = krHolidays.filter(isTrueBusinessHoliday);
  const trueJpHolidays = jpHolidays.filter(isTrueBusinessHoliday);

  // 공휴일 날짜만 모아서 비교
  const allHolidayDates = new Set([
    ...trueKrHolidays.map(h=>h.date),
    ...trueJpHolidays.map(h=>h.date)
  ]);

  allHolidayDates.forEach(date=>{
    const isKr = trueKrHolidays.some(h=>h.date === date);
    const isJp = trueJpHolidays.some(h=>h.date === date);

    if (isKr&&isJp) conflictMarkers[date] = {type: 'both'};
    else if (isKr) conflictMarkers[date] = {type: 'kr'};
    else if (isJp) conflictMarkers[date] = {type: 'jp'};
  });
*/
  //const nextJp = jpHolidays[0];
  //const nextKr = krHolidays[0];

  // 연휴 블록 추출
  //const jpVacations = getVacationBlocks(jpHolidays);
  //const krVacations = getVacationBlocks(krHolidays);

  // 추천 일정 알고리즘
  //const recommendedDays = getRecommendedMeetingDays(krHolidays, jpHolidays);

  // 2026년 2월 11일 (일본 건국기념일) test
  //const testDate = "2026-02-11";
  //const advice = analyzeBusinessDay(testDate, krHolidays, jpHolidays);

  // 달력 보여줄 기준 월 설정
  const currentMonthTimestamp = new Date(2026,4,1).getTime();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navigation bar */}
      <nav className="border-b bg-white px-8 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
          JP-KR Schedule Bridge
        </h1>
        <div className="flex gap-4 text-sm font-medium text-gray-500">
          <span>JP 🇯🇵</span>
          <span>↔️</span>
          <span>KR 🇰🇷</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        {/* header section */}
        <header className="mb-10">
          <h2 className="text-3xl font-extrabold tracking-tight">Business Calendar Dashboard</h2>
          <p className="mt-2 text-gray-600">한국과 일본 공휴일을 비교해 최적의 협업 일정을 제안합니다.</p>
        </header>

        {/* 구조를 Dashboard로 넘겨 일관성 유지 */}
        <ScheduleDashboard
          jpHolidays={jpHolidays}
          krHolidays={krHolidays}
          initialTimestamp={currentMonthTimestamp}
        />
      </main>
    </div>
  );
}