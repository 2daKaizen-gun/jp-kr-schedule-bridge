import { describe, expect, it } from "vitest";
import { MAX_AI_ITEMS, parseAiDraft, parseAnalyzeRequest } from "./aiDraft";

const validRequest = {
  tone: "formal",
  lang: "ko",
  currentMonth: "2026-11",
  holidays: [{ country: "JP", date: "2026-11-03", name: "文化の日" }],
  userEvents: [{ date: "2026-11-10", title: "프로젝트 미팅", countryCode: "Both" }],
};

describe("parseAnalyzeRequest", () => {
  it("accepts a valid request", () => {
    expect(parseAnalyzeRequest(validRequest)).toEqual(validRequest);
  });

  it("drops unknown fields", () => {
    const parsed = parseAnalyzeRequest({
      ...validRequest,
      extra: "ignored",
      userEvents: [{ date: "2026-11-10", title: "미팅", id: "secret" }],
    });
    expect(parsed).not.toHaveProperty("extra");
    expect(parsed?.userEvents[0]).not.toHaveProperty("id");
  });

  it.each([
    ["a non-object body", null],
    ["an unknown tone", { ...validRequest, tone: "constructor" }],
    ["an unknown language", { ...validRequest, lang: "en" }],
    ["a malformed month", { ...validRequest, currentMonth: "November" }],
    ["missing holidays", { ...validRequest, holidays: undefined }],
    ["a malformed holiday date", { ...validRequest, holidays: [{ country: "JP", date: "tomorrow", name: "x" }] }],
    ["an overlong title", { ...validRequest, userEvents: [{ date: "2026-11-10", title: "x".repeat(101) }] }],
    ["too many events", { ...validRequest, userEvents: Array(MAX_AI_ITEMS + 1).fill({ date: "2026-11-10", title: "x" }) }],
  ])("rejects %s", (_name, body) => {
    expect(parseAnalyzeRequest(body)).toBeNull();
  });
});

describe("parseAiDraft", () => {
  it("separates the subject from the body", () => {
    expect(parseAiDraft("件名: 日程調整のお願い\n\nいつもお世話になっております。")).toEqual({
      subject: "日程調整のお願い",
      body: "いつもお世話になっております。",
    });
  });

  it("handles a full-width colon and markdown emphasis", () => {
    expect(parseAiDraft("**件名：日程調整のお願い**\n本文").subject).toBe("日程調整のお願い");
  });

  it("keeps the text when there is no subject line", () => {
    expect(parseAiDraft(" 本文のみ ")).toEqual({ subject: null, body: "本文のみ" });
  });
});
