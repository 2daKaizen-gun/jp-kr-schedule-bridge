"use client" // 클라이언트 컴포넌트

import { 
  format, startOfMonth, endOfMonth, startOfWeek, 
  isSameMonth, addDays, eachDayOfInterval 
} from "date-fns";
import { Holiday, UserEvent } from "@/types/holiday";

interface CalendarProps {
    month: Date;
    holidays: Holiday[];
    countryCode: "KR" | "JP";
    conflictMarkers: Record<string, {type: 'kr' | 'jp' | 'both'}>;
    userEvents: UserEvent[]; // 사용자 일정 데이터
    onDateClick?: (date: string, holidayName: string, type: 'kr' | 'jp' | 'both') => void;
    onDeleteEvent?: (id: string) => void; // 일정 삭제 함수
}

export default function CalendarView({ month, holidays, countryCode, conflictMarkers, userEvents = [], onDateClick, onDeleteEvent }: CalendarProps) {
    const monthStart = startOfMonth(month);
    
    const monthEnd = endOfMonth(monthStart);
    
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
                <div className="grid grid-cols-7 bg-gray-100 border-b text-center text-xs font-bold py-2">
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
                        const holiday = holidays.find((h) => h.date === formattedDate);
                        
                        // 사용자 일정 필터링
                        const dayUserEvents = userEvents.filter(e => e.date === formattedDate);

                        // 공휴일 판별 로직
                        const isPublicHoliday = holiday && (
                            (!holiday.localName.includes("Day") || 
                            holiday.localName.includes("Replacement") || 
                            holiday.localName.includes("Memorial")) && 
                            !["노동절", "어버이날", "스승의날", "제헌절", "국군의날"].includes(holiday.localName)
                        );

                        return (
                            <div
                                // Key를 국가 코드와 조합하여 유일하게 설정
                                key={`${countryCode}-${formattedDate}`}
                                onClick={() => {
                                    // 공휴일이 아니더라도 개인 일정 추가를 위해 항상 클릭 가능
                                    onDateClick?.(
                                        formattedDate, 
                                        holiday?.localName || "비즈니스 일정", 
                                        marker?.type || (countryCode === 'KR' ? 'kr' : 'jp')
                                    );
                                }}
                                className={`group cursor-pointer relative h-24 border-t border-r last:border-r-0 p-2 transition-all hover:bg-gray-50
                                    ${!isCurrentMonth ? "bg-gray-50/50 opacity-30" : "bg-white"}`}
                            >
                                <div className="flex justify-between items-start">
                                    <span className={`text-sm font-semibold ${
                                        (format(day, "i") === "7" || isPublicHoliday) ? "text-red-500" : "text-gray-700"
                                    }`}>
                                        {format(day, "d")}
                                    </span>

                                    <div className="flex gap-0.5">
                                        {/* 공휴일 마커 */}
                                        {marker?.type === otherCountry && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="상대국만 휴무" />
                                        )}
                                        {marker?.type === 'both' && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" title="양국 공휴일" />
                                        )}
                                        {/* 사용자 일정 마커 (초록색 점) */}
                                        {dayUserEvents.length > 0 && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" title="사용자 일정 있음" />
                                        )}
                                    </div>
                                </div>
                                
                                {/* 공휴일 표시 */}
                                {holiday && isCurrentMonth && (
                                    <div className={`mt-1 text-[10px] leading-tight font-bold break-keep p-1 rounded ${
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
                                            className={`mt-1 text-[9px] p-1 rounded truncate font-medium flex justify-between items-center group/event transition-colors ${
                                                canDelete 
                                                ? "bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer" 
                                                : "bg-gray-100 text-gray-500 cursor-default" // 권한 없으면 회색 처리
                                            }`}
                                        >
                                            <span className="truncate flex-1">{event.title}</span>
                                            {/* 삭제 권한이 있을 때만 X 버튼을 렌더링 */}
                                            {canDelete && (
                                                <span 
                                                    className="ml-1 text-red-500 font-bold hover:scale-125 transition-transform px-1"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteEvent?.(event.id);
                                                    }}
                                                >
                                                    ✕
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                                
                                {isPublicHoliday && isCurrentMonth && (
                                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-xs">⚠️</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 범례 추가(Legend) */}
            <div className="flex flex-wrap gap-4 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100 items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Legend:</span>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-xs text-gray-600 font-medium">상대국만 휴무 (협업 주의)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-xs text-gray-600 font-medium">양국 공휴일 (비즈니스 중단)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-xs">⚠️</span>
                    <span className="text-xs text-gray-600 font-medium">휴무일 (마우스 오버)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs text-gray-600 font-medium">내 일정</span>
                </div>
            </div>
        </div>
    );     
}