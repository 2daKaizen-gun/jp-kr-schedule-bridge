"use client" // 클라이언트 컴포넌트

import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from "date-fns";
import { Holiday } from "@/types/holiday";

interface CalendarProps {
    month: Date;
    holidays: Holiday[];
    countryCode: "KR" | "JP";
    conflictMarkers: Record<string, {type: 'kr' | 'jp' | 'both'}>;
}

export default function CalendarView({ month, holidays, countryCode, conflictMarkers }: CalendarProps) {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
        // row 위해 일요일 따로 저장
        const weekKey = format(day, "yyyy-MM-dd");
        for (let i = 0; i < 7; i++) {
            const formattedDate = format(day, "yyyy-MM-dd");
            // marker data 가져오기
            const marker = conflictMarkers?.[formattedDate];
            const otherCountry = countryCode === "KR"?"jp":"kr";
            const holiday = holidays.find((h) => h.date === formattedDate);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isPublicHoliday = holiday && (
                (!holiday.localName.includes("Day") || //기념일 제외 로직
                holiday.localName.includes("Replacement") || //대체공휴일 포함
                holiday.localName.includes("Memorial")) && //주요 휴일 포함
                !["노동절", "어버이날", "스승의날", "제헌절", "국군의날"].includes(holiday.localName)
            );

            days.push(
                <div
                    key={formattedDate}
                    className={`group relative h-24 border-t p-2 transition-all ${
                        !isCurrentMonth ? "bg-gray-50 text-gray-300" : "bg-white"
                    } ${isPublicHoliday ? (countryCode === "KR" ? "bg-red-50" : "bg-blue-50") : ""}`}
                >  
                    {/* 날짜 숫자 상단에 점 찍기 */}
                    <div className="flex justify-between items-start">
                    {/* 일요일 또는 공휴일만 숫자 빨간색으로 */}
                        <span className={`text-sm font-semibold ${
                            (format(day, "i") === "7" || isPublicHoliday) ? "text-red-500" : "text-gray-700"
                        }`}>
                            {format(day, "d")}
                        </span>

                        {/* 점 그리기 로직 */}
                        <div className="flex gap-0.5">
                            {marker?.type === otherCountry && (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="상대국만 휴무" />
                            )}
                            {marker?.type === 'both' && (
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" title="양국 공휴일" />
                            )}
                        </div>
                    </div>
                    
                    {/* 휴일/기념일 이름 표시 */}
                    {holiday && (
                        <div className={`mt-1 text-[10px] leading-tight font-bold break-keep p-1 rounded ${
                        isPublicHoliday
                            ? (countryCode === "KR" ? "text-red-700 bg-red-100" : "text-blue-700 bg-blue-100")
                            : "text-gray-400 bg-gray-100" // 쉬지 않는 기념일 회색 처리
                        }`}>
                            {holiday.localName}
                        </div>
                    )}

                    {/* 협업 불가 아이콘 */}
                    {isPublicHoliday && (
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs">⚠️</span>
                        </div>
                    )}
                </div>
            );
            day = addDays(day, 1);
        }
        rows.push(
            <div className="grid grid-cols-7" key={`row-${weekKey}`}>
                {days}
            </div>
        );
        days = [];
    }

    return (
        <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
            <div className="grid grid-cols-7 bg-gray-100 border-b text-center text-xs font-bold py-2">
                {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
                    <div key={d} className={d === "SUN" ? "text-red-500" : d === "SAT" ? "text-blue-500" : ""}>
                        {d}
                    </div>
                ))}
            </div>
            {rows}
        </div>
    );
}