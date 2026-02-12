"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { addMonths, subMonths, format, isSameMonth, add } from 'date-fns';
import CalendarView from './CalendarView';
import EmailGenerator from './EmailGenerator';
import { emailTemplates, TemplateType } from '@/lib/templates';
import { getVacationBlocks, getRecommendedMeetingDays, analyzeBusinessDay } from '@/lib/holidays';
import { UserEvent } from '@/types/holiday';
import EventModal from './EventModal';

export default function ScheduleDashboard({ 
  jpHolidays,
  krHolidays,
  initialTimestamp
}: any) {

  // 현재 화면에 보여줄 달(Month)을 상태로 관리
  const [viewMonth, setViewMonth] = useState<Date>(new Date(initialTimestamp));
  const [selectedEmail, setSelectedEmail] = useState<any>(null);

  const [userEvents, setUserEvents] = useState<UserEvent[]>([]);
  const [isLoaded, setIsLoaded] = useState(false); // 하이드레이션 오류 방지용

  // 초기 데이터 로드
  useEffect(() => {
    const saved = localStorage.getItem('user_events');
    if (saved) {
      setUserEvents(JSON.parse(saved));
    }
    setIsLoaded(true);
  }, []);

  // 데이터 바뀔 때마다 로컬 스토리지 저장
  useEffect (() =>  {
    if (isLoaded) {
      localStorage.setItem('user_events', JSON.stringify(userEvents));
    }
  }, [userEvents, isLoaded]);

  // 비즈니스 어드바이스
  const advice = useMemo(() => {
    return analyzeBusinessDay(format(new Date(), "yyyy年MM月dd日"), krHolidays, jpHolidays);
  }, [krHolidays, jpHolidays]);

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
      type,
      countryCode: country
    };
    setUserEvents(prev => [...prev, newEvent]);
    setIsModalOpen(false); // 저장 후 모달 닫기
  };

  // 일정 삭제 함수
  const deleteUserEvent = (id: string) => {
    if (window.confirm("Delete?")) {
      setUserEvents((prev) => {
        const nextEvents = prev.filter((event) => String(event.id) !== String(id));
        console.log("삭제 후 결과:", nextEvents);
        return nextEvents;
      });
    }
  };

  // --- 비즈니스 로직 계산 섹션 (viewMonth에 반응함) ---
  const conflictMarkers = useMemo(() => {
    const markers: any = {};
    const EXCLUDED_HOLIDAYS = ["노동절", "어버이날", "스승의날", "제헌절", "국군의날"];
    
    // 공휴일 필터링 함수
    const isTrue = (h: any) => ((!h.localName.includes("Day") || h.localName.includes("Replacement") || h.localName.includes("Memorial")) && !EXCLUDED_HOLIDAYS.includes(h.localName));
    
    const trueKr = krHolidays.filter(isTrue);
    const trueJp = jpHolidays.filter(isTrue);
    
    // 양국 날짜 합치기
    const allDates = new Set([...trueKr.map((h: any) => h.date), ...trueJp.map((h: any) => h.date)]);
    
    allDates.forEach(date => {
      const isKr = trueKr.some((h: any) => h.date === date);
      const isJp = trueJp.some((h: any) => h.date === date);
      if (isKr && isJp) markers[date] = { type: 'both' };
      else if (isKr) markers[date] = { type: 'kr' };
      else if (isJp) markers[date] = { type: 'jp' };
    });
    return markers;
  }, [jpHolidays, krHolidays]);

  // 현재 달의 연휴 블록 필터링
  const jpVacations = useMemo(() => 
    getVacationBlocks(jpHolidays).filter(v => isSameMonth(new Date(v.start), viewMonth)),
    [jpHolidays, viewMonth]
  );

  const krVacations = useMemo(() => 
    getVacationBlocks(krHolidays).filter(v => isSameMonth(new Date(v.start), viewMonth)),
    [krHolidays, viewMonth]
  );

  // 현재 달 기준 추천 일정 및 조언
  const recommendedDays = useMemo(() => {
  // 사용자가 추가한 모든 일정을 '차단된 날짜'로 변환
  // 'holiday'뿐만 아니라 'meeting'도 추천에서 제외되도록 type 체크를 제거하거나 조정
  const userHolidays = userEvents.map(e => ({
    date: e.date,
    localName: e.title,
    countryCode: e.countryCode,
    isUserDefined: true // 사용자 정의 데이터 표시(debugging)
  }));

  // 기존 공휴일 데이터에 사용자 휴무일을 병합하여 계산
  // 한국 달력에 영향을 주는 것: KR 전용 + Both(공통)
  const combinedKr = [
    ...krHolidays,
    ...userHolidays.filter(h => h.countryCode === 'KR' || h.countryCode === 'Both')
  ];
  // 일본 달력에 영향을 주는 것: JP 전용 + Both(공통)
  const combinedJp = [
    ...jpHolidays,
    ...userHolidays.filter(h => h.countryCode === 'JP' || h.countryCode === 'Both')
  ];

  return getRecommendedMeetingDays(combinedKr, combinedJp)
    .filter(d => isSameMonth(new Date(d.date), viewMonth));
  }, [krHolidays, jpHolidays, userEvents, viewMonth]);
  //userEvents 바뀔 때마다 이 전체 로직 다시 실행

  // AI 관련 상태 추가
const [aiBriefing, setAiBriefing] = useState<string>("");
const [emailDraft, setEmailDraft] = useState<string>("");
const [isAiLoading, setIsAiLoading] = useState(false);
const [isEmailLoading, setIsEmailLoading] = useState(false);
const [activeMode, setActiveMode] = useState("");
// 상태 추가
const [currentTone, setCurrentTone] = useState<string>("");

// AI 통합 호출 함수
const callAiApi = async (mode: string, tone?: string) => {
  const loadingTarget = tone || mode;
  setActiveMode(loadingTarget);
  
  if (mode === "analyze") setIsAiLoading(true);
  else setIsEmailLoading(true);

  try {
    const res = await fetch('/analyze', { // app/analyze/route.ts 호출
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode,
        tone,
        currentMonth: format(viewMonth, "yyyy年 MM月"),
        holidays: { kr: krHolidays, jp: jpHolidays },
        userEvents: userEvents // 사용자가 입력한 일정까지 포함
      }),
    });
    const data = await res.json();
    
    if (mode === "analyze") {
      setAiBriefing(data.text);
      setEmailDraft(""); // 분석 새로하면 기존 메일은 초기화
    } else {
      setEmailDraft(data.text);
      // 메일 성공 시 현재 톤 저장
      if (tone) setCurrentTone(tone);
    }
  } catch (err) {
    console.error("AI API Error:", err);
    alert("AI Error");
  } finally {
    setIsAiLoading(false);
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

  const template = emailTemplates[templateKey];

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
      {/* 월 이동 컨트롤러 */}
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <h3 className="text-2xl font-black text-gray-800 ml-2">
            {format(viewMonth, "yyyy年 MM月")}
          </h3>
          <button
            onClick={goToday}
            className="px-3 py-1 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              TODAY
            </button>
        </div>

        <div className='flex gap-2'>
          <button
            onClick={goPrev}
            className="p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-600 active:scale-95"
          >
            <span className="text-xl">◀</span>
          </button>
          <button
            onClick={goNext}
            className="p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-600 active:scale-95"
          >
            <span className="text-xl">▶</span>
          </button>
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
            userEvents={userEvents} // 추가
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
            userEvents={userEvents} // 추가
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
              <span className="text-orange-800 font-bold block mb-2 text-lg">🇯🇵 日本の祝日に伴う注意</span>
              <p className="text-orange-900 font-extrabold">{block.displayNames}</p>
              <p className="text-orange-700 text-sm">📅 {block.start} ~ {block.end}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-4">
          {krVacations.map((block, idx) => (
            <div key={`kr-vac-${idx}`} className="bg-red-50 border border-red-200 p-5 rounded-2xl">
              <span className="text-red-800 font-bold block mb-2 text-lg">🇰🇷 한국 연휴 주의</span>
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
      />

      {/* 추천 일정 및 비즈니스 조언 */}
      <section className="mt-10 p-8 bg-white rounded-3xl shadow-sm border border-green-100">
        <h3 className="text-xl font-bold text-green-800 mb-6">Best Collaboration Days (Next 2 Weeks)</h3>
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
          Today&apos;s Business Status ({format(new Date(), "yyyy. MM. dd")})
        </h3>
        <p className="text-sm font-medium">{advice.message}</p>
      </section>

      {isModalOpen && activeDate && (
        <EventModal 
          date={activeDate} 
          onClose={() => setIsModalOpen(false)} 
          onSave={addUserEvent}
        />
      )}
    </div>
  );
}