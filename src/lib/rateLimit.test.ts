import { describe, expect, it } from "vitest";
import { createRateLimiter, getClientKey } from "./rateLimit";

describe("createRateLimiter", () => {
  const setup = (limit = 2, windowMs = 60_000) => {
    let time = 0;
    return {
      check: createRateLimiter(limit, windowMs, () => time),
      advance: (ms: number) => { time += ms; },
    };
  };

  it("allows requests up to the limit and then reports the wait", () => {
    const { check, advance } = setup();
    expect(check("a")).toBeNull();
    expect(check("a")).toBeNull();
    advance(15_000);
    expect(check("a")).toBe(45);
  });

  it("tracks each key separately", () => {
    const { check } = setup(1);
    expect(check("a")).toBeNull();
    expect(check("b")).toBeNull();
    expect(check("a")).not.toBeNull();
  });

  it("allows requests again after the window ends", () => {
    const { check, advance } = setup(1);
    check("a");
    advance(60_000);
    expect(check("a")).toBeNull();
  });

  it("keeps working when many keys are tracked", () => {
    const { check } = setup(1);
    for (let i = 0; i < 1500; i++) check(`client-${i}`);
    expect(check("client-1499")).not.toBeNull();
    expect(check("new-client")).toBeNull();
  });
});

describe("getClientKey", () => {
  it("uses the first forwarded address", () => {
    expect(getClientKey(new Headers({ "x-forwarded-for": "1.1.1.1, 2.2.2.2" }))).toBe("1.1.1.1");
  });

  it("falls back to x-real-ip and then a shared key", () => {
    expect(getClientKey(new Headers({ "x-real-ip": "3.3.3.3" }))).toBe("3.3.3.3");
    expect(getClientKey(new Headers())).toBe("unknown");
  });
});
