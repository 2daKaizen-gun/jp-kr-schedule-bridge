// 브라우저 테스트용 Google Calendar API 대역. 2026년 공휴일 일부를 고정 값으로 돌려줌
import http from "node:http";

const PORT = Number(process.env.FIXTURE_PORT ?? 4010);

const kr = (date, summary, isPublic = true) => ({ date, summary, description: isPublic ? "공휴일" : "기념일\n기념일을 숨기려면 Google Calendar 설정에서 변경하세요." });
const jp = (date, summary, isPublic = true) => ({ date, summary, description: isPublic ? "祝日" : "祭日\n祭日を非表示にするには、Google カレンダーの設定を変更してください。" });

const HOLIDAYS = {
  KR: [
    kr("2026-01-01", "새해첫날"),
    kr("2026-05-05", "어린이날"),
    kr("2026-05-15", "스승의날", false),
    kr("2026-09-24", "추석 연휴"),
    kr("2026-09-25", "추석"),
    kr("2026-09-26", "추석 연휴"),
    kr("2026-10-09", "한글날"),
    kr("2026-12-25", "크리스마스"),
  ],
  JP: [
    jp("2026-01-01", "元日"),
    jp("2026-05-05", "こどもの日"),
    jp("2026-09-21", "敬老の日"),
    jp("2026-09-22", "国民の休日"),
    jp("2026-09-23", "秋分の日"),
    jp("2026-11-03", "文化の日"),
    jp("2026-11-15", "七五三", false),
    jp("2026-11-23", "勤労感謝の日"),
  ],
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname === "/health") {
    res.writeHead(200).end("ok");
    return;
  }

  const match = url.pathname.match(/^\/calendar\/v3\/calendars\/([^/]+)\/events$/);
  if (!match) {
    res.writeHead(404).end();
    return;
  }

  const country = decodeURIComponent(match[1]).includes("south_korea") ? "KR" : "JP";
  const year = (url.searchParams.get("timeMin") ?? "").slice(0, 4);
  const items = HOLIDAYS[country]
    .filter(h => h.date.startsWith(year))
    .map(h => ({ summary: h.summary, description: h.description, start: { date: h.date } }));

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ items }));
});

server.listen(PORT, () => console.log(`Holiday fixture server on ${PORT}`));
