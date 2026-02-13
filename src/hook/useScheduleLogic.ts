import { useState, useMemo, useEffect } from 'react';
import { isSameMonth, format, addMonths, subMonths } from 'date-fns';
import { getVacationBlocks, getRecommendedMeetingDays, analyzeBusinessDay } from '@/lib/holidays';
import { Holiday, UserEvent, Lang, ConflictMarkers, RecommendedDay } from '@/types/holiday';

export function useScheduleLogic(
    jpHolidays: Holiday[],
    krHolidays: Holiday[],
    initialTimestamp: number,
    lang: Lang
) {
    const [viewMonth, setViewMonth] = useState<Date>(new Date(initialTimestamp));
    const [userEvents, setUserEvents] = useState<UserEvent[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // [추가] 훅 내부에서 관리해야 할 UI 상태들
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeDate, setActiveDate] = useState<string | null>(null);

    // 초기 데이터 로드
    useEffect(() => {
    const saved = localStorage.getItem('user_events');
        if (saved) {
            setUserEvents(JSON.parse(saved));
        }
        setIsLoaded(true);
    }, []);

    // 데이터 바뀔 때마다 로컬 스토리지 저장
    useEffect (() =>  {
        if (isLoaded) {
            localStorage.setItem('user_events', JSON.stringify(userEvents));
        }
    }, [userEvents, isLoaded]);

    // 내비게이션 함수들
    const goPrev = () => setViewMonth(prev => subMonths(prev, 1));
    const goNext = () => setViewMonth(prev => addMonths(prev, 1));
    const goToday = () => setViewMonth(new Date());

    // 날짜 클릭 시 모달 오픈 로직
    const openEventModal = (date: string) => {
        setActiveDate(date);
        setIsModalOpen(true);
    };

    const closeEventModal = () => {
        setIsModalOpen(false);
        setActiveDate(null);
    };

    // --- 비즈니스 로직 계산 섹션 (viewMonth에 반응함) ---
    const conflictMarkers = useMemo<ConflictMarkers>(() => {
        const markers: ConflictMarkers = {};
        const EXCLUDED = ["노동절", "어버이날", "스승의날", "제헌절", "국군의날"];
        // 공휴일 필터링 함수
        const isTrue = (h: Holiday) => !EXCLUDED.includes(h.localName);
        
        const trueKr = krHolidays.filter(isTrue);
        const trueJp = jpHolidays.filter(isTrue);
        
        // 양국 날짜 합치기
        const allDates = new Set([...trueKr.map(h => h.date), ...trueJp.map(h => h.date)]);
        
        allDates.forEach(date => {
            const isKr = trueKr.some(h => h.date === date);
            const isJp = trueJp.some(h => h.date === date);
            if (isKr && isJp) markers[date] = { type: 'both' };
            else if (isKr) markers[date] = { type: 'kr' };
            else if (isJp) markers[date] = { type: 'jp' };
        });
        return markers;
    }, [jpHolidays, krHolidays]);

    // 일정 추가 함수
    const addUserEvent = (title: string, type: string, country: 'KR' | 'JP' | 'Both') => {
        if (!activeDate) return;

        const newEvent: UserEvent = {
            id: `${activeDate}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            date: activeDate,
            title,
            type: type as any,
            countryCode: country
        };
        setUserEvents(prev => [...prev, newEvent]);
        closeEventModal(); // 모달 닫기 함수 사용
    };

    // 일정 삭제 함수
    const deleteUserEvent = (id: string) => {
        const confirmMsg = lang === 'ko' ? "일정을 삭제하시겠습니까?" : "予定を削除しますか？";
        if (window.confirm(confirmMsg)) {
            setUserEvents((prev) => prev.filter((event) => String(event.id) !== String(id)));
        }
    };

    // 추천 일정 및 어드바이스 계산
    // 현재 달 기준 추천 일정 및 조언
    const recommendedDays = useMemo<RecommendedDay[]>(() => {
      // 사용자가 추가한 모든 일정을 '차단된 날짜'로 변환
      // 'holiday'뿐만 아니라 'meeting'도 추천에서 제외되도록 type 체크를 제거하거나 조정
      const userHolidays = userEvents.map(e => ({
        date: e.date,
        localName: e.title,
        countryCode: e.countryCode,
        isUserDefined: true // 사용자 정의 데이터 표시(debugging)
      }));
    
      // 기존 공휴일 데이터에 사용자 휴무일을 병합하여 계산
      // 한국 달력에 영향을 주는 것: KR 전용 + Both(공통)
      const combinedKr = [
        ...krHolidays,
        ...userHolidays.filter(e => e.countryCode === 'KR' || e.countryCode === 'Both')
      ];
      // 일본 달력에 영향을 주는 것: JP 전용 + Both(공통)
      const combinedJp = [
        ...jpHolidays,
        ...userHolidays.filter(e => e.countryCode === 'JP' || e.countryCode === 'Both')
      ];
    
      return getRecommendedMeetingDays(combinedKr as Holiday[], combinedJp as Holiday[], lang)
        .filter(d => isSameMonth(new Date(d.date), viewMonth));
    }, [krHolidays, jpHolidays, userEvents, viewMonth, lang]);

    // 비즈니스 어드바이스
    const advice = useMemo(() => {
        return analyzeBusinessDay(format(new Date(), "yyyy-MM-dd"), krHolidays, jpHolidays, lang);
    }, [krHolidays, jpHolidays, lang]);

    return {
        viewMonth, setViewMonth,
        goPrev, goNext, goToday,
        userEvents, setUserEvents,
        isLoaded,
        activeDate,
        isModalOpen, setIsModalOpen,
        openEventModal, closeEventModal,
        conflictMarkers,
        addUserEvent, deleteUserEvent,
        recommendedDays,
        advice,
        // 연휴 블록 데이터도 훅에서 제공
        jpVacations: getVacationBlocks(jpHolidays).filter(v => isSameMonth(new Date(v.start), viewMonth)),
        krVacations: getVacationBlocks(krHolidays).filter(v => isSameMonth(new Date(v.start), viewMonth)),
    };
}