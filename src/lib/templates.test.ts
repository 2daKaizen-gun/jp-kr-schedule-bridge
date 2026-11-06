import { describe, expect, it } from "vitest";
import { buildTemplateDraft, templateRole, TemplateRole } from "./templates";

const HANGUL = /[가-힣]/;
const KANA = /[぀-ヿ]/;
const ROLES: TemplateRole[] = ["PARTNER_HOLIDAY", "OUR_HOLIDAY", "BOTH_HOLIDAY"];

// 공휴일 이름은 실제 데이터에 따라 어느 언어든 될 수 있으므로 언어 검사에서는 중립적인 값을 사용
const draftFor = (lang: "ko" | "ja", role: TemplateRole) => buildTemplateDraft(lang, role, "2026-11-03", "X");

describe("templateRole", () => {
  it("treats the recipient's holiday as the partner's", () => {
    expect(templateRole("ko", "jp")).toBe("PARTNER_HOLIDAY");
    expect(templateRole("ja", "kr")).toBe("PARTNER_HOLIDAY");
  });

  it("treats the writer's holiday as our own", () => {
    expect(templateRole("ko", "kr")).toBe("OUR_HOLIDAY");
    expect(templateRole("ja", "jp")).toBe("OUR_HOLIDAY");
  });

  it("handles shared holidays", () => {
    expect(templateRole("ko", "both")).toBe("BOTH_HOLIDAY");
    expect(templateRole("ja", "both")).toBe("BOTH_HOLIDAY");
  });
});

describe("Korean UI templates", () => {
  it.each(ROLES)("%s keeps Japanese mail and Korean translation separate", role => {
    const draft = draftFor("ko", role);
    expect(draft.subject + draft.body).not.toMatch(HANGUL);
    expect(draft.translationSubject + draft.translationBody).not.toMatch(KANA);
    expect(draft.body).toMatch(KANA);
    expect(draft.translationBody).toMatch(HANGUL);
  });
});

describe("Japanese UI templates", () => {
  it.each(ROLES)("%s keeps Korean mail and Japanese translation separate", role => {
    const draft = draftFor("ja", role);
    expect(draft.subject + draft.body).not.toMatch(KANA);
    expect(draft.translationSubject + draft.translationBody).not.toMatch(HANGUL);
    expect(draft.body).toMatch(HANGUL);
    expect(draft.translationBody).toMatch(KANA);
  });
});

describe("template content", () => {
  it.each(ROLES.flatMap(role => [["ko", role], ["ja", role]] as const))("%s %s includes the date in both subjects", (lang, role) => {
    const draft = draftFor(lang, role);
    expect(draft.subject).toContain("2026-11-03");
    expect(draft.translationSubject).toContain("2026-11-03");
  });

  it("uses Japanese punctuation in Japanese text", () => {
    for (const role of ROLES) {
      const japanese = [draftFor("ko", role).body, draftFor("ja", role).translationBody].join("\n");
      expect(japanese).not.toMatch(/[.,]\s/);
    }
  });

  it("inserts the holiday name", () => {
    expect(draftFor("ko", "PARTNER_HOLIDAY").body).toContain("（X）");
    expect(buildTemplateDraft("ja", "OUR_HOLIDAY", "2026-11-03", "文化の日").translationBody).toContain("文化の日");
  });
});
