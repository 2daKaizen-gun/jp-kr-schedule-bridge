import type { UserEvent } from "@/types/holiday";

const STORAGE_KEY = "user_events";
const listeners = new Set<() => void>();

const isUserEvent = (value: unknown): value is UserEvent => {
  if (typeof value !== "object" || value === null) return false;
  const event = value as Record<string, unknown>;
  return typeof event.id === "string" && typeof event.date === "string" && typeof event.title === "string";
};

// 손상되었거나 형식이 다른 저장 데이터로 앱이 중단되지 않도록 방어
export function parseUserEvents(raw: string | null): UserEvent[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isUserEvent) : [];
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
