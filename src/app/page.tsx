import { getCachedHolidays, analyzeBusinessDay, getVacationBlocks, getRecommendedMeetingDays } from "@/lib/holidays";
import CalendarView from "@/components/CalendarView";

export default async function Home() {
  // 데이터 가져오기 (병렬)
  const [jpHolidays, krHolidays] = await Promise.all([
    getCachedHolidays("JP"),
    getCachedHolidays("KR"),
  ]);

  const conflictMarkers: Record <string, {type: 'kr' | 'jp' | 'both'}> = {};

  // 공휴일 날짜만 모아서 비교
  const allHolidayDates = new Set([
    ...jpHolidays.map(h=>h.date),
    ...krHolidays.map(h=>h.date)
  ]);

  allHolidayDates.forEach(date=>{
    const isKr = krHolidays.some(h=>h.date === date);
    const isJp = jpHolidays.some(h=>h.date === date);

    if (isKr&&isJp) conflictMarkers[date] = {type: 'both'};
    else if (isKr) conflictMarkers[date] = {type: 'kr'};
    else if (isJp) conflictMarkers[date] = {type: 'jp'};
  });

  const nextJp = jpHolidays[0];
  const nextKr = krHolidays[0];

  // 연휴 블록 추출
  const jpVacations = getVacationBlocks(jpHolidays);
  const krVacations = getVacationBlocks(krHolidays);

  // 추천 일정 알고리즘
  const recommendedDays = getRecommendedMeetingDays(krHolidays, jpHolidays);

  // 2026년 2월 11일 (일본 건국기념일) test
  const testDate = "2026-02-11";
  const advice = analyzeBusinessDay(testDate, krHolidays, jpHolidays);

  // 달력 보여줄 기준 월 설정
  const currentMonth = new Date(2026,4,1);

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

        {/* Interactive Dual-Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-12">
          {/* Japan section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                🇯🇵 Japan Calendar
              </h3>
              <span className="text-sm text-gray-500 font-medium">May 2026</span>
            </div>
            {/* 일본 달력 */}
            <CalendarView 
              month={currentMonth}
              holidays={jpHolidays}
              countryCode="JP"
              conflictMarkers={conflictMarkers}
            />
          </section>

          {/* Korea section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                🇰🇷 Korea Calendar
              </h3>
              <span className="text-sm text-gray-500 font-medium">May 2026</span>
            </div>
            {/* 한국 달력 */}
            <CalendarView 
              month={currentMonth}
              holidays={krHolidays}
              countryCode="KR"
              conflictMarkers={conflictMarkers}
            />
          </section>
        </div>

        {/* long-term vacation alerts*/}
        {/* long-term vacation alerts 섹션 수정 */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 일본 전체 연휴 리스트 */}
          <div className="flex flex-col gap-4">
            {jpVacations.map((block, index) => (
              <div key={index} className="bg-orange-50 border border-orange-200 p-5 rounded-2xl flex flex-col gap-1">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-orange-800 font-bold flex items-center gap-2 text-lg">
                    🇯🇵 일본 연휴 주의
                  </span>
                  <span className="bg-orange-200 text-orange-800 text-xs font-black px-2 py-1 rounded-md">
                    {block.count} DAYS
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-orange-900 font-extrabold text-base">{block.displayNames}</p>
                  <p className="text-orange-700 text-sm font-medium">📅 {block.start} ~ {block.end}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 한국 전체 연휴 리스트 */}
          <div className="flex flex-col gap-4">
            {krVacations.map((block, index) => (
              <div key={index} className="bg-red-50 border border-red-200 p-5 rounded-2xl flex flex-col gap-1">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-red-800 font-bold flex items-center gap-2 text-lg">
                    🇰🇷 한국 연휴 주의
                  </span>
                  <span className="bg-red-200 text-red-800 text-xs font-black px-2 py-1 rounded-md">
                    {block.count} DAYS
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-red-900 font-extrabold text-base">{block.displayNames}</p>
                  <p className="text-red-700 text-sm font-medium">📅 {block.start} ~ {block.end}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Best Collaboration Days section */}
        <section className="mt-10 p-8 bg-white rounded-3xl shadow-sm border border-green-100">
          <h3 className="text-xl font-bold text-green-800 mb-6 flex items-center gap-2">
            Best Collaboration Days (Next 2 Weeks)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedDays.length > 0 ? (
              recommendedDays.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-green-50 border border-green-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-green-700 font-bold">{item.date}</span>
                    <span className="text-[10px] bg-green-200 text-green-800 px-2 py-1 rounded-lg font-black uppercase">
                      Score: {item.score}
                    </span>
                  </div>
                  <p className="text-xs text-green-600 font-medium leading-relaxed">
                    {item.reason}
                  </p>
                </div>
              ))
            ) : (
              <p className="col-span-3 text-center text-gray-400 text-sm py-4">
                추천할 수 있는 날이 없습니다.
              </p>
            )}
          </div>
        </section>

        {/* Notice section (Phase 3 Business logic) */}
        <section className={`mt-10 p-6 rounded-2xl border-2 transition-all
          ${advice.status === 'jp-only' ? 'bg-blue-50 border-blue-200' : 
            advice.status === 'kr-only' ? 'bg-red-50 border-red-200' :
            advice.status === 'match' ? 'bg-gray-100 border-gray-300' : 'bg-green-50 border-green-200'}`}>
          
          <h3 className={`font-bold mb-2 flex items-center gap-2
            ${advice.status === 'jp-only' ? 'text-blue-800' :
              advice.status === 'kr-only' ? 'text-red-800' :
              advice.status === 'match' ? 'text-gra-800' : 'text-green-800'}`}>
            Business Coordination Advice ({testDate})
          </h3>

          <p className={`text-sm font-medium
            ${advice.status === 'jp-only' ? 'text-blue-700' :
              advice.status === 'kr-only' ? 'text-red-700' :
              advice.status === 'match' ? 'text-gray-700' : 'text-green-700'}`}>
            {advice.message}
          </p>
        </section>
      </main>
    </div>
  );
}