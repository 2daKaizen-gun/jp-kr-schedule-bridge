"use client";

import React, { useState } from 'react';
import CalendarView from './CalendarView';
import EmailGenerator from './EmailGenerator';
import { emailTemplates, TemplateType } from '@/lib/templates';

export default function ScheduleDashboard({ jpHolidays, krHolidays, conflictMarkers, currentMonth }: any) {
  const [selectedEmail, setSelectedEmail] = useState<any>(null);

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
      {/* 달력 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">🇯🇵 Japan Calendar</h3>
          <CalendarView 
            month={currentMonth} 
            holidays={jpHolidays} 
            countryCode="JP" 
            conflictMarkers={conflictMarkers}
            onDateClick={handleDateClick}
          />
        </section>

        <section>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">🇰🇷 Korea Calendar</h3>
          <CalendarView 
            month={currentMonth} 
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