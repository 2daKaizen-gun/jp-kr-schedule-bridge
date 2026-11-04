import { describe, expect, it } from "vitest";
import { parseLang } from "./language";

describe("parseLang", () => {
  it("accepts supported languages", () => {
    expect(parseLang("ko")).toBe("ko");
    expect(parseLang("ja")).toBe("ja");
  });

  it("falls back on missing or unknown values", () => {
    expect(parseLang(null)).toBe("ko");
    expect(parseLang("en")).toBe("ko");
    expect(parseLang(null, "ja")).toBe("ja");
  });
});
