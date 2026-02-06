import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// API 키 불러옴
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { holidays, userEvents, currentMonth } = await req.json();

    // 모델 설정
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 한·일 비즈니스 전문가 프롬프트 설계
    const prompt = `
      너는 한국과 일본의 IT 비즈니스 협업을 최적화하는 '스마트 스케줄 전략가'야.
      ${currentMonth}의 한·일 공휴일 데이터와 사용자의 개인 일정을 분석해서 
      비즈니스 효율을 극대화할 수 있는 전략 브리핑을 작성해줘.

      [제공된 데이터]
      - 한국 공휴일: ${JSON.stringify(holidays.kr)}
      - 일본 공휴일: ${JSON.stringify(holidays.jp)}
      - 사용자 개인 일정(User Events): ${JSON.stringify(userEvents)}

      [작성 가이드라인]
      1. **Communication Gap**: 양국의 휴일 차이로 인해 업무 회신이 늦어질 수 있는 위험 날짜를 경고해줘.
      2. **Golden Work Week**: 사용자의 휴무와 공휴일을 피해서 업무 집중도가 가장 높을 것으로 예상되는 주간을 추천해줘.
      3. **Japan Business Tip**: 일본 파트너사와 협업할 때 이 달의 일정과 관련하여 유의해야 할 일본 특유의 비즈니스 매너나 문화적 팁을 하나 알려줘.

      답변은 3~4개의 핵심 포인트로 나누어, 신뢰감 있고 친절한 한국어로 작성해줘.
    `;

    // AI 응답 생성
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: "AI 분석 중 오류가 발생했습니다. API 키나 데이터를 확인해주세요." },
      { status: 500 }
    );
  }
}