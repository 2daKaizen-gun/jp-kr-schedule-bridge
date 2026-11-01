import { format } from "date-fns";
import { getHolidaysForYears } from "@/lib/holidays";
import ScheduleDashboard from "@/components/ScheduleDashboard";

// 공휴일과 기준 월이 빌드 시점에 고정되지 않도록 하루마다 재생성
export const revalidate = 86400;

export default async function Home() {
  const now = new Date();
  const years = [now.getFullYear(), now.getFullYear() + 1];

  // 데이터 가져오기 (병렬)
  const [jpHolidays, krHolidays] = await Promise.all([
    getHolidaysForYears("JP", years),
    getHolidaysForYears("KR", years),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navigation bar */}
      <nav className="border-b bg-white px-4 sm:px-8 py-4 flex justify-between items-center gap-3 shadow-sm">
        <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
          JP-KR Schedule Bridge
        </h1>
        <div className="flex shrink-0 gap-1.5 sm:gap-4 text-xs sm:text-sm font-medium text-gray-500 whitespace-nowrap">
          <span>JP 🇯🇵</span>
          <span>↔️</span>
          <span>KR 🇰🇷</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 sm:p-8">
        {/* 기존에 여기에 있던 <header>의 한국어 설명을
        ScheduleDashboard 내부로 이동시켜 언어 토글에 반응*/}
        <ScheduleDashboard
          jpHolidays={jpHolidays}
          krHolidays={krHolidays}
          initialMonth={format(now, "yyyy-MM-01")}
        />
      </main>
    </div>
  );
}
