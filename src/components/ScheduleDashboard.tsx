"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { addMonths, subMonths, format, isSameMonth, add } from 'date-fns';
import CalendarView from './CalendarView';
import EmailGenerator from './EmailGenerator';
import { emailTemplates, TemplateType } from '@/lib/templates';
import { getVacationBlocks, getRecommendedMeetingDays, analyzeBusinessDay } from '@/lib/holidays';
import { UserEvent } from '@/types/holiday';

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

  // 일정 추가 함수
  const addUserEvent = (date: string, title: string) => {
    const newEvent: UserEvent = {
      // ✅ 더 안전하고 확실한 ID 생성 방식
      id: `${date}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      date,
      title,
      type: 'meeting', // 기본 값
    };
    setUserEvents(prev => [...prev, newEvent]);
  };

  // 일정 삭제 함수
  const deleteUserEvent = (id: string) => {
    // 로그로 확인
    console.log("삭제 시도 ID:", id);
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
  const recommendedDays = useMemo(() => getRecommendedMeetingDays(krHolidays, jpHolidays).filter(d => isSameMonth(new Date(d.date), viewMonth)), [krHolidays, jpHolidays, viewMonth]);
  const advice = useMemo(() => 
    analyzeBusinessDay(format(new Date(), "yyyy-MM-dd"), krHolidays, jpHolidays), 
    [krHolidays, jpHolidays]
  );

  // 월 이동 핸들러
  const goPrev = () => setViewMonth(subMonths(viewMonth,1));
  const goNext = () => setViewMonth(addMonths(viewMonth,1));
  
  const goToday = () => {
    const today = new Date();
    setViewMonth(today);
  };

  const handleDateClick = (date: string, holidayName: string, type: 'kr' | 'jp' | 'both') => {
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

  // 일정 등록 여부 물어보기 (간이 모달 대용)
  const addConfirm = window.confirm(`${date}에 개인 일정을 추가하시겠습니까?`);
  if (addConfirm) {
    const title = window.prompt("일정 제목을 입력하세요:");
    if (title) addUserEvent(date, title);
  }
};

  return (
    <div className="space-y-12">
      {/* 월 이동 컨트롤러 */}
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <h3 className="text-2xl font-black text-gray-800 ml-2">
            {format(viewMonth, "yyyy.MM")}
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
              <span className="text-orange-800 font-bold block mb-2 text-lg">🇯🇵 일본 연휴 주의</span>
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
      <EmailGenerator data={selectedEmail} />

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
    </div>
  );
}