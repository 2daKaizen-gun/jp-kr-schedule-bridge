import { describe, expect, it } from "vitest";
import { emailTemplates } from "./templates";

const HANGUL = /[가-힣]/;

describe("Japanese email templates", () => {
  it.each(Object.entries(emailTemplates.ja))("%s contains no Hangul or ASCII sentence punctuation", (_key, template) => {
    for (const text of [template.subject("2026-11-03", "文化の日"), template.body("2026-11-03", "文化の日")]) {
      expect(text).not.toMatch(HANGUL);
      expect(text).not.toMatch(/[.,]\s/);
      expect(text).not.toMatch(/[.,]$/m);
    }
  });
});

describe("Korean email templates", () => {
  it.each(Object.entries(emailTemplates.ko))("%s includes the date in the subject", (_key, template) => {
    expect(template.subject("2026-11-03", "문화의 날")).toContain("2026-11-03");
  });
});
