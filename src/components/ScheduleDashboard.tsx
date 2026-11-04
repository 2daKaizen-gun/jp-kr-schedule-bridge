"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { format, parseISO } from 'date-fns';
import CalendarView from './CalendarView';
import EmailGenerator from './EmailGenerator';
import { emailTemplates, TemplateType } from '@/lib/templates';
import { DashboardProps, Holiday, ScheduleAdvice } from '@/types/holiday';
import { readLang, readLangOnServer, subscribeToLang, writeLang } from '@/lib/language';
import { MAX_AI_ITEMS, MAX_AI_TEXT_LENGTH } from '@/lib/aiDraft';
import EventModal from './EventModal';
import { translations } from '@/lib/translations';
import { useScheduleLogic } from '@/hook/useScheduleLogic';

function VacationNotice({ names, start, end, label, tone }: {
  names: string;
  start: string;
  end: string;
  label: string;
  tone: { box: string; title: string; name: string; date: string };
}) {
  return (
    <div className={`${tone.box} border p-5 rounded-2xl`}>
      <span className={`${tone.title} font-bold block mb-2 text-lg`}>{label}</span>
      <p className={`${tone.name} font-extrabold`}>{names}</p>
      <p className={`${tone.date} text-sm`}>📅 {start === end ? start : `${start} ~ ${end}`}</p>
    </div>
  );
}

const JP_NOTICE = { box: 'bg-orange-50 border-orange-200', title: 'text-orange-800', name: 'text-orange-900', date: 'text-orange-700' };
const KR_NOTICE = { box: 'bg-red-50 border-red-200', title: 'text-red-800', name: 'text-red-900', date: 'text-red-700' };

const ADVICE_STYLES: Record<ScheduleAdvice['status'], string> = {
  work: 'bg-green-50 border-green-200',
  holiday: 'bg-gray-50 border-gray-200',
  match: 'bg-gray-50 border-gray-200',
  'kr-only': 'bg-red-50 border-red-200',
  'jp-only': 'bg-blue-50 border-blue-200',
};

export default function ScheduleDashboard({
  jpHolidays,
  krHolidays,
  initialMonth
}: DashboardProps) {

  const lang = useSyncExternalStore(subscribeToLang, readLang, readLangOnServer);
  const [selectedHolidayDate, setSelectedHolidayDate] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState("");
  const [activeTone, setActiveTone] = useState(""); // 생성 중인 톤 (비어 있으면 대기 상태)
  const [currentTone, setCurrentTone] = useState("");
  const [aiSubject, setAiSubject] = useState<string | null>(null);
  const [aiError, setAiError] = useState<'rate_limited' | 'unavailable' | 'failed' | null>(null);
  const aiRequest = useRef<AbortController | null>(null);
  const emailPanel = useRef<HTMLDivElement>(null);

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
    activeDate,
    openEventModal,
    closeEventModal
  } = useScheduleLogic(jpHolidays, krHolidays, initialMonth, lang);

  // AI 관련 로직
  const callAiApi = async (tone: string) => {
    const request = new AbortController();
    aiRequest.current = request;
    setActiveTone(tone);
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
        signal: request.signal,
        body: JSON.stringify({
          tone,
          currentMonth,
          lang,
          holidays: [...toAiHolidays(jpHolidays, 'JP'), ...toAiHolidays(krHolidays, 'KR')],
          userEvents: userEvents
            .filter(e => e.date.startsWith(currentMonth))
            .slice(0, MAX_AI_ITEMS)
            .map(e => ({ date: e.date, title: e.title.slice(0, MAX_AI_TEXT_LENGTH), countryCode: e.countryCode })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error === 'rate_limited' || data.error === 'unavailable' ? data.error : 'failed');
        return;
      }
      setEmailDraft(data.text);
      setAiSubject(data.subject);
      setCurrentTone(tone);
    } catch {
      // 다른 공휴일을 선택해 취소한 요청은 오류로 표시하지 않음
      if (!request.signal.aborted) setAiError('failed');
    } finally {
      if (aiRequest.current === request) setActiveTone("");
    }
  };

  // 기본으로 되돌림
  const handleReset = () => {
    aiRequest.current?.abort();
    aiRequest.current = null;
    setActiveTone("");
    setEmailDraft("");
    setAiSubject(null);
    setAiError(null);
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

  // 공휴일은 메일 초안으로 이동하고, 그 외 날짜는 일정 추가 모달을 염
  const handleDateClick = (date: string) => {
    if (!conflictMarkers[date]) {
      openEventModal(date);
      return;
    }

    setSelectedHolidayDate(date);
    handleReset(); // 이전 공휴일 기준의 AI 초안이 남지 않도록 초기화
    emailPanel.current?.scrollIntoView({ block: 'start' });
    emailPanel.current?.focus({ preventScroll: true });
  };

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Page Header: 언어 토글에 반응하는 설명 섹션 */}
      <header className="mb-6 sm:mb-10">
        <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-gray-900 mb-2">
          {currentT.title}
        </h2>
        <p className="text-base sm:text-lg text-gray-500 font-medium">
          {currentT.subDescription}
        </p>
      </header>

      {/* 월 이동 컨트롤러 */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4">
          <h3 className="text-xl sm:text-2xl font-black text-gray-800 ml-2 whitespace-nowrap">
            {format(viewMonth, lang === 'ko' ? "yyyy년 MM월" : "yyyy年 MM月")}
          </h3>
          <button
            onClick={goToday}
            className="px-3 py-1 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            {currentT.today}
          </button>
        </div>

        <div className='flex gap-2 sm:gap-4 items-center'>
          {/* 언어 스위처 */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button aria-pressed={lang === 'ko'} onClick={() => writeLang('ko')} className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${lang === 'ko' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'}`}>KO</button>
            <button aria-pressed={lang === 'ja'} onClick={() => writeLang('ja')} className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${lang === 'ja' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'}`}>JA</button>
          </div>
          <div className='flex gap-1'>
            <button aria-label={currentT.prevMonth} onClick={goPrev} className="p-2 hover:bg-gray-100 rounded-xl">◀</button>
            <button aria-label={currentT.nextMonth} onClick={goNext} className="p-2 hover:bg-gray-100 rounded-xl">▶</button>
          </div>
        </div>
      </div>

      {/* 달력 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
        <section className="min-w-0">
          <h3 className="text-lg font-bold mb-4 text-gray-700">🇯🇵 {currentT.japanCalendar}</h3>
          <CalendarView
            month={viewMonth}
            holidays={jpHolidays}
            countryCode="JP"
            conflictMarkers={conflictMarkers}
            userEvents={userEvents}
            lang={lang}
            onDateClick={handleDateClick}
            onDeleteEvent={deleteUserEvent}
          />
        </section>

        <section className="min-w-0">
          <h3 className="text-lg font-bold mb-4 text-gray-700">🇰🇷 {currentT.koreaCalendar}</h3>
          <CalendarView
            month={viewMonth}
            holidays={krHolidays}
            countryCode="KR"
            conflictMarkers={conflictMarkers}
            userEvents={userEvents}
            lang={lang}
            onDateClick={handleDateClick}
            onDeleteEvent={deleteUserEvent}
          />
        </section>
      </div>

      {/* 연휴 알림 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-4">
          {jpVacations.map((block) => (
            <VacationNotice
              key={block.start}
              names={block.displayNames}
              start={block.start}
              end={block.end}
              label={`🇯🇵 ${block.start === block.end ? currentT.holidayJp : currentT.vacationJp}`}
              tone={JP_NOTICE}
            />
          ))}
        </div>
        <div className="flex flex-col gap-4">
          {krVacations.map((block) => (
            <VacationNotice
              key={block.start}
              names={block.displayNames}
              start={block.start}
              end={block.end}
              label={`🇰🇷 ${block.start === block.end ? currentT.holidayKr : currentT.vacationKr}`}
              tone={KR_NOTICE}
            />
          ))}
        </div>
      </div>

      {/* 이메일 생성기 */}
      <div ref={emailPanel} tabIndex={-1} className="scroll-mt-4 outline-none">
        <EmailGenerator
          data={selectedEmail}
          onAiGenerate={callAiApi}
          onReset={handleReset}
          onAddEvent={() => selectedHolidayDate && openEventModal(selectedHolidayDate)}
          aiDraft={emailDraft}
          aiSubject={aiSubject}
          aiError={aiError}
          activeTone={activeTone}
          currentTone={currentTone}
          lang={lang}
        />
      </div>

      {/* 추천 일정 및 비즈니스 조언 */}
      <section className="mt-10 p-5 sm:p-8 bg-white rounded-3xl shadow-sm border border-green-100">
        <h3 className="text-xl font-bold text-green-800 mb-6">{currentT.bestDays}</h3>
        {today && recommendedDays.length === 0 && (
          <p className="text-sm text-gray-600">{currentT.noRecommendations}</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendedDays.map((item) => (
            <div key={item.date} className="p-4 rounded-2xl bg-green-50 border border-green-200">
              <span className="text-green-700 font-bold">{item.date}</span>
              <p className="text-xs text-green-700 mt-2">{item.reason}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`p-6 rounded-2xl border-2 ${advice ? ADVICE_STYLES[advice.status] : 'bg-gray-50 border-gray-200'}`}>
        <h3 className="font-bold mb-2">
          {currentT.todayStatus} ({today ? format(parseISO(today), lang === 'ko' ? "yyyy. MM. dd" : "yyyy/MM/dd") : "..."})
        </h3>
        <p className="text-sm font-medium">{advice?.message ?? "..."}</p>
      </section>

      {activeDate && (
        <EventModal
          date={activeDate}
          onClose={closeEventModal}
          onSave={addUserEvent}
          lang={lang}
        />
      )}
    </div>
  );
}
