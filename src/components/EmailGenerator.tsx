"use client";

import { useState } from 'react';
import { translations } from '@/lib/translations';
import { Lang } from '@/types/holiday';
import type { AiDraft } from '@/lib/aiDraft';

interface EmailGeneratorProps {
  data: {
    title: string;
    subject: string;
    body: string;
  } | null;
  lang: Lang;
  onAiGenerate: (tone: string) => void;
  onReset: () => void;
  onAddEvent: () => void;
  aiDraft: AiDraft | null;
  aiError: 'rate_limited' | 'unavailable' | 'failed' | null;
  activeTone: string; // 생성 중인 톤 (비어 있으면 대기 상태)
}

interface DraftPanelProps {
  id: string;
  heading?: string;
  subject: string;
  body: string;
  rows: number;
  labels: { subject: string; body: string; copy: string; copied: string; copyFull: string; fullCopied: string };
  copyStatus: string;
  onCopy: (text: string, type: string) => void;
}

// 제목과 본문을 복사 버튼과 함께 보여주는 영역
function DraftPanel({ id, heading, subject, body, rows, labels, copyStatus, onCopy }: DraftPanelProps) {
  const subjectKey = `${id}-subject`;
  const bodyKey = `${id}-body`;

  return (
    <div className="min-w-0 space-y-6">
      {heading && <h5 className="text-sm font-black text-gray-800">{heading}</h5>}
      <div>
        <label htmlFor={subjectKey} className="text-[10px] font-black text-gray-500 mb-1.5 block uppercase tracking-tighter">{labels.subject}</label>
        <div className="relative flex items-center">
          <input
            id={subjectKey}
            readOnly
            value={subject}
            className="w-full bg-gray-50 border border-gray-100 p-4 pr-24 rounded-2xl text-sm font-bold text-gray-700 outline-none"
          />
          <button
            onClick={() => onCopy(subject, subjectKey)}
            className={`absolute right-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              copyStatus === subjectKey ? 'bg-green-700 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {copyStatus === subjectKey ? labels.copied : labels.copy}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor={bodyKey} className="text-[10px] font-black text-gray-500 mb-1.5 block uppercase tracking-tighter">{labels.body}</label>
        <textarea
          id={bodyKey}
          readOnly
          rows={rows}
          value={body}
          className="w-full bg-gray-50 border border-gray-100 p-5 rounded-2xl text-sm leading-relaxed text-gray-600 font-medium resize-none outline-none"
        />
        <button
          onClick={() => onCopy(body, bodyKey)}
          className={`w-full mt-4 flex items-center justify-center gap-2 py-4 rounded-2xl font-black transition-all ${
            copyStatus === bodyKey ? 'bg-green-700 text-white' : 'bg-gray-900 text-white hover:bg-black'
          }`}
        >
          {copyStatus === bodyKey ? labels.fullCopied : labels.copyFull}
        </button>
      </div>
    </div>
  );
}

export default function EmailGenerator({
  data,
  lang,
  onAiGenerate,
  onReset,
  onAddEvent,
  aiDraft,
  aiError,
  activeTone
}: EmailGeneratorProps) {
  const [copyStatus, setCopyStatus] = useState<string>('idle');

  // 현재 언어에 맞는 번역 데이터 가져오기
  const t = translations[lang].email;

  // 클립보드 복사 함수
  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(type);
      setTimeout(() => setCopyStatus('idle'), 2000); // 2초 후 상태 초기화
    } catch (err) {
      console.error('복사 실패:', err);
      setCopyStatus('failed');
    }
  };

  if (!data && !aiDraft) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-dashed border-blue-100 flex flex-col items-center justify-center text-center">
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
              <div className="text-[10px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full mb-2">{t.step} {item.step}</div>
              <p className="text-xs font-bold text-gray-700">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const panelLabels = {
    subject: t.subjectLabel,
    body: t.bodyLabel,
    copy: t.copy,
    copied: t.copied,
    copyFull: t.copyFull,
    fullCopied: t.fullCopied,
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-8 border border-blue-100 shadow-2xl shadow-blue-500/10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h4 className="text-2xl font-black text-gray-800 tracking-tight">{t.draftTitle}</h4>
          <p className="text-blue-700 text-sm font-bold uppercase mt-1 tracking-widest">
            {aiDraft ? t.aiDraftLabel : data?.title}
          </p>
        </div>
        
        {/* AI 상황별 생성 버튼들 */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onReset}
            disabled={!aiDraft}
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
            { id: 'urgent', label: t.urgent, color: 'bg-amber-700' },
            { id: 'apology', label: t.apology, color: 'bg-rose-600' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => onAiGenerate(btn.id)}
              disabled={activeTone !== ""}
              className={`${btn.color} px-3 py-2 rounded-xl text-white text-xs font-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-1.5`}
            >
              {activeTone === btn.id ? "..." : btn.label}
            </button>
          ))}
        </div>
      </div>

      {data && (
        <button
          type="button"
          onClick={onAddEvent}
          className="mb-6 px-3 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
        >
          + {t.addEvent}
        </button>
      )}

      {copyStatus === 'failed' && (
        <p role="alert" className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-sm font-bold text-red-700">
          {t.copyFailed}
        </p>
      )}

      {aiError && (
        <p role="alert" className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-sm font-bold text-red-700">
          {aiError === 'rate_limited' ? t.aiRateLimited : aiError === 'unavailable' ? t.aiUnavailable : t.aiFailed}
        </p>
      )}

      {aiDraft ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <DraftPanel
            id="email"
            heading={t.mailPanel}
            subject={aiDraft.subject}
            body={aiDraft.body}
            rows={16}
            labels={panelLabels}
            copyStatus={copyStatus}
            onCopy={handleCopy}
          />
          <DraftPanel
            id="translation"
            heading={t.translationPanel}
            subject={aiDraft.translationSubject}
            body={aiDraft.translationBody}
            rows={16}
            labels={panelLabels}
            copyStatus={copyStatus}
            onCopy={handleCopy}
          />
        </div>
      ) : (
        <DraftPanel
          id="email"
          subject={data?.subject ?? ""}
          body={data?.body ?? ""}
          rows={10}
          labels={panelLabels}
          copyStatus={copyStatus}
          onCopy={handleCopy}
        />
      )}
    </div>
  );
}
