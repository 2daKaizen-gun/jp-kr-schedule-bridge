"use client";

import React, { useState } from 'react';
import { addMonths, subMonths, format } from 'date-fns';
import CalendarView from './CalendarView';
import EmailGenerator from './EmailGenerator';
import { emailTemplates, TemplateType } from '@/lib/templates';
import { UserEvent } from '@/types/holiday';
import EventModal from './EventModal';
import { translations } from '@/lib/translations';
import { useScheduleLogic } from '@/hook/useScheduleLogic';

export default function ScheduleDashboard({ 
  jpHolidays,
  krHolidays,
  initialTimestamp
}: any) {

  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  // 언어 상태
  const [lang, setLang] = useState<'ko' | 'ja'>('ko');
  //현재 언어셋 설정
  const currentT = translations[lang];
  const [emailDraft, setEmailDraft] = useState<string>("");
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [activeMode, setActiveMode] = useState("");
  const [currentTone, setCurrentTone] = useState<string>("");

  // 커스텀 훅에서 모든 로직 수혈
  const {
    viewMonth, setViewMonth,
    userEvents, setUserEvents,
    isLoaded,
    conflictMarkers,
    recommendedDays,
    advice,
    jpVacations,
    krVacations
  } = useScheduleLogic(jpHolidays, krHolidays, initialTimestamp, lang);
  
  // 상태 추가
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDate, setActiveDate] = useState<string | null>(null);

  // 일정 추가 함수
  const addUserEvent = (title: string, type: 'meeting' | 'holiday', country: 'KR' | 'JP' | 'Both') => {
    const newEvent: UserEvent = {
      // Date.now() 괄호 추가 및 랜덤 문자열 조합
      id: `${activeDate}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      date: activeDate!,
      title,
      type: type as any,
      countryCode: country
    };
    setUserEvents(prev => [...prev, newEvent]);
    setIsModalOpen(false); // 저장 후 모달 닫기
  };

  // 일정 삭제 함수
  const deleteUserEvent = (id: string) => {
    const confirmMsg = lang === 'ko' ? "일정을 삭제하시겠습니까?" : "予定を削除しますか？";
    if (window.confirm(confirmMsg)) {
      setUserEvents((prev) => prev.filter((event) => String(event.id) !== String(id)));
    }
  };

  const callAiApi = async (mode: string, tone?: string) => {
    setActiveMode(tone || mode);
    setIsEmailLoading(true);
    try {
      const res = await fetch('/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          tone,
          currentMonth: format(viewMonth, "yyyy-MM"),
          lang, // AI에게 현재 언어 설정 전달
          userEvents
        }),
      });
    const data = await res.json();
      setEmailDraft(data.text);
      if (tone) setCurrentTone(tone);
    } catch (err) {
      alert("AI Error");
    } finally {
      setIsEmailLoading(false);
      setActiveMode("");
    }
  };

  // 기본으로 되돌림
  const handleReset = () => {
    setEmailDraft("");
    // 초기화 시 톤 기억 삭제
    setCurrentTone("");
  };

  // 월 이동 핸들러
  const goPrev = () => setViewMonth(subMonths(viewMonth,1));
  const goNext = () => setViewMonth(addMonths(viewMonth,1));
  
  const goToday = () => {
    const today = new Date();
    setViewMonth(today);
  };

  const handleDateClick = (date: string, holidayName: string, type: any) => {
    let templateKey: TemplateType = 'BOTH_HOLIDAY';
    if (type === 'kr') templateKey = 'KR_HOLIDAY';
    if (type === 'jp') templateKey = 'JP_HOLIDAY';

    const template = emailTemplates[lang][templateKey];

    // setSelectedEmail을 사용하여 상태를 업데이트
    setSelectedEmail({
      title: template.title,
      subject: template.subject(date, holidayName),
      body: template.body(date, holidayName),
    });

    // 모달 띄우기 위해 날짜만 세팅
    setActiveDate(date);
    setIsModalOpen(true);
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
            <button onClick={() => setLang('ko')} className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${lang === 'ko' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}>KO</button>
            <button onClick={() => setLang('ja')} className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${lang === 'ja' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}>JA</button>
          </div>
          <div className='flex gap-1'>
            <button onClick={() => setViewMonth(subMonths(viewMonth,1))} className="p-2 hover:bg-gray-100 rounded-xl">◀</button>
            <button onClick={() => setViewMonth(addMonths(viewMonth,1))} className="p-2 hover:bg-gray-100 rounded-xl">▶</button>
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

      <section className={`p-6 rounded-2xl border-2 bg-opacity-50 ${advice.status === 'jp-only' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
        <h3 className="font-bold mb-2">
          {currentT.todayStatus} ({isLoaded ? format(new Date(), lang === 'ko' ? "yyyy. MM. dd" : "yyyy/MM/dd") : "..."})
        </h3>
        <p className="text-sm font-medium">{advice.message}</p>
      </section>

      {isModalOpen && activeDate && (
        <EventModal 
          date={activeDate} 
          onClose={() => setIsModalOpen(false)} 
          onSave={addUserEvent}
          lang={lang} // 언어 프롭 전달
        />
      )}
    </div>
  );
}