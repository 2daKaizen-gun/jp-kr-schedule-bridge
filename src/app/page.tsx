export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray 900">
      {/*상단 네비게이션 바*/}
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
        {/*header section*/}
        <header className="mb-10">
          <h2 className="text-3xl font-extrabold tracking-tight">Business Calender Dashboard</h2>
          <p className="mt-2 text-gray-600">한국과 일본 공휴일 비교해 최적의 협업 일정을 제안합니다.</p>
        </header>

        {/*2 column layout(Calender)*/}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/*Japan section*/}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 text-lg font-semibold border-b pb-2">
              <span className="text-2xl">🇯🇵</span> Japan
            </div>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-dashed border-2 border-gray-200 text-gray-400">
              Calendar View Coming Soon
            </div>
          </div>

          {/*Korea section*/}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 text-lg font-semibold border-b pb-2">
              <span className="text-2xl">🇰🇷</span> South Korea
            </div>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-dashed border-2 border-gray-200 text-gray-400">
              Calendar View Coming Soon
            </div>
          </div>

        </div>

        

      </main>








    </div>
        
  )
}

