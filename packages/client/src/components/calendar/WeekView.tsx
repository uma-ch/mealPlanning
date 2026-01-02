import { useMemo } from 'react';
import type { CalendarEntry } from '@recipe-planner/shared';
import DayCell from './DayCell';
import { addDays, isToday, formatDateISO } from '../../utils/dateHelpers';

interface WeekViewProps {
  weekStart: Date;
  entries: CalendarEntry[];
  onRemoveRecipe: (entryId: string) => void;
}

export default function WeekView({ weekStart, entries, onRemoveRecipe }: WeekViewProps) {
  // Generate 7 days starting from weekStart
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // Create a map of entries by date for quick lookup
  const entryByDate = useMemo(() => {
    return entries.reduce((acc, entry) => {
      acc[entry.date] = entry;
      return acc;
    }, {} as Record<string, CalendarEntry>);
  }, [entries]);

  return (
    <div className="week-view">
      <div className="week-grid">
        {weekDays.map((day) => {
          const dateKey = formatDateISO(day);
          return (
            <DayCell
              key={dateKey}
              date={day}
              entry={entryByDate[dateKey]}
              onRemoveRecipe={onRemoveRecipe}
              isToday={isToday(day)}
            />
          );
        })}
      </div>
    </div>
  );
}
