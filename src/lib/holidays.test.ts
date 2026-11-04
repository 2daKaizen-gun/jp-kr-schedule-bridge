import { describe, expect, it } from "vitest";
import { analyzeBusinessDay, getRecommendedMeetingDays, getVacationBlocks, isPublicHolidayDescription } from "./holidays";
import type { Holiday } from "@/types/holiday";

const holiday = (date: string, localName: string, isPublicHoliday: boolean): Holiday => ({
    date,
    localName,
    isPublicHoliday,
});

describe("isPublicHolidayDescription", () => {
    it("treats Google's public holiday labels as public holidays", () => {
        expect(isPublicHolidayDescription("공휴일")).toBe(true);
        expect(isPublicHolidayDescription("祝日")).toBe(true);
    });

    it("rejects observances, including their multi-line descriptions", () => {
        expect(isPublicHolidayDescription("기념일\n기념일을 숨기려면 Google Calendar 설정")).toBe(false);
        expect(isPublicHolidayDescription("祭日\n祭日を非表示にするには")).toBe(false);
    });

    it("rejects a missing description", () => {
        expect(isPublicHolidayDescription(undefined)).toBe(false);
    });
});

describe("analyzeBusinessDay", () => {
    it("treats a weekday observance as a working day", () => {
        // 2026-05-08 (Fri) 어버이날
        const result = analyzeBusinessDay("2026-05-08", [holiday("2026-05-08", "어버이날", false)], []);
        expect(result.status).toBe("work");
    });

    it("flags a weekday public holiday in one country", () => {
        // 2026-05-01 (Fri) 노동절
        const result = analyzeBusinessDay("2026-05-01", [holiday("2026-05-01", "노동절", true)], []);
        expect(result.status).toBe("kr-only");
    });

    it("flags a holiday shared by both countries", () => {
        const shared = holiday("2026-05-05", "어린이날", true);
        expect(analyzeBusinessDay("2026-05-05", [shared], [shared]).status).toBe("match");
    });
});

describe("getRecommendedMeetingDays", () => {
    // 2026-11-02 is a Monday; a non-midnight time must not affect the result
    const today = new Date(2026, 10, 2, 15, 30);
    const blocked = (...dates: string[]) => dates.map(date => ({ date, isPublicHoliday: true }));

    it("only recommends Monday to Thursday within the next two weeks", () => {
        const dates = getRecommendedMeetingDays([], today).map(d => d.date);
        expect(dates).toEqual(["2026-11-03", "2026-11-04", "2026-11-05"]);
    });

    it("skips holidays and the day before a holiday", () => {
        const dates = getRecommendedMeetingDays(blocked("2026-11-04"), today).map(d => d.date);
        expect(dates).not.toContain("2026-11-03");
        expect(dates).not.toContain("2026-11-04");
    });

    it("ignores observances", () => {
        const dates = getRecommendedMeetingDays([{ date: "2026-11-03", isPublicHoliday: false }], today).map(d => d.date);
        expect(dates).toContain("2026-11-03");
    });

    it("lowers the score when a holiday is two days away", () => {
        const days = blocked("2026-11-03", "2026-11-04", "2026-11-05", "2026-11-09", "2026-11-12", "2026-11-16");
        const result = getRecommendedMeetingDays(days, today);
        expect(result.map(d => [d.date, d.score])).toEqual([["2026-11-10", 70]]);
    });
});

describe("getVacationBlocks", () => {
    it("ignores observances", () => {
        const blocks = getVacationBlocks([
            holiday("2026-05-05", "어린이날", true),
            holiday("2026-05-15", "스승의날", false),
        ]);
        expect(blocks).toHaveLength(1);
        expect(blocks[0].displayNames).toBe("어린이날");
    });

    it("merges holidays up to three days apart and splits the rest", () => {
        const blocks = getVacationBlocks([
            holiday("2026-05-06", "憲法記念日 振替休日", true),
            holiday("2026-05-03", "憲法記念日", true),
            holiday("2026-04-29", "昭和の日", true),
        ]);
        expect(blocks).toEqual([
            { start: "2026-04-29", end: "2026-04-29", displayNames: "昭和の日" },
            { start: "2026-05-03", end: "2026-05-06", displayNames: "憲法記念日, 憲法記念日 振替休日" },
        ]);
    });

    it("returns nothing for an empty list", () => {
        expect(getVacationBlocks([])).toEqual([]);
    });
});
