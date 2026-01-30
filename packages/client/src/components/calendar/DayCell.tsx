import { useDroppable } from '@dnd-kit/core';
import type { CalendarEntry, Recipe } from '@recipe-planner/shared';
import CalendarRecipeCard from './CalendarRecipeCard';
import { getDayName, formatDateISO } from '../../utils/dateHelpers';

interface DayCellProps {
  date: Date;
  entry?: CalendarEntry;
  onRemoveRecipe: (entryId: string) => void;
  onClickToAddRecipe?: (date: string) => void;
  onViewRecipe?: (recipe: Recipe) => void;
  isToday: boolean;
}

export default function DayCell({ date, entry, onRemoveRecipe, onClickToAddRecipe, onViewRecipe, isToday }: DayCellProps) {
  const dateString = formatDateISO(date); // YYYY-MM-DD in local timezone

  const { setNodeRef, isOver } = useDroppable({
    id: dateString,
    data: { date: dateString },
  });

  const handleEmptyDayClick = () => {
    if (onClickToAddRecipe) {
      onClickToAddRecipe(dateString);
    }
  };

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
          <CalendarRecipeCard entry={entry} onRemove={onRemoveRecipe} onViewRecipe={onViewRecipe} />
        ) : (
          <button
            type="button"
            className="empty-day"
            onClick={handleEmptyDayClick}
          >
            Tap to add recipe
          </button>
        )}
      </div>
    </div>
  );
}
