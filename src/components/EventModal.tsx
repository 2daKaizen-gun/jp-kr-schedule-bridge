"use client"

import React, { useEffect, useId, useRef, useState } from 'react';
import { translations } from '@/lib/translations';
import { MAX_AI_TEXT_LENGTH } from '@/lib/aiDraft';

type EventType = 'meeting' | 'holiday';
type EventScope = 'KR' | 'JP' | 'Both';

interface EventModalProps {
    date: string;
    lang: 'ko' | 'ja'; // 언어 프롭 추가
    onClose: () => void;
    onSave: (title: string, type: EventType, country: EventScope) => void;
}

export default function EventModal({ date, lang, onClose, onSave }: EventModalProps) {
    const [title, setTitle] = useState('');
    const [type, setType] = useState<EventType>('meeting');
    const [country, setCountry] = useState<EventScope>('Both');
    const dialogRef = useRef<HTMLDialogElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const headingId = useId();
    const nameId = useId();
    const typeId = useId();
    const scopeId = useId();

    const t = translations[lang].modal;

    const eventTypes: { id: EventType; label: string }[] = [
        { id: 'meeting', label: t.work },
        { id: 'holiday', label: t.personal }
    ];

    // showModal이 포커스 가두기, Esc 닫기, 배경 비활성화를 처리
    // showModal은 첫 번째 버튼으로 포커스를 옮기므로 이후에 입력칸으로 이동
    useEffect(() => {
        dialogRef.current?.showModal();
        nameInputRef.current?.focus();
    }, []);

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby={headingId}
            onCancel={onClose}
            className="m-auto bg-white w-[calc(100%-2rem)] max-w-md max-h-[calc(100dvh-2rem)] p-5 sm:p-8 rounded-3xl shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
        >
            <div className="flex justify-between items-center mb-6">
                {/* 제목 현지화 */}
                <h3 id={headingId} className="text-lg sm:text-xl font-bold text-gray-800">{t.title} ({date})</h3>
                <button type="button" aria-label={t.cancel} onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>

            <div className="space-y-5">
                {/* 일정 제목 */}
                <div>
                    <label htmlFor={nameId} className="block text-sm font-bold text-gray-600 mb-2">{t.name}</label>
                    <input
                        id={nameId}
                        ref={nameInputRef}
                        type="text"
                        maxLength={MAX_AI_TEXT_LENGTH}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                        placeholder={t.placeholder} // 플레이스홀더 현지화
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                {/* 일정 종류 */}
                <div>
                    <span id={typeId} className="block text-sm font-bold text-gray-600 mb-2">{t.type}</span>
                    <div role="group" aria-labelledby={typeId} className="flex gap-2">
                        {eventTypes.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                aria-pressed={type === item.id}
                                onClick={() => setType(item.id)}
                                className={`flex-1 p-3 rounded-xl font-bold transition-all ${
                                    type === item.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 국가 설정 */}
                <div>
                    <label htmlFor={scopeId} className="block text-sm font-bold text-gray-600 mb-2">{t.scope}</label>
                    <select
                        id={scopeId}
                        value={country}
                        onChange={(e) => setCountry(e.target.value as EventScope)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-700"
                    >
                        <option value="Both">{t.both}</option>
                        <option value="KR">{t.krOnly}</option>
                        <option value="JP">{t.jpOnly}</option>
                    </select>
                </div>
            </div>

            <div className="flex gap-3 mt-8">
                {/* 하단 버튼들 현지화 */}
                <button type="button" onClick={onClose} className="flex-1 p-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200">
                    {t.cancel}
                </button>
                <button
                    type="button"
                    onClick={() => title.trim() && onSave(title.trim(), type, country)}
                    className="flex-1 p-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200"
                >
                    {t.save}
                </button>
            </div>
        </dialog>
    );
}
