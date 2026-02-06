// google-ai.d.ts (프로젝트 루트 폴더에 위치)
declare module "@google/generative-ai" {
  export class GoogleGenerativeAI {
    constructor(apiKey: string);
    getGenerativeModel(modelParams: { model: string }): any;
  }
}