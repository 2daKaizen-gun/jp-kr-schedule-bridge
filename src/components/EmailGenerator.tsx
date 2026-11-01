"use client";

import React, { useState } from 'react';
import { translations } from '@/lib/translations';

interface EmailGeneratorProps {
  data: {
    title: string;
    subject: string;
    body: string;
  } | null;
  lang: 'ko' | 'ja'; // 언어 프롭
  onAiGenerate?: (tone: string) => void;
  onReset?:() => void;
  aiDraft?: string;
  aiSubject?: string | null;
  aiError?: 'rate_limited' | 'failed' | null;
  isAiLoading?: boolean;
  activeMode?: string;
  currentTone?: string;
}

export default function EmailGenerator({ 
  data, 
  lang,
  onAiGenerate,
  onReset, 
  aiDraft,
  aiSubject,
  aiError,
  isAiLoading,
  activeMode,
  currentTone
}: EmailGeneratorProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'subject' | 'body'>('idle');

  // 현재 언어에 맞는 번역 데이터 가져오기
  const t = translations[lang].email;

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
      <div className="bg-white rounded-3xl p-10 border-2 border-dashed border-blue-100 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">📅</span>
        </div>
        
        <h4 className="text-xl font-black text-gray-800 mb-2">{t.onboardingTitle}</h4>
        <p className="text-gray-500 text-sm mb-8">{t.onboardingSub}</p>

        {/* 가이드 스텝 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-lg">
          {[
            { step: "01", text: t.step01 },
            { step: "02", text: t.step02 },
            { step: "03", text: t.step03 }
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full mb-2">STEP {item.step}</div>
              <p className="text-xs font-bold text-gray-700">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // AI 답변용 제목 맵을 다국어로 확장
  const subjectMap: Record<string, Record<string, string>> = {
    ko: {
      formal: "[정중] 비즈니스 커뮤니케이션 초안",
      urgent: "[긴급] 업무 협조 및 일정 확인 요청",
      apology: "[사과] 일정 변경 및 조율 안내",
      default: "AI 생성 메일 초안"
    },
    ja: {
      formal: "[丁寧] ビジネスコミュニケーション下書き",
      urgent: "[至急] 業務協力および日程確認の依頼",
      apology: "[お詫び] 日程変更および調整のご案内",
      default: "AI生成メールの下書き"
    }
  };
  
  const displaySubject = aiDraft 
    ? (aiSubject || subjectMap[lang][currentTone || ""] || subjectMap[lang].default)
    : data?.subject;
  
  const displayBody = aiDraft || data?.body;

  return (
    <div className="bg-white rounded-3xl p-8 border border-blue-100 shadow-2xl shadow-blue-500/10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h4 className="text-2xl font-black text-gray-800 tracking-tight">Email Draft</h4>
          <p className="text-blue-500 text-sm font-bold uppercase mt-1 tracking-widest">
            {aiDraft ? "AI Powered Draft" : data?.title}
          </p>
        </div>
        
        {/* AI 상황별 생성 버튼들 */}
        <div className="flex gap-2">
          <button
            onClick={onReset}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all border-2 ${
              aiDraft
                ? 'bg-white border-blue-600 text-blue-600 hover:bg-blue-50 active:scale-95'
                : 'bg-gray-100 border-gray-200 text-gray-600 cursor-default'
            }`}
          >
            {t.basic}
          </button>
          {[
            { id: 'formal', label: t.formal, color: 'bg-indigo-600' },
            { id: 'urgent', label: t.urgent, color: 'bg-amber-600' },
            { id: 'apology', label: t.apology, color: 'bg-rose-600' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => onAiGenerate?.(btn.id)}
              disabled={isAiLoading}
              className={`${btn.color} px-3 py-2 rounded-xl text-white text-xs font-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-1.5`}
            >
              {isAiLoading && activeMode === btn.id ? "..." : btn.label}
            </button>
          ))}
        </div>
      </div>

      {aiError && (
        <p role="alert" className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-sm font-bold text-red-700">
          {aiError === 'rate_limited' ? t.aiRateLimited : t.aiFailed}
        </p>
      )}

      <div className="space-y-6">
        {/* Subject Line */}
        <div className="group relative">
          <label htmlFor="email-subject" className="text-[10px] font-black text-gray-500 mb-1.5 block uppercase tracking-tighter">Email Subject</label>
          <div className="relative flex items-center">
            <input
              id="email-subject"
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
              {copyStatus === 'subject' ? t.copied : t.copy}
            </button>
          </div>
        </div>

        {/* Message Body */}
        <div className="relative">
          <label htmlFor="email-body" className="text-[10px] font-black text-gray-500 mb-1.5 block uppercase tracking-tighter">Message Body</label>
          <textarea
            id="email-body"
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
            {copyStatus === 'body' ? t.fullCopied : t.copyFull}
          </button>
        </div>
      </div>
    </div>
  );
}