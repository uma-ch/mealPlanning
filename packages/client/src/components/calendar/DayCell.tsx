import { useDroppable } from '@dnd-kit/core';
import type { CalendarEntry } from '@recipe-planner/shared';
import CalendarRecipeCard from './CalendarRecipeCard';
import { getDayName } from '../../utils/dateHelpers';

interface DayCellProps {
  date: Date;
  entry?: CalendarEntry;
  onRemoveRecipe: (entryId: string) => void;
  isToday: boolean;
}

export default function DayCell({ date, entry, onRemoveRecipe, isToday }: DayCellProps) {
  const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD

  const { setNodeRef, isOver } = useDroppable({
    id: dateString,
    data: { date: dateString },
  });

  return (
    <div
      ref={setNodeRef}
      className={`day-cell ${isOver ? 'drop-target' : ''} ${isToday ? 'today' : ''}`}
    >
      <div className="day-header">
        <span className="day-name">{getDayName(date)}</span>
        <span className="day-number">{date.getDate()}</span>
      </div>

      <div className="day-content">
        {entry ? (
          <CalendarRecipeCard entry={entry} onRemove={onRemoveRecipe} />
        ) : (
          <div className="empty-day">Drop recipe here</div>
        )}
      </div>
    </div>
  );
}
