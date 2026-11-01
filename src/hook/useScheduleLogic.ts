import { useState, useMemo, useEffect, useSyncExternalStore } from 'react';
import { isSameMonth, format, addMonths, subMonths, parseISO, startOfMonth } from 'date-fns';
import { getVacationBlocks, getRecommendedMeetingDays, analyzeBusinessDay } from '@/lib/holidays';
import { Holiday, UserEvent, Lang, ConflictMarkers, RecommendedDay } from '@/types/holiday';

// 서버 렌더링과 하이드레이션 중에는 null, 그 이후에는 브라우저 기준 오늘 날짜를 반환
const subscribeToNothing = () => () => {};
const getToday = () => format(new Date(), 'yyyy-MM-dd');
const getServerToday = () => null;

export function useScheduleLogic(
    jpHolidays: Holiday[],
    krHolidays: Holiday[],
    initialMonth: string,
    lang: Lang
) {
    const today = useSyncExternalStore(subscribeToNothing, getToday, getServerToday);

    // 사용자가 이동하기 전에는 오늘이 속한 달을 표시
    const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
    const viewMonth = selectedMonth ?? startOfMonth(parseISO(today ?? initialMonth));
    const [userEvents, setUserEvents] = useState<UserEvent[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // 훅 내부에서 관리해야 할 UI 상태들
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
    const goPrev = () => setSelectedMonth(subMonths(viewMonth, 1));
    const goNext = () => setSelectedMonth(addMonths(viewMonth, 1));
    const goToday = () => setSelectedMonth(null);

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
        const trueKr = krHolidays.filter(h => h.isPublicHoliday);
        const trueJp = jpHolidays.filter(h => h.isPublicHoliday);
        
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
    // 오늘 기준 향후 2주 (보고 있는 달과 무관)
    const recommendedDays = useMemo<RecommendedDay[]>(() => {
      if (!today) return [];

      // 사용자가 추가한 모든 일정을 '차단된 날짜'로 변환
      // 'holiday'뿐만 아니라 'meeting'도 추천에서 제외되도록 type 체크를 제거하거나 조정
      const userHolidays = userEvents.map(e => ({
        date: e.date,
        countryCode: e.countryCode,
        isPublicHoliday: true // 제목과 무관하게 항상 추천에서 제외
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
    
      return getRecommendedMeetingDays(combinedKr, combinedJp, parseISO(today), lang);
    }, [krHolidays, jpHolidays, userEvents, today, lang]);

    // 비즈니스 어드바이스
    const advice = useMemo(() => {
        return today ? analyzeBusinessDay(today, krHolidays, jpHolidays, lang) : null;
    }, [today, krHolidays, jpHolidays, lang]);

    return {
        today,
        viewMonth,
        goPrev, goNext, goToday,
        userEvents, setUserEvents,
        activeDate,
        isModalOpen, setIsModalOpen,
        openEventModal, closeEventModal,
        conflictMarkers,
        addUserEvent, deleteUserEvent,
        recommendedDays,
        advice,
        // 연휴 블록 데이터도 훅에서 제공
        jpVacations: getVacationBlocks(jpHolidays).filter(v => isSameMonth(parseISO(v.start), viewMonth)),
        krVacations: getVacationBlocks(krHolidays).filter(v => isSameMonth(parseISO(v.start), viewMonth)),
    };
}