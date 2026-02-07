"use client";

import React, { useState } from 'react';

interface EmailGeneratorProps {
  data: {
    title: string;
    subject: string;
    body: string;
  } | null;
  onAiGenerate?: (mode: string, tone: string) => void;
  onReset?:() => void;
  aiDraft?: string;
  isAiLoading?: boolean;
  activeMode?: string;
}

export default function EmailGenerator({ 
  data, 
  onAiGenerate,
  onReset, 
  aiDraft, 
  isAiLoading, 
  activeMode 
}: EmailGeneratorProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'subject' | 'body'>('idle');

  // 클립보드 복사 함수
  const handleCopy = async (text: string, type: 'subject' | 'body') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(type);
      setTimeout(() => setCopyStatus('idle'), 2000); // 2초 후 상태 초기화
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  if (!data && !aiDraft) {
  return (
    <div className="bg-white rounded-3xl p-10 border-2 border-dashed border-blue-100 flex flex-col items-center justify-center text-center animate-in fade-in duration-700">
      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
        <span className="text-4xl">📅</span>
      </div>
      
      <h4 className="text-xl font-black text-gray-800 mb-2">스마트 메일 작성을 시작해 보세요!</h4>
      <p className="text-gray-400 text-sm mb-8">한·일 협업을 위한 메일 초안을 만듭니다.</p>

      {/* 가이드 스텝 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-lg">
        {[
          { step: "01", text: "달력에서 일정을 클릭하세요." },
          { step: "02", text: "원하는 메일 톤을 선택하세요." },
          { step: "03", text: "생성된 문구를 복사해 사용하세요." }
        ].map((item, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <div className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full mb-2">STEP {item.step}</div>
            <p className="text-xs font-bold text-gray-600">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

  // AI 답변이 오면 전체를 '제목 + 본문'으로 나눌 수 없으므로, 
  // 편의상 AI 답변 전체를 Body에 몰아넣거나 혹은 AI 답변 형식을 따름
  const subjectMap: Record<string, string> = {
    formal: "[정중 AI] 비즈니스 커뮤니케이션 초안",
    urgent: "[긴급 AI] 업무 협조 및 일정 확인 요청",
    apology: "[사과 AI] 일정 변경 및 조율 안내",
  };
  
  // aiDraft가 있을 때 activeMode에 따라 제목을 매핑하고, 없으면 기본 템플릿 제목 사용
  const displaySubject = aiDraft 
    ? (subjectMap[activeMode || ""] || "AI 생성 메일 초안")
    : data?. subject;
  
    const displayBody = aiDraft || data?.body;

  return (
    <div className="bg-white rounded-3xl p-8 border border-blue-100 shadow-2xl shadow-blue-500/10 animate-in fade-in slide-in-from-bottom-5 duration-500">
      {/* Header: 기존 디자인 유지 + AI 버튼 추가 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h4 className="text-2xl font-black text-gray-800 tracking-tight">Email Draft</h4>
          <p className="text-blue-500 text-sm font-bold uppercase mt-1 tracking-widest">
            {aiDraft ? "AI Powered Draft" : data?.title}
          </p>
        </div>
        
        {/* AI 상황별 생성 버튼들 */}
        <div className="flex flex gap-2">
          <button
            onClick={onReset}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all border-2 ${
              aiDraft
                ? 'bg-white border-blue-600 text-blue-600 hover:bg-blue-50 active:scale-95'
                : 'bg-gray-100 border-gray-200 text-gray-400 cursor-default opacity-50'
            }`}
          >
            기본
          </button>
          {[
            { id: 'formal', label: '정중', color: 'bg-indigo-600' },
            { id: 'urgent', label: '긴급', color: 'bg-amber-600' },
            { id: 'apology', label: '사과', color: 'bg-rose-600' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => onAiGenerate?.("email", btn.id)}
              disabled={isAiLoading}
              className={`${btn.color} px-3 py-2 rounded-xl text-white text-xs font-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-1.5`}
            >
              {isAiLoading && activeMode === btn.id ? "..." : btn.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {/* Subject Line */}
        <div className="group relative">
          <label className="text-[10px] font-black text-gray-400 mb-1.5 block uppercase tracking-tighter">Email Subject</label>
          <div className="relative flex items-center">
            <input 
              readOnly 
              value={displaySubject} 
              className="w-full bg-gray-50 border border-gray-100 p-4 pr-24 rounded-2xl text-sm font-bold text-gray-700 outline-none"
            />
            <button 
              onClick={() => handleCopy(displaySubject || "", 'subject')}
              className={`absolute right-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                copyStatus === 'subject' ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {copyStatus === 'subject' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Message Body */}
        <div className="relative">
          <label className="text-[10px] font-black text-gray-400 mb-1.5 block uppercase tracking-tighter">Message Body</label>
          <textarea 
            readOnly 
            rows={10} 
            value={displayBody} 
            className="w-full bg-gray-50 border border-gray-100 p-5 rounded-2xl text-sm leading-relaxed text-gray-600 font-medium resize-none outline-none" 
          />
          <button 
            onClick={() => handleCopy(displayBody || "", 'body')}
            className={`w-full mt-4 flex items-center justify-center gap-2 py-4 rounded-2xl font-black transition-all ${
              copyStatus === 'body' ? 'bg-green-500 text-white' : 'bg-gray-900 text-white hover:bg-black'
            }`}
          >
            {copyStatus === 'body' ? 'Full Message Copied!' : 'Copy Full Message'}
          </button>
        </div>
      </div>
    </div>
  );
}