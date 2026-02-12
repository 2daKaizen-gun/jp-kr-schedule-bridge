import { getCachedHolidays, analyzeBusinessDay, getVacationBlocks, getRecommendedMeetingDays } from "@/lib/holidays";
import ScheduleDashboard from "@/components/ScheduleDashboard";

export default async function Home() {
  // 데이터 가져오기 (병렬)
  const [jpHolidays, krHolidays] = await Promise.all([
    getCachedHolidays("JP"),
    getCachedHolidays("KR"),
  ]);

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
        {/* 기존에 여기에 있던 <header>의 한국어 설명을
        ScheduleDashboard 내부로 이동시켜 언어 토글에 반응*/}
        <ScheduleDashboard
          jpHolidays={jpHolidays}
          krHolidays={krHolidays}
          initialTimestamp={currentMonthTimestamp}
        />
      </main>
    </div>
  );
}