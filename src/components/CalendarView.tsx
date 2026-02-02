"use client" // 클라이언트 컴포넌트

import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from "date-fns";
import { Holiday } from "@/types/holiday";

interface CalendarProps {
    month: Date;
    holidays: Holiday[];
    countryCode: "KR" | "JP";
}

export default function CalendarView({ month, holidays, countryCode }: CalendarProps) {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
        for (let i = 0; i < 7; i++) {
            const formattedDate = format(day, "yyyy-MM-dd");
            const holiday = holidays.find((h) => h.date === formattedDate);
            const isCurrentMonth = isSameMonth(day, monthStart);

            days.push(
                <div
                    key={formattedDate}
                    className={`relative h-24 border-t p-2 transition-all ${
                        !isCurrentMonth ? "bg-gray-50 text-gray-300" : "bg-white"
                    } ${holiday ? (countryCode === "KR" ? "bg-red-50" : "bg-blue-50") : ""}`}
                >
                    <span className={`text-sm font-semibold ${holiday ? "text-red-600" : ""}`}>
                        {format(day, "d")}
                    </span>
                    {holiday && (
                        <div className="mt-1 text-[10px] leading-tight font-medium text-gray-700 break-keep">
                            {holiday.localName}
                        </div>
                    )}
                </div>
            );
            day = addDays(day, 1);
        }
        rows.push(
            <div className="grid grid-cols-7" key={day.toString()}>
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