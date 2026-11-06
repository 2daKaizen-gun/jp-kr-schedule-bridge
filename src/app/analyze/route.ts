import { GoogleGenerativeAI, GoogleGenerativeAIAbortError, GoogleGenerativeAIFetchError, ResponseSchema, SchemaType } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { AiDraft, AiErrorCode, buildDraftPrompt, parseAiDraft, parseAnalyzeRequest, tryModels } from "@/lib/aiDraft";
import { createRateLimiter, getClientKey } from "@/lib/rateLimit";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Gemini 할당량 보호: 클라이언트별 분당 10회, 서버 인스턴스 전체 분당 60회
const checkClientLimit = createRateLimiter(10, 60_000);
const checkInstanceLimit = createRateLimiter(60, 60_000);

// 앞 모델이 과부하이거나 응답하지 않으면 다음 모델을 사용
const MODELS = ["gemini-flash-latest", "gemini-3.5-flash", "gemini-flash-lite-latest"];
const MODEL_TIMEOUT_MS = 25_000;

// 모든 모델이 제한 시간까지 응답하지 않아도 오류를 돌려줄 수 있는 실행 시간
export const maxDuration = 80;

// 메일과 번역이 섞이지 않도록 필드를 나눠서 받음
const DRAFT_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    subject: { type: SchemaType.STRING },
    body: { type: SchemaType.STRING },
    translationSubject: { type: SchemaType.STRING },
    translationBody: { type: SchemaType.STRING },
  },
  required: ["subject", "body", "translationSubject", "translationBody"],
};

class InvalidDraftError extends Error {}

const isRateLimited = (error: unknown) =>
  error instanceof GoogleGenerativeAIFetchError && error.status === 429;

const isUnavailable = (error: unknown) =>
  error instanceof GoogleGenerativeAIAbortError ||
  (error instanceof GoogleGenerativeAIFetchError && error.status === 503);

const isTemporary = (error: unknown) =>
  isRateLimited(error) || isUnavailable(error) || error instanceof InvalidDraftError;

const errorResponse = (code: AiErrorCode, status: number, headers?: HeadersInit) =>
  NextResponse.json({ error: code }, { status, headers });

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("invalid_request", 400);
  }

  const input = parseAnalyzeRequest(body);
  if (!input) return errorResponse("invalid_request", 400);

  // Gemini를 호출하는 유효한 요청만 횟수에 포함
  const retryAfter = checkClientLimit(getClientKey(req.headers)) ?? checkInstanceLimit("all");
  if (retryAfter !== null) {
    return errorResponse("rate_limited", 429, { "Retry-After": String(retryAfter) });
  }

  try {
    const prompt = buildDraftPrompt(input);

    const draft: AiDraft = await tryModels(
      MODELS,
      async model => {
        const generator = genAI.getGenerativeModel(
          { model, generationConfig: { responseMimeType: "application/json", responseSchema: DRAFT_SCHEMA } },
          { timeout: MODEL_TIMEOUT_MS }
        );
        const result = await generator.generateContent(prompt);
        const parsed = parseAiDraft(result.response.text());
        if (!parsed) throw new InvalidDraftError(`Invalid draft from ${model}`);
        return parsed;
      },
      isTemporary
    );
    return NextResponse.json(draft);
  } catch (error) {
    console.error("Gemini Error:", error);
    if (isRateLimited(error)) {
      return errorResponse("rate_limited", 429);
    }
    if (isUnavailable(error)) {
      return errorResponse("unavailable", 503);
    }
    return errorResponse("failed", 500);
  }
}
