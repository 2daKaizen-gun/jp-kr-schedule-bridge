import { useState, useMemo, useSyncExternalStore } from 'react';
import { isSameMonth, format, addMonths, subMonths, parseISO, startOfMonth } from 'date-fns';
import { getVacationBlocks, getRecommendedMeetingDays, analyzeBusinessDay } from '@/lib/holidays';
import { translations } from '@/lib/translations';
import { parseUserEvents, readUserEvents, readUserEventsOnServer, subscribeToUserEvents, writeUserEvents } from '@/lib/userEvents';
import { Holiday, UserEvent, Lang, ConflictMarkers, EventScope } from '@/types/holiday';

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

    const savedEvents = useSyncExternalStore(subscribeToUserEvents, readUserEvents, readUserEventsOnServer);
    const userEvents = useMemo(() => parseUserEvents(savedEvents), [savedEvents]);

    // 일정 추가 모달을 연 날짜 (null이면 닫힘)
    const [activeDate, setActiveDate] = useState<string | null>(null);
    const closeEventModal = () => setActiveDate(null);

    // 내비게이션 함수들
    const goPrev = () => setSelectedMonth(subMonths(viewMonth, 1));
    const goNext = () => setSelectedMonth(addMonths(viewMonth, 1));
    const goToday = () => setSelectedMonth(null);

    const conflictMarkers = useMemo<ConflictMarkers>(() => {
        const krDates = new Set(krHolidays.filter(h => h.isPublicHoliday).map(h => h.date));
        const jpDates = new Set(jpHolidays.filter(h => h.isPublicHoliday).map(h => h.date));

        const markers: ConflictMarkers = {};
        for (const date of new Set([...krDates, ...jpDates])) {
            const isKr = krDates.has(date);
            const isJp = jpDates.has(date);
            markers[date] = { type: isKr && isJp ? 'both' : isKr ? 'kr' : 'jp' };
        }
        return markers;
    }, [jpHolidays, krHolidays]);

    // 일정 추가 함수
    const addUserEvent = (title: string, type: UserEvent['type'], country: EventScope) => {
        if (!activeDate) return;

        const newEvent: UserEvent = {
            id: `${activeDate}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            date: activeDate,
            title,
            type,
            countryCode: country
        };
        writeUserEvents([...userEvents, newEvent]);
        closeEventModal();
    };

    // 일정 삭제 함수
    const deleteUserEvent = (id: string) => {
        if (window.confirm(translations[lang].calendar.deleteConfirm)) {
            writeUserEvents(userEvents.filter((event) => event.id !== id));
        }
    };

    // 오늘 기준 향후 2주 (보고 있는 달과 무관). 사용자 일정이 있는 날은 종류와 범위에 관계없이 제외
    const recommendedDays = useMemo(() => {
        if (!today) return [];

        return getRecommendedMeetingDays(
            [
                ...krHolidays,
                ...jpHolidays,
                ...userEvents.map(e => ({ date: e.date, isPublicHoliday: true })),
            ],
            parseISO(today),
            lang
        );
    }, [krHolidays, jpHolidays, userEvents, today, lang]);

    // 비즈니스 어드바이스
    const advice = useMemo(() => {
        return today ? analyzeBusinessDay(today, krHolidays, jpHolidays, lang) : null;
    }, [today, krHolidays, jpHolidays, lang]);

    return {
        today,
        viewMonth,
        goPrev, goNext, goToday,
        userEvents,
        activeDate,
        openEventModal: setActiveDate,
        closeEventModal,
        conflictMarkers,
        addUserEvent, deleteUserEvent,
        recommendedDays,
        advice,
        // 연휴 블록 데이터도 훅에서 제공
        jpVacations: getVacationBlocks(jpHolidays).filter(v => isSameMonth(parseISO(v.start), viewMonth)),
        krVacations: getVacationBlocks(krHolidays).filter(v => isSameMonth(parseISO(v.start), viewMonth)),
    };
}
