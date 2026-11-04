import type { UserEvent } from "@/types/holiday";

const STORAGE_KEY = "user_events";
const listeners = new Set<() => void>();

// 이전 버전이 저장한 일정(숫자 id, 국가 범위 없음)도 유지되도록 현재 형식으로 변환
const toUserEvent = (value: unknown): UserEvent | null => {
  if (typeof value !== "object" || value === null) return null;
  const { id, date, title, type, countryCode } = value as Record<string, unknown>;
  if ((typeof id !== "string" && typeof id !== "number") || typeof date !== "string" || typeof title !== "string") {
    return null;
  }
  return {
    id: String(id),
    date,
    title,
    type: type === "holiday" ? "holiday" : "meeting",
    countryCode: countryCode === "KR" || countryCode === "JP" ? countryCode : "Both",
  };
};

// 손상되었거나 형식이 다른 저장 데이터로 앱이 중단되지 않도록 방어
export function parseUserEvents(raw: string | null): UserEvent[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(toUserEvent).filter((event): event is UserEvent => event !== null);
  } catch {
    return [];
  }
}

export function subscribeToUserEvents(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener); // 다른 탭의 변경도 반영
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function readUserEvents() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export const readUserEventsOnServer = () => null;

export function writeUserEvents(events: UserEvent[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    console.error("Failed to save user events:", error);
  }
  listeners.forEach(listener => listener());
}
