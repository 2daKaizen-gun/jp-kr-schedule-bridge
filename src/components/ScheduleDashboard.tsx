"use client";

import React, { useState } from 'react';
import { addMonths, subMonths, format } from 'date-fns';
import CalendarView from './CalendarView';
import EmailGenerator from './EmailGenerator';
import { emailTemplates, TemplateType } from '@/lib/templates';

interface DashboardProps {
  jpHolidays: any[];
  krHolidays: any[];
  conflictMarkers: any;
  currentMonth: Date; // 초기 기준 월
}

export default function ScheduleDashboard({ 
  jpHolidays,
  krHolidays,
  conflictMarkers,
  currentMonth
}: DashboardProps) {
  
  // 현재 화면에 보여줄 달(Month)을 상태로 관리
  const [viewMonth, setViewMonth] = useState<Date>(currentMonth);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);

  // 월 이동 핸들러
  const goPrev = () => setViewMonth(subMonths(viewMonth,1));
  const goNext = () => setViewMonth(addMonths(viewMonth,1));
  const goToday = () => setViewMonth(new Date(2026,4,1));

  const handleDateClick = (date: string, holidayName: string, type: 'kr' | 'jp' | 'both') => {
    let templateKey: TemplateType = 'BOTH_HOLIDAY';
    if (type === 'kr') templateKey = 'KR_HOLIDAY';
    if (type === 'jp') templateKey = 'JP_HOLIDAY';

    const template = emailTemplates[templateKey];
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
      </div>

      {/* 달력 그리드 (viewMonth 상태에 따라 연동됨) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-700">🇯🇵 Japan Calendar</h3>
          <CalendarView
            month={viewMonth}
            holidays={jpHolidays}
            countryCode="JP"
            conflictMarkers={conflictMarkers}
            onDateClick={handleDateClick}
          />
        </section>     

        <section>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-700">🇰🇷 Korea Calendar</h3>
          <CalendarView
            month={viewMonth}
            holidays={krHolidays}
            countryCode="KR"
            conflictMarkers={conflictMarkers}
            onDateClick={handleDateClick}
          />
        </section>
      </div>

      {/* 이메일 생성기 섹션 (핵심) */}
      <section className="max-w-4xl mx-auto">
        <EmailGenerator data={selectedEmail} />
      </section>
    </div>
  );
}