import { describe, expect, it } from "vitest";
import { parseUserEvents } from "./userEvents";

const event = { id: "1", date: "2026-11-10", title: "미팅", type: "meeting", countryCode: "Both" };

describe("parseUserEvents", () => {
  it("returns saved events", () => {
    expect(parseUserEvents(JSON.stringify([event]))).toEqual([event]);
  });

  it("returns an empty list when nothing is saved", () => {
    expect(parseUserEvents(null)).toEqual([]);
  });

  it("does not throw on corrupted data", () => {
    expect(parseUserEvents("{not json")).toEqual([]);
  });

  it("ignores values of the wrong shape", () => {
    expect(parseUserEvents('{"id":"1"}')).toEqual([]);
    expect(parseUserEvents(JSON.stringify([event, { id: 1 }, null]))).toEqual([event]);
  });

  it("keeps events saved by earlier versions", () => {
    const saved = JSON.stringify([{ id: 1700000000000, date: "2026-11-10", title: "미팅", type: "personal" }]);
    expect(parseUserEvents(saved)).toEqual([
      { id: "1700000000000", date: "2026-11-10", title: "미팅", type: "meeting", countryCode: "Both" },
    ]);
  });
});
