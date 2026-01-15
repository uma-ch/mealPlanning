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

  const handleClick = () => {
    if (!entry && onClickToAddRecipe) {
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

      <div className="day-content" onClick={handleClick}>
        {entry ? (
          <CalendarRecipeCard entry={entry} onRemove={onRemoveRecipe} onViewRecipe={onViewRecipe} />
        ) : (
          <div className="empty-day">Click to add recipe</div>
        )}
      </div>
    </div>
  );
}
