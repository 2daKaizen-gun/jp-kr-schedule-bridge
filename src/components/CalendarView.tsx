"use client" // 클라이언트 컴포넌트

import { 
  format, startOfMonth, endOfMonth, startOfWeek, 
  isSameMonth, addDays, eachDayOfInterval 
} from "date-fns";
import { Holiday } from "@/types/holiday";

interface CalendarProps {
    month: Date;
    holidays: Holiday[];
    countryCode: "KR" | "JP";
    conflictMarkers: Record<string, {type: 'kr' | 'jp' | 'both'}>;
    onDateClick?: (date: string, holidayName: string, type: 'kr' | 'jp' | 'both') => void;
}

export default function CalendarView({ month, holidays, countryCode, conflictMarkers, onDateClick }: CalendarProps) {
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
                        const marker = conflictMarkers?.[formattedDate];
                        const otherCountry = countryCode === "KR" ? "jp" : "kr";
                        const holiday = holidays.find((h) => h.date === formattedDate);
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        
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
                                    if (holiday || marker) {
                                        onDateClick?.(formattedDate, holiday?.localName || "공휴일", marker?.type || (countryCode === 'KR' ? 'kr' : 'jp'));
                                    }
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
                                        {marker?.type === otherCountry && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="상대국만 휴무" />
                                        )}
                                        {marker?.type === 'both' && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" title="양국 공휴일" />
                                        )}
                                    </div>
                                </div>
                                
                                {holiday && isCurrentMonth && (
                                    <div className={`mt-1 text-[10px] leading-tight font-bold break-keep p-1 rounded ${
                                        isPublicHoliday
                                            ? (countryCode === "KR" ? "text-red-700 bg-red-100" : "text-blue-700 bg-blue-100")
                                            : "text-gray-400 bg-gray-100"
                                    }`}>
                                        {holiday.localName}
                                    </div>
                                )}

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
            </div>
        </div>
    );     
}