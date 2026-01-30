import { getHolidays } from "@/lib/holidays";

export default async function Home() {
  // 데이터 가져오기 (병렬)
  const [jpHolidays, krHolidays] = await Promise.all([
    getHolidays("JP"),
    getHolidays("KR"),
  ]);

  // 가장 가까운 휴일 sample
  const nextJp = jpHolidays[0];
  const nextKr = krHolidays[0];

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

        {/* Notice section (Phase 3 Business logic) */}
        <section className="mt-10 bg-blue-50 p-6 rounded-2xl border border-blue-100">
          <h3 className="text-blue-800 font-bold mb-2 flex items-center gap-2">
            Smart Business Advice
          </h3>
          <p className="text-blue-700 text-sm">
            {process.env.PUBLIC_HOLIDAY_API_KEY ? 
              "보안 설정 완료: 데이터 연동 준비가 되었습니다." : 
              "보안 설정 미완료: .env.local 파일을 확인해주세요."}
          </p>
        </section>
      </main>
    </div>
  );
}