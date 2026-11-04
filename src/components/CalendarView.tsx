"use client" // 클라이언트 컴포넌트

import { 
  format, startOfMonth, startOfWeek,
  isSameMonth, addDays, eachDayOfInterval 
} from "date-fns";
import { Holiday, UserEvent } from "@/types/holiday";
import { translations } from "@/lib/translations";

interface CalendarProps {
    month: Date;
    holidays: Holiday[];
    countryCode: "KR" | "JP";
    conflictMarkers: Record<string, {type: 'kr' | 'jp' | 'both'}>;
    userEvents: UserEvent[]; // 사용자 일정 데이터
    lang: 'ko' | 'ja';
    onDateClick?: (date: string) => void;
    onDeleteEvent?: (id: string) => void; // 일정 삭제 함수
}

export default function CalendarView({ month, holidays, countryCode, conflictMarkers, userEvents = [], lang, onDateClick, onDeleteEvent }: CalendarProps) {
    const monthStart = startOfMonth(month);

    // 번역 객체 정의
    const t = translations[lang].calendar;
    
    // 무조건 달력의 시작일(일요일)부터 42일(6주)간의 날짜 배열
    // 날짜가 누락되거나 중복될 일 없음
    const calendarStart = startOfWeek(monthStart);
    const calendarDays = eachDayOfInterval({
        start: calendarStart,
        end: addDays(calendarStart, 41) // 7일 * 6주 = 42일
    });

    return (
        <div className="flex flex-col gap-3">
            {/* 달력 본체 */}
            <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
                {/* 요일 헤더 */}
                <div className="grid grid-cols-7 bg-gray-100 border-b text-center text-[10px] sm:text-xs font-bold py-2">
                    {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
                        <div key={d} className={d === "SUN" ? "text-red-500" : d === "SAT" ? "text-blue-500" : "text-gray-500"}>
                            {d}
                        </div>
                    ))}
                </div>

                {/* 날짜 그리드 (6주 고정) */}
                <div className="grid grid-cols-7">
                    {calendarDays.map((day) => {
                        const formattedDate = format(day, "yyyy-MM-dd");
                        const otherCountry = countryCode === "KR" ? "jp" : "kr";
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        
                        // 공휴일/ 마커 데이터 
                        const marker = conflictMarkers?.[formattedDate];
                        // 같은 날 기념일과 공휴일이 겹치면 공휴일을 우선
                        const dayHolidays = holidays.filter((h) => h.date === formattedDate);
                        const holiday = dayHolidays.find((h) => h.isPublicHoliday) ?? dayHolidays[0];
                        
                        // 사용자 일정 필터링
                        const dayUserEvents = userEvents.filter(e => e.date === formattedDate);

                        // 공휴일 판별 로직
                        const isPublicHoliday = holiday?.isPublicHoliday;

                        return (
                            <div
                                // Key를 국가 코드와 조합하여 유일하게 설정
                                key={`${countryCode}-${formattedDate}`}
                                // 공휴일이 아니더라도 개인 일정 추가를 위해 항상 클릭 가능
                                onClick={() => onDateClick?.(formattedDate)}
                                className={`group cursor-pointer relative min-w-0 min-h-20 sm:min-h-24 border-t border-r last:border-r-0 p-1 sm:p-2 transition-all hover:bg-gray-50
                                    ${!isCurrentMonth ? "bg-gray-50/50 opacity-30" : "bg-white"}`}
                            >
                                <div className="flex justify-between items-start">
                                    {/* 키보드 조작용 버튼. 클릭은 상위 칸의 onClick으로 전달됨 */}
                                    <button
                                        type="button"
                                        aria-label={`${formattedDate}${holiday ? ` ${holiday.localName}` : ""}`}
                                        className={`text-sm font-semibold rounded ${
                                            (format(day, "i") === "7" || isPublicHoliday) ? "text-red-600" : "text-gray-700"
                                        }`}
                                    >
                                        {format(day, "d")}
                                    </button>

                                    <div className="flex gap-0.5">
                                        {/* 공휴일 마커 */}
                                        {marker?.type === otherCountry && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title={t.jpOnly} />
                                        )}
                                        {marker?.type === 'both' && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" title={t.both} />
                                        )}
                                        {/* 사용자 일정 마커 (초록색 점) */}
                                        {dayUserEvents.length > 0 && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" title={t.myEvent} />
                                        )}
                                    </div>
                                </div>
                                
                                {/* 공휴일 표시 */}
                                {holiday && isCurrentMonth && (
                                    <div className={`mt-1 text-[10px] leading-tight font-bold break-keep [overflow-wrap:anywhere] p-0.5 sm:p-1 rounded ${
                                        isPublicHoliday
                                            ? (countryCode === "KR" ? "text-red-700 bg-red-100" : "text-blue-700 bg-blue-100")
                                            : "text-gray-500 bg-gray-100"
                                    }`}>
                                        {holiday.localName}
                                    </div>
                                )}

                                {/* 사용자 일정 목록 표시 */}
                                {isCurrentMonth && dayUserEvents.map(event => {
                                    // 일정의 countryCode가 현재 달력의 countryCode와 일치하거나 'Both'일 때만 삭제 버튼 허용
                                    const canDelete = event.countryCode === countryCode || event.countryCode === 'Both';
                                    return (
                                        <div
                                            key={event.id}
                                            onClick={(e) => {
                                                e.stopPropagation(); // 부모 클릭 이벤트
                                                e.preventDefault(); // 브라우저 기본 동작 차단
                                                if (canDelete) onDeleteEvent?.(event.id);
                                            }}
                                            className={`mt-1 text-[10px] p-0.5 sm:p-1 rounded font-medium flex justify-between items-center group/event transition-colors ${
                                                canDelete 
                                                ? "bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer" 
                                                : "bg-gray-100 text-gray-500 cursor-default" // 권한 없으면 회색 처리
                                            }`}
                                        >
                                            <span className="truncate flex-1 min-w-0">{event.title}</span>
                                            {/* 삭제 권한이 있을 때만 X 버튼을 렌더링.
                                                좁은 칸에서는 제목을 보이도록 숨기되(행을 눌러 삭제 가능) 키보드·스크린 리더로는 접근 가능 */}
                                            {canDelete && (
                                                <button
                                                    type="button"
                                                    aria-label={`${t.deleteEvent}: ${event.title}`}
                                                    className="sr-only focus:not-sr-only sm:not-sr-only ml-1 text-red-600 font-bold hover:scale-125 transition-transform px-1"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteEvent?.(event.id);
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                                
                                {isPublicHoliday && isCurrentMonth && (
                                    <div className="hidden sm:block absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-xs">⚠️</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 범례 추가(Legend) */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100 items-center">
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">{t.legend}:</span>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-xs text-gray-600 font-medium">{t.jpOnly}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-xs text-gray-600 font-medium">{t.both}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs text-gray-600 font-medium">{t.myEvent}</span>
                </div>
            </div>
        </div>
    );     
}