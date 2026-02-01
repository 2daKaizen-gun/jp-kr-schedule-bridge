import { getCachedHolidays, analyzeBusinessDay, getVacationBlocks } from "@/lib/holidays";

export default async function Home() {
  // 데이터 가져오기 (병렬)
  const [jpHolidays, krHolidays] = await Promise.all([
    getCachedHolidays("JP"),
    getCachedHolidays("KR"),
  ]);

  const nextJp = jpHolidays[0];
  const nextKr = krHolidays[0];

  // 연휴 블록 추출
  const jpVacations = getVacationBlocks(jpHolidays);
  const KrVacations = getVacationBlocks(krHolidays);

  // 2026년 2월 11일 (일본 건국기념일) test
  const testDate = "2026-02-11";
  const advice = analyzeBusinessDay(testDate, krHolidays, jpHolidays);

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

        {/* 2 column layout (Calendar) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Japan section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 text-lg font-semibold border-b pb-2">
              <span className="text-2xl">🇯🇵</span> Japan
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-blue-600 font-bold">{nextJp?.localName || "No data"}</p>
              <p className="text-sm text-gray-500">{nextJp?.date}</p>
            </div>
          </div>

          {/* Korea section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 text-lg font-semibold border-b pb-2">
              <span className="text-2xl">🇰🇷</span> South Korea
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-red-600 font-bold">{nextKr?.localName || "No data"}</p>
              <p className="text-sm text-gray-500">{nextKr?.date}</p>
            </div>
          </div>
        </div>

        {/* long-term vacation alerts*/}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {jpVacations.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 p-5 rounded-2xl flex flex-col gap-1">
              <div className="flex justify-between items-start mb-2">
                <span className="text-orange-800 font-bold flex items-center gap-2 text-lg">
                  🇯🇵일본 연휴 주의
                </span>
                <span className="bg-orange-200 text-orange-800 text-xs font-black px-2 py-1 rounded-md">
                  {jpVacations[0].count} DAYS
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-orange-900 font-extrabold text-base">
                  {jpVacations[0].displayNames}
                </p>
                <p className="text-orange-700 text-sm font-medium">
                  📅 {jpVacations[0].start} ~ {jpVacations[0].end}
                </p>
              </div>
            </div>
          )}

          {KrVacations.length > 0 && (
            <div className="bg-red-50 border border-red-200 p-5 rounded-2xl flex flex-col gap-1">
              <div className="flex justify-between items-start mb-2">
                <span className="text-red-800 font-bold flex items-center gap-2 text-lg">
                  🇰🇷한국 연휴 주의
                </span>
                <span className="bg-red-200 text-red-800 text-xs font-black px-2 py-1 rounded-md">
                  {KrVacations[0].count} DAYS
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-red-900 font-extrabold text-base">
                  {KrVacations[0].displayNames}
                </p>
                <p className="text-red-700 text-sm font-medium">
                  📅 {KrVacations[0].start} ~ {KrVacations[0].end}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Notice section (Phase 3 Business logic) */}
        <section className={`mt-10 p-6 rounded-2xl border ${advice.color === 'blue' ? 'bg-blue-50 border-blue-100' : 'bg-gray-50'}`}>
          <h3 className={`font-bold mb-2 flex items-center gap-2 ${advice.color === 'blue' ? 'text-blue-800' : 'text-gray-800'}`}>
            Business Coordination Advice ({testDate})
          </h3>
          <p className={`${advice.status === 'jp-only' ? 'text-blue-700' : 'text-gray-700'} text-sm`}>
            {advice.message}
          </p>
        </section>
      </main>
    </div>
  );
}