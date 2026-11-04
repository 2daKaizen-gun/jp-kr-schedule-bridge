interface Window {
  count: number;
  resetAt: number;
}

const MAX_TRACKED_KEYS = 1000;

// 고정 시간 창 기반 메모리 제한기. 서버 인스턴스별로 따로 동작하므로 최선 노력 방식임
export function createRateLimiter(limit: number, windowMs: number, now: () => number = Date.now) {
  const windows = new Map<string, Window>();

  const prune = (time: number) => {
    for (const [key, window] of windows) {
      if (window.resetAt <= time) windows.delete(key);
    }
    // 만료된 항목을 지워도 많으면 오래된 항목부터 제거해 메모리 사용량을 제한
    for (const key of windows.keys()) {
      if (windows.size < MAX_TRACKED_KEYS) break;
      windows.delete(key);
    }
  };

  // 허용되면 null, 초과하면 재시도까지 남은 초를 반환
  return (key: string): number | null => {
    const time = now();
    const current = windows.get(key);

    if (!current || current.resetAt <= time) {
      if (windows.size >= MAX_TRACKED_KEYS) prune(time);
      windows.set(key, { count: 1, resetAt: time + windowMs });
      return null;
    }

    if (current.count >= limit) {
      return Math.ceil((current.resetAt - time) / 1000);
    }

    current.count += 1;
    return null;
  };
}

// Vercel은 x-forwarded-for를 직접 설정하므로 첫 번째 값이 실제 클라이언트 주소임
export function getClientKey(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0].trim() || headers.get("x-real-ip") || "unknown";
}
