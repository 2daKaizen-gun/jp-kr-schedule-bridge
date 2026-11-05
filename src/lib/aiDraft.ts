import type { Lang } from "@/types/holiday";

export const AI_TONES = ["formal", "urgent", "apology"] as const;
export type AiTone = (typeof AI_TONES)[number];

export const MAX_AI_ITEMS = 100;
export const MAX_AI_TEXT_LENGTH = 100;

export type AiErrorCode = "invalid_request" | "rate_limited" | "unavailable" | "failed";

interface AiHoliday {
  country: "KR" | "JP";
  date: string;
  name: string;
}

interface AiUserEvent {
  date: string;
  title: string;
  countryCode?: "KR" | "JP" | "Both";
}

interface AnalyzeRequest {
  tone: AiTone;
  lang: Lang;
  currentMonth: string;
  holidays: AiHoliday[];
  userEvents: AiUserEvent[];
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_PATTERN = /^\d{4}-\d{2}$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isShortText = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= MAX_AI_TEXT_LENGTH;

const isDate = (value: unknown) => typeof value === "string" && DATE_PATTERN.test(value);

const isAiHoliday = (value: unknown): value is AiHoliday =>
  isRecord(value) &&
  (value.country === "KR" || value.country === "JP") &&
  isDate(value.date) &&
  isShortText(value.name);

const isAiUserEvent = (value: unknown): value is AiUserEvent =>
  isRecord(value) &&
  isDate(value.date) &&
  isShortText(value.title) &&
  (value.countryCode === undefined || ["KR", "JP", "Both"].includes(value.countryCode as string));

const isBoundedList = <T,>(value: unknown, check: (item: unknown) => item is T): value is T[] =>
  Array.isArray(value) && value.length <= MAX_AI_ITEMS && value.every(check);

// 외부에서 들어온 요청 본문을 검증하고, 프롬프트에 필요한 필드만 남김
export function parseAnalyzeRequest(body: unknown): AnalyzeRequest | null {
  if (!isRecord(body)) return null;

  const { tone, lang, currentMonth, holidays, userEvents } = body;

  if (!AI_TONES.includes(tone as AiTone)) return null;
  if (lang !== "ko" && lang !== "ja") return null;
  if (typeof currentMonth !== "string" || !MONTH_PATTERN.test(currentMonth)) return null;
  if (!isBoundedList(holidays, isAiHoliday)) return null;
  if (!isBoundedList(userEvents, isAiUserEvent)) return null;

  return {
    tone: tone as AiTone,
    lang,
    currentMonth,
    holidays: holidays.map(({ country, date, name }) => ({ country, date, name })),
    userEvents: userEvents.map(({ date, title, countryCode }) => ({ date, title, countryCode })),
  };
}

// 일시적 오류면 다음 모델로 넘어가고, 모든 모델이 실패하면 마지막 오류를 전달
export async function tryModels<T>(
  models: readonly string[],
  run: (model: string) => Promise<T>,
  isTemporary: (error: unknown) => boolean
): Promise<T> {
  let lastError: unknown = new Error("No models configured");
  for (const model of models) {
    try {
      return await run(model);
    } catch (error) {
      if (!isTemporary(error)) throw error;
      console.warn(`Gemini model ${model} is temporarily unavailable; trying the next one.`);
      lastError = error;
    }
  }
  throw lastError;
}

// 응답의 "件名: ..." 줄을 제목으로 분리하고, 없으면 본문을 그대로 반환
export function parseAiDraft(text: string): { subject: string | null; body: string } {
  const match = text.match(/^[ \t*#]*件名[ \t*]*[:：][ \t*]*(.+?)[ \t*]*$/m);
  if (!match) return { subject: null, body: text.trim() };

  return { subject: match[1], body: text.replace(match[0], "").trim() };
}
