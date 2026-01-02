import type { CalendarEntry } from '@recipe-planner/shared';

interface CalendarRecipeCardProps {
  entry: CalendarEntry;
  onRemove: (entryId: string) => void;
}

export default function CalendarRecipeCard({ entry, onRemove }: CalendarRecipeCardProps) {
  return (
    <div className="calendar-recipe-card">
      {entry.recipe?.imageUrl && (
        <img
          src={entry.recipe.imageUrl}
          alt={entry.recipe.title}
          className="recipe-image"
        />
      )}
      <h4 className="recipe-title">{entry.recipe?.title || 'Untitled Recipe'}</h4>
      <button
        className="remove-btn"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(entry.id);
        }}
        aria-label="Remove recipe"
        type="button"
      >
        ×
      </button>
    </div>
  );
}
