import { useState, useMemo, useEffect } from 'react';
import { isSameMonth, format } from 'date-fns';
import { getVacationBlocks, getRecommendedMeetingDays, analyzeBusinessDay } from '@/lib/holidays';
import { Holiday, UserEvent, Lang, ConflictMarkers, RecommendedDay } from '@/types/holiday';