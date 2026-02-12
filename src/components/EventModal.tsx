"use client"

import React, {useState} from 'react';
import { translations } from '@/lib/translations';

interface EventModalProps {
    date: string;
    lang: 'ko' | 'ja'; // 언어 프롭 추가
    onClose: () => void;
    onSave: (title: string, type: 'meeting' | 'holiday', country: 'KR' | 'JP' | 'Both') => void;
}

export default function EventModal({ date, lang, onClose, onSave }: EventModalProps) {
    const [title, setTitle] = useState('');
    const [type, setType] = useState<'meeting' | 'holiday'>('meeting');
    const [country, setCountry] = useState<'KR' | 'JP' | 'Both'>('Both');

    const t = translations[lang].modal;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    {/* 제목 현지화 */}
                    <h3 className="text-xl font-bold text-gray-800">{t.title} ({date})</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                </div>

                <div className="space-y-5">
                    {/* 일정 제목 */}
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">{t.name}</label>
                        <input 
                            type="text" 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                            placeholder={t.placeholder} // 플레이스홀더 현지화
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    {/* 일정 종류 */}
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">{t.type}</label>
                        <div className="flex gap-2">
                            {[
                                { id: 'meeting', label: t.work },
                                { id: 'holiday', label: t.personal }
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setType(item.id as any)}
                                    className={`flex-1 p-3 rounded-xl font-bold transition-all ${
                                        type === item.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 국가 설정 */}
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">{t.scope}</label>
                        <select 
                            value={country} 
                            onChange={(e) => setCountry(e.target.value as any)}
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
                    <button onClick={onClose} className="flex-1 p-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200">
                        {t.cancel}
                    </button>
                    <button 
                        onClick={() => title && onSave(title, type, country)}
                        className="flex-1 p-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200"
                    >
                        {t.save}
                    </button>
                </div>
            </div>
        </div>
    );
}