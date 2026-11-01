"use client";

import React, { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import CalendarView from './CalendarView';
import EmailGenerator from './EmailGenerator';
import { emailTemplates, TemplateType } from '@/lib/templates';
import { DashboardProps, Holiday } from '@/types/holiday';
import { MAX_AI_ITEMS, MAX_AI_TEXT_LENGTH } from '@/lib/aiDraft';
import EventModal from './EventModal';
import { translations } from '@/lib/translations';
import { useScheduleLogic } from '@/hook/useScheduleLogic';

export default function ScheduleDashboard({ 
  jpHolidays,
  krHolidays,
  initialMonth
}: DashboardProps) {

  const [lang, setLang] = useState<'ko' | 'ja'>('ko');
  const [selectedHolidayDate, setSelectedHolidayDate] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState("");
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [activeMode, setActiveMode] = useState("");
  const [currentTone, setCurrentTone] = useState("");
  const [aiSubject, setAiSubject] = useState<string | null>(null);
  const [aiError, setAiError] = useState<'rate_limited' | 'failed' | null>(null);

  const currentT = translations[lang];

  // 스크린 리더와 브라우저 번역이 현재 언어를 알 수 있도록 반영
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // 커스텀 훅에서 모든 로직 수혈
  const {
    today,
    viewMonth,
    goPrev, goNext, goToday,
    userEvents,
    addUserEvent, deleteUserEvent,
    conflictMarkers,
    recommendedDays,
    advice,
    jpVacations,
    krVacations,
    isModalOpen,
    activeDate,
    openEventModal,
    closeEventModal
  } = useScheduleLogic(jpHolidays, krHolidays, initialMonth, lang);

  // AI 관련 로직
  const callAiApi = async (tone: string) => {
    setActiveMode(tone);
    setIsEmailLoading(true);
    setAiError(null);

    // 보고 있는 달의 공휴일과 일정만 전달
    const currentMonth = format(viewMonth, "yyyy-MM");
    const toAiHolidays = (holidays: Holiday[], country: 'KR' | 'JP') => holidays
      .filter(h => h.isPublicHoliday && h.date.startsWith(currentMonth))
      .map(h => ({ country, date: h.date, name: h.localName }));

    try {
      const res = await fetch('/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tone,
          currentMonth,
          lang, // AI에게 현재 언어 설정 전달
          holidays: [...toAiHolidays(jpHolidays, 'JP'), ...toAiHolidays(krHolidays, 'KR')],
          userEvents: userEvents
            .filter(e => e.date.startsWith(currentMonth))
            .slice(0, MAX_AI_ITEMS)
            .map(e => ({ date: e.date, title: e.title.slice(0, MAX_AI_TEXT_LENGTH), countryCode: e.countryCode })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error === 'rate_limited' ? 'rate_limited' : 'failed');
        return;
      }
      setEmailDraft(data.text);
      setAiSubject(data.subject);
      setCurrentTone(tone);
    } catch {
      setAiError('failed');
    } finally {
      setIsEmailLoading(false);
      setActiveMode("");
    }
  };

  // 기본으로 되돌림
  const handleReset = () => {
    setEmailDraft("");
    setAiSubject(null);
    setAiError(null);
    // 초기화 시 톤 기억 삭제
    setCurrentTone("");
  };

  // 선택한 공휴일의 메일 초안 (언어를 바꾸면 함께 바뀌도록 렌더링 시 계산)
  const selectedEmail = (() => {
    const marker = selectedHolidayDate ? conflictMarkers[selectedHolidayDate] : null;
    if (!selectedHolidayDate || !marker) return null;

    const templateKeys: Record<typeof marker.type, TemplateType> = {
      kr: 'KR_HOLIDAY',
      jp: 'JP_HOLIDAY',
      both: 'BOTH_HOLIDAY',
    };
    // 클릭한 달력과 무관하게 실제로 쉬는 나라의 공휴일 이름을 사용
    const source = marker.type === 'jp' ? jpHolidays : krHolidays;
    const holidayName = source.find(h => h.date === selectedHolidayDate && h.isPublicHoliday)?.localName ?? "";
    const template = emailTemplates[lang][templateKeys[marker.type]];

    return {
      title: template.title,
      subject: template.subject(selectedHolidayDate, holidayName),
      body: template.body(selectedHolidayDate, holidayName),
    };
  })();

  // 날짜 클릭 핸들러 (공휴일이면 메일 초안 설정, 훅 모달 열기 호출)
  const handleDateClick = (date: string) => {
    if (conflictMarkers[date]) {
      setSelectedHolidayDate(date);
      handleReset(); // 이전 공휴일 기준의 AI 초안이 남지 않도록 초기화
    }

    // 훅 모달 열기 기능 호출
    openEventModal(date);
  };

  return (
    <div className="space-y-12">
      {/* Page Header: 언어 토글에 반응하는 설명 섹션 */}
      <header className="mb-10">
        <h2 className="text-4xl font-black tracking-tight text-gray-900 mb-2">
          Business Calendar Dashboard
        </h2>
        <p className="text-lg text-gray-500 font-medium">
          {currentT.subDescription} {/* [핵심] 언어 변경 시 이 문구도 바뀜! */}
        </p>
      </header>
      
      {/* 월 이동 컨트롤러 */}
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <h3 className="text-2xl font-black text-gray-800 ml-2">
            {format(viewMonth, lang === 'ko' ? "yyyy년 MM월" : "yyyy年 MM月")}
          </h3>
          <button
            onClick={goToday}
            className="px-3 py-1 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              TODAY
            </button>
        </div>

        <div className='flex gap-4 items-center'>
          {/* 언어 스위처 */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button aria-pressed={lang === 'ko'} onClick={() => setLang('ko')} className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${lang === 'ko' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'}`}>KO</button>
            <button aria-pressed={lang === 'ja'} onClick={() => setLang('ja')} className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${lang === 'ja' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'}`}>JA</button>
          </div>
          <div className='flex gap-1'>
            <button aria-label={currentT.prevMonth} onClick={goPrev} className="p-2 hover:bg-gray-100 rounded-xl">◀</button>
            <button aria-label={currentT.nextMonth} onClick={goNext} className="p-2 hover:bg-gray-100 rounded-xl">▶</button>
          </div>
        </div>
      </div>

      {/* 달력 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section>
          <h3 className="text-lg font-bold mb-4 text-gray-700">🇯🇵 Japan Calendar</h3>
          <CalendarView
            key="cv-jp" // 고유 키 추가
            month={viewMonth}
            holidays={jpHolidays}
            countryCode="JP"
            conflictMarkers={conflictMarkers}
            userEvents={userEvents}
            lang={lang} // 언어 프롭 전달
            onDateClick={handleDateClick}
            onDeleteEvent={deleteUserEvent} // 추가
          />
        </section>

        <section>
          <h3 className="text-lg font-bold mb-4 text-gray-700">🇰🇷 Korea Calendar</h3>
          <CalendarView
            key="cv-kr" // 고유 키 추가
            month={viewMonth}
            holidays={krHolidays}
            countryCode="KR"
            conflictMarkers={conflictMarkers}
            userEvents={userEvents}
            lang={lang} // 언어 프롭 전달
            onDateClick={handleDateClick}
            onDeleteEvent={deleteUserEvent} // 추가
          />
        </section>
      </div>

      {/* 연휴 알림 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-4">
          {jpVacations.map((block, idx) => (
            <div key={`jp-vac-${idx}`} className="bg-orange-50 border border-orange-200 p-5 rounded-2xl">
              <span className="text-orange-800 font-bold block mb-2 text-lg">🇯🇵 {lang === 'ko' ? "일본 연휴 주의" : "日本の祝日に伴う注意"}</span>
              <p className="text-orange-900 font-extrabold">{block.displayNames}</p>
              <p className="text-orange-700 text-sm">📅 {block.start} ~ {block.end}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-4">
          {krVacations.map((block, idx) => (
            <div key={`kr-vac-${idx}`} className="bg-red-50 border border-red-200 p-5 rounded-2xl">
              <span className="text-red-800 font-bold block mb-2 text-lg">🇰🇷 {lang === 'ko' ? "한국 연휴 주의" : "韓国の祝日に伴う注意"}</span>
              <p className="text-red-900 font-extrabold">{block.displayNames}</p>
              <p className="text-red-700 text-sm">📅 {block.start} ~ {block.end}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 이메일 생성기 */}
      <EmailGenerator 
        data={selectedEmail} 
        onAiGenerate={callAiApi}
        onReset={handleReset}
        aiDraft={emailDraft}
        aiSubject={aiSubject}
        aiError={aiError}
        isAiLoading={isEmailLoading}
        activeMode={activeMode}
        currentTone={currentTone}
        lang={lang} //언어 프롭 전달
      />

      {/* 추천 일정 및 비즈니스 조언 */}
      <section className="mt-10 p-8 bg-white rounded-3xl shadow-sm border border-green-100">
        <h3 className="text-xl font-bold text-green-800 mb-6">{currentT.bestDays}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendedDays.map((item, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-green-50 border border-green-200">
              <span className="text-green-700 font-bold">{item.date}</span>
              <p className="text-xs text-green-600 mt-2">{item.reason}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`p-6 rounded-2xl border-2 ${advice?.status === 'jp-only' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
        <h3 className="font-bold mb-2">
          {currentT.todayStatus} ({today ? format(parseISO(today), lang === 'ko' ? "yyyy. MM. dd" : "yyyy/MM/dd") : "..."})
        </h3>
        <p className="text-sm font-medium">{advice?.message ?? "..."}</p>
      </section>

      {isModalOpen && activeDate && (
        <EventModal 
          date={activeDate} 
          onClose={closeEventModal} 
          onSave={addUserEvent}
          lang={lang} // 언어 프롭 전달
        />
      )}
    </div>
  );
}