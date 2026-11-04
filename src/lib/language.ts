import type { Lang } from "@/types/holiday";

const STORAGE_KEY = "lang";
const DEFAULT_LANG: Lang = "ko";
const listeners = new Set<() => void>();

// 저장소를 쓸 수 없는 환경에서도 현재 탭에서는 언어 전환이 동작하도록 함께 보관
let currentLang: Lang = DEFAULT_LANG;

export const parseLang = (raw: string | null, fallback: Lang = DEFAULT_LANG): Lang =>
  raw === "ko" || raw === "ja" ? raw : fallback;

export function subscribeToLang(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener); // 다른 탭의 변경도 반영
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function readLang(): Lang {
  try {
    return parseLang(localStorage.getItem(STORAGE_KEY), currentLang);
  } catch {
    return currentLang;
  }
}

export const readLangOnServer = (): Lang => DEFAULT_LANG;

export function writeLang(lang: Lang) {
  currentLang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (error) {
    console.error("Failed to save language:", error);
  }
  listeners.forEach(listener => listener());
}
