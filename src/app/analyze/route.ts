import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { holidays, userEvents, currentMonth, tone } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // 톤에 따른 일본 비즈니스 매너 가이드라인
    const toneSettings = {
      formal: "최대한 정중한 경어(Keigo). '항상 신세 지고 있습니다' 등의 상투적인 비즈니스 인사 필수.",
      urgent: "예의는 갖추되, '바쁘신 와중에 대단히 죄송하지만'과 같은 완충 표현을 쓰며 기한을 명시.",
      apology: "일정 충돌에 대해 깊은 사과와 함께 대안 날짜를 제시하는 낮은 자세의 말투."
    };

    const prompt = `
      너는 일본 IT 기업에서 근무하는 한국인 엔지니어 커뮤니케이션 전문가야. 
      아래 [데이터]를 바탕으로 일본 파트너사에게 보낼 '스마트 비즈니스 메일'을 작성해줘.

      [데이터]
      - 기준 월: ${currentMonth}
      - 한국/일본 공휴일 정보: ${JSON.stringify(holidays)}
      - 나의 개인 일정(휴무 등): ${JSON.stringify(userEvents)}
      - 요청 톤: ${toneSettings[tone as keyof typeof toneSettings]}

      [작성 가이드라인]
      1. **상황 인지**: 데이터상 일본이 쉬는 날이나 내가 쉬는 날을 언급하며, "해당 기간은 업무가 어려우니 ~날에 진행하자"는 식의 구체적 제안을 포함할 것.
      2. **구성**: 제목(件名), 서두 인사, 본문, 맺음말 순서의 완벽한 일본어 비즈니스 메일 형식을 갖출 것.
      3. **번역**: 일본어 원문 아래에 한국어 번역본을 반드시 포함할 것.
      4. **출력**: 다른 설명 없이 메일 내용만 출력해줘.
    `;

    const result = await model.generateContent(prompt);
    return NextResponse.json({ text: result.response.text() });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ error: "이메일 생성 중 오류 발생" }, { status: 500 });
  }
}