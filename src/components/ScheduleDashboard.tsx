"use client";

import React, { useState, useMemo } from 'react';
import { addMonths, subMonths, format, isSameMonth } from 'date-fns';
import CalendarView from './CalendarView';
import EmailGenerator from './EmailGenerator';
import { emailTemplates, TemplateType } from '@/lib/templates';
import { getVacationBlocks, getRecommendedMeetingDays, analyzeBusinessDay } from '@/lib/holidays';

export default function ScheduleDashboard({ 
  jpHolidays,
  krHolidays,
  initialTimestamp
}: any) {

  // 현재 화면에 보여줄 달(Month)을 상태로 관리
  const [viewMonth, setViewMonth] = useState<Date>(new Date(initialTimestamp));
  const [selectedEmail, setSelectedEmail] = useState<any>(null);

  // --- 비즈니스 로직 계산 섹션 (viewMonth에 반응함) ---
  const conflictMarkers = useMemo(() => {
    const markers: any = {};
    const EXCLUDED_HOLIDAYS = ["노동절", "어버이날", "스승의날", "제헌절", "국군의날"];
    
    const isTrue = (h: any) => ((!h.localName.includes("Day") || h.localName.includes("Replacement") || h.localName.includes("Memorial")) && !EXCLUDED_HOLIDAYS.includes(h.localName));
    
    const trueKr = krHolidays.filter(isTrue);
    const trueJp = jpHolidays.filter(isTrue);
    
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
  const advice = useMemo(() => analyzeBusinessDay(format(viewMonth, "yyyy-MM-dd"), krHolidays, jpHolidays), [viewMonth, krHolidays, jpHolidays]);

  // 월 이동 핸들러
  const goPrev = () => setViewMonth(subMonths(viewMonth,1));
  const goNext = () => setViewMonth(addMonths(viewMonth,1));
  const goToday = () => setViewMonth(new Date(2026,4,1));

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
            key={`jp-${viewMonth.toISOString()}`}
            month={viewMonth}
            holidays={jpHolidays}
            countryCode="JP"
            conflictMarkers={conflictMarkers}
            onDateClick={handleDateClick}
          />
        </section>

        <section>
          <h3 className="text-lg font-bold mb-4 text-gray-700">🇰🇷 Korea Calendar</h3>
          <CalendarView
            key={`kr-${viewMonth.toISOString()}`}
            month={viewMonth}
            holidays={krHolidays}
            countryCode="KR"
            conflictMarkers={conflictMarkers}
            onDateClick={handleDateClick}
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
        <h3 className="text-xl font-bold text-green-800 mb-6">Best Collaboration Days</h3>
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
        <h3 className="font-bold mb-2">Business Advice ({format(viewMonth, "yyyy. MM")})</h3>
        <p className="text-sm font-medium">{advice.message}</p>
      </section>
    </div>
  );
}