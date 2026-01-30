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

        

      </main>








    </div>
        
  )
}

