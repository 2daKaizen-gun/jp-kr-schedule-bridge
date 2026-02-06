"use client"

import React, {useState} from 'react';

interface EventModalProps {
    date: string;
    onClose: () => void;
    onSave: (title: string, type: 'meeting' | 'holiday', country: 'KR' | 'JP' | 'Both') => void;
}

export default function EventModal({ date, onClose, onSave }: EventModalProps) {
    const [title, setTitle] = useState('');
    const [type, setType] = useState<'meeting' | 'holiday'>('meeting');
    const [country, setCountry] = useState<'KR' | 'JP' | 'Both'>('Both');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">새 일정 추가 ({date})</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                </div>

                <div className="space-y-5">
                    {/* 일정 제목 */}
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">일정 명칭</label>
                        <input 
                            type="text" 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="예: 프로젝트 미팅, 개인 연차 등"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    {/* 일정 종류 */}
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">일정 종류</label>
                        <div className="flex gap-2">
                            {['meeting', 'holiday'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setType(t as any)}
                                    className={`flex-1 p-3 rounded-xl font-bold transition-all ${
                                        type === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                                >
                                    {t === 'meeting' ? '회의/업무' : '개인 휴무'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 국가 설정 */}
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">영향 범위</label>
                        <select 
                            value={country} 
                            onChange={(e) => setCountry(e.target.value as any)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                        >
                            <option value="Both">양국 공통</option>
                            <option value="KR">한국 업무만</option>
                            <option value="JP">일본 업무만</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button onClick={onClose} className="flex-1 p-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200">취소</button>
                    <button 
                        onClick={() => title && onSave(title, type, country)}
                        className="flex-1 p-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200"
                    >
                        일정 저장
                    </button>
                </div>
            </div>
        </div>
    );
}