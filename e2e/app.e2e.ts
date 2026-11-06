import { expect, Page, Route, test } from "@playwright/test";

// 모든 테스트는 고정 공휴일 데이터와 2026-11-04(수) 기준으로 동작
const TODAY = "2026-11-04T12:00:00";

const fulfillJson = (route: Route, status: number, body: unknown) =>
  route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

const AI_DRAFT = {
  subject: "件名テスト",
  body: "本文テスト",
  translationSubject: "제목 테스트",
  translationBody: "본문 테스트",
};

async function openApp(page: Page, options: { today?: string; events?: unknown[]; lang?: "ko" | "ja" } = {}) {
  await page.clock.setFixedTime(new Date(options.today ?? TODAY));
  await page.addInitScript(({ events, lang }) => {
    if (sessionStorage.getItem("seeded")) return;
    if (events) localStorage.setItem("user_events", JSON.stringify(events));
    if (lang) localStorage.setItem("lang", lang);
    sessionStorage.setItem("seeded", "1");
  }, { events: options.events, lang: options.lang });
  await page.goto("/");
}

// 일본 달력의 문화의 날(11/3) 버튼
const cultureDay = (page: Page) => page.getByRole("button", { name: "2026-11-03 文化の日" });
const dateButton = (page: Page, date: string) => page.getByRole("button", { name: date, exact: true }).first();

test.describe("calendar", () => {
  test("shows public holidays and observances from the API", async ({ page }) => {
    await openApp(page);
    await expect(page.getByRole("heading", { name: "2026년 11월" })).toBeVisible();
    await expect(cultureDay(page)).toBeVisible();
    await expect(page.getByText("七五三")).toBeVisible();
    // 11월의 일본 공휴일은 하루씩 떨어져 있으므로 연휴가 아닌 공휴일 안내가 두 개 나옴
    await expect(page.getByText("일본 공휴일 주의")).toHaveCount(2);
    await expect(page.getByText("일본 연휴 주의")).toHaveCount(0);
  });

  test("groups consecutive holidays into one notice", async ({ page }) => {
    await openApp(page, { today: "2026-09-10T12:00:00" });
    await expect(page.getByText("일본 연휴 주의")).toBeVisible();
    await expect(page.getByText("2026-09-21 ~ 2026-09-23")).toBeVisible();
    await expect(page.getByText("2026-09-24 ~ 2026-09-26")).toBeVisible();
  });

  for (const [today, color, label] of [
    ["2026-11-03T12:00:00", "bg-blue-50", "a Japanese holiday"],
    ["2026-10-09T12:00:00", "bg-red-50", "a Korean holiday"],
    ["2026-11-07T12:00:00", "bg-gray-50", "a weekend"],
    ["2026-11-04T12:00:00", "bg-green-50", "a working day"],
  ] as const) {
    test(`colors today's status on ${label}`, async ({ page }) => {
      await openApp(page, { today });
      await expect(page.locator("section", { hasText: "오늘의 비즈니스 상태" })).toHaveClass(new RegExp(color));
    });
  }
});

test.describe("holiday email", () => {
  test("shows a two-panel template without opening the event dialog", async ({ page }) => {
    await openApp(page);
    await cultureDay(page).click();
    await expect(page.locator("dialog")).toHaveCount(0);
    await expect(page.locator("#email-subject")).toHaveValue(/^【ご確認】2026-11-03 日本の祝日（文化の日）/);
    await expect(page.locator("#translation-subject")).toHaveValue(/^\[확인\] 2026-11-03 일본 공휴일/);
    await expect(page.locator("#email-subject")).toBeInViewport();
  });

  test("uses Korean mail with a Japanese translation in the Japanese UI", async ({ page }) => {
    await openApp(page, { lang: "ja" });
    await cultureDay(page).click();
    await expect(page.locator("#email-subject")).toHaveValue(/^\[안내\] 2026-11-03 일본 공휴일\(文化の日\)/);
    await expect(page.locator("#translation-subject")).toHaveValue(/^【お知らせ】/);
  });

  test("adds an event on the selected holiday", async ({ page }) => {
    await openApp(page);
    await cultureDay(page).click();
    await page.getByRole("button", { name: "+ 이 날짜에 일정 추가" }).click();
    await expect(page.locator("dialog h3")).toContainText("2026-11-03");
    await page.keyboard.type("HolidayEvent");
    await page.keyboard.press("Enter");
    await expect(page.locator("dialog")).toHaveCount(0);
    await expect(page.getByText("HolidayEvent").first()).toBeVisible();
  });

  test("reports a failed copy", async ({ page }) => {
    await openApp(page);
    await cultureDay(page).click();
    await page.evaluate(() => {
      navigator.clipboard.writeText = () => Promise.reject(new Error("denied"));
    });
    await page.getByRole("button", { name: "전체 복사" }).first().click();
    await expect(page.locator("p[role=alert]")).toContainText("복사하지 못했습니다");
  });
});

test.describe("AI draft", () => {
  test("sends holiday data and shows the draft beside its translation", async ({ page }) => {
    await openApp(page);
    let request: { holidays: { name: string }[]; lang: string; tone: string } | undefined;
    await page.route("**/analyze", async route => {
      request = route.request().postDataJSON();
      await fulfillJson(route, 200, AI_DRAFT);
    });
    await cultureDay(page).click();
    await expect(page.getByRole("button", { name: "기본" })).toBeDisabled();
    await page.getByRole("button", { name: "정중" }).click();

    await expect(page.locator("#email-body")).toHaveValue("本文テスト");
    await expect(page.locator("#translation-body")).toHaveValue("본문 테스트");
    expect(request?.tone).toBe("formal");
    expect(request?.lang).toBe("ko");
    expect(request?.holidays.map(h => h.name)).toEqual(expect.arrayContaining(["文化の日", "勤労感謝の日"]));

    await page.getByRole("button", { name: "기본" }).click();
    await expect(page.locator("#email-subject")).toHaveValue(/^【ご確認】/);
  });

  for (const [status, code, message] of [
    [429, "rate_limited", "AI 사용량 한도"],
    [503, "unavailable", "AI 서비스가 일시적으로 혼잡합니다"],
    [500, "failed", "메일을 생성하지 못했습니다"],
  ] as const) {
    test(`shows a message for ${code}`, async ({ page }) => {
      await openApp(page);
      await page.route("**/analyze", route => fulfillJson(route, status, { error: code }));
      await cultureDay(page).click();
      await page.getByRole("button", { name: "긴급" }).click();
      await expect(page.locator("p[role=alert]")).toContainText(message);
      await expect(page.getByRole("button", { name: "긴급" })).toBeEnabled();
    });
  }

  test("discards a response for a previously selected holiday", async ({ page }) => {
    await openApp(page);
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    await page.route("**/analyze", async route => {
      await gate;
      await fulfillJson(route, 200, { ...AI_DRAFT, subject: "STALE" }).catch(() => {});
    });
    await cultureDay(page).click();
    await page.getByRole("button", { name: "사과" }).click();
    await page.getByRole("button", { name: "2026-11-23 勤労感謝の日" }).click();
    release();
    await expect(page.locator("#email-subject")).toHaveValue(/2026-11-23/);
    await expect(page.locator("p[role=alert]")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "사과" })).toBeEnabled();
  });

  test("clears the draft when the language changes", async ({ page }) => {
    await openApp(page);
    await page.route("**/analyze", route => fulfillJson(route, 200, AI_DRAFT));
    await cultureDay(page).click();
    await page.getByRole("button", { name: "정중" }).click();
    await expect(page.locator("#email-body")).toHaveValue("本文テスト");
    await page.getByRole("button", { name: "JA", exact: true }).click();
    await expect(page.locator("#email-body")).not.toHaveValue("本文テスト");
  });
});

test.describe("events and preferences", () => {
  test("saves an event with Enter and skips it in recommendations", async ({ page }) => {
    await openApp(page);
    await dateButton(page, "2026-11-10").click();
    await page.keyboard.type("회의 Meeting");
    await page.keyboard.press("Enter");
    await expect(page.locator("dialog")).toHaveCount(0);
    await expect(page.getByText("회의 Meeting").first()).toBeVisible();
    await expect(page.locator("section", { hasText: "최적의 협업일" })).not.toContainText("2026-11-10");
  });

  test("keeps and deletes events saved by earlier versions", async ({ page }) => {
    await openApp(page, { events: [{ id: 1700000000000, date: "2026-11-10", title: "LegacyEvent" }] });
    await expect(page.getByText("LegacyEvent")).toHaveCount(2);
    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("button", { name: "일정 삭제: LegacyEvent" }).first().click();
    await expect(page.getByText("LegacyEvent")).toHaveCount(0);
  });

  test("remembers the language after a reload", async ({ page }) => {
    await openApp(page);
    await page.getByRole("button", { name: "JA", exact: true }).click();
    await page.reload();
    await expect(page.getByRole("heading", { name: "ビジネスカレンダーダッシュボード" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  });
});

test.describe("small screens", () => {
  test.use({ viewport: { width: 320, height: 800 }, isMobile: true, hasTouch: true });

  test("fits the page and stacks the draft panels", async ({ page }) => {
    await openApp(page);
    await cultureDay(page).click();
    const fits = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
    expect(fits).toBe(true);
    const mail = await page.locator("#email-body").boundingBox();
    const translation = await page.locator("#translation-body").boundingBox();
    expect(translation!.y).toBeGreaterThan(mail!.y + mail!.height);
  });
});
