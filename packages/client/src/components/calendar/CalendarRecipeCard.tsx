import type { CalendarEntry } from '@recipe-planner/shared';

interface CalendarRecipeCardProps {
  entry: CalendarEntry;
  onRemove: (entryId: string) => void;
}

export default function CalendarRecipeCard({ entry, onRemove }: CalendarRecipeCardProps) {
  // Check if this is a custom text entry or a recipe entry
  const isCustomText = entry.customText && !entry.recipeId;

  return (
    <div className={`calendar-recipe-card ${isCustomText ? 'custom-text-entry' : ''}`}>
      {isCustomText ? (
        // Display custom text entry
        <div className="custom-text-content">
          <p className="custom-text">{entry.customText}</p>
        </div>
      ) : (
        // Display recipe entry
        <>
          {entry.recipe?.imageUrl && (
            <img
              src={entry.recipe.imageUrl}
              alt={entry.recipe.title}
              className="recipe-image"
            />
          )}
          <h4 className="recipe-title">{entry.recipe?.title || 'Untitled Recipe'}</h4>
        </>
      )}
      <button
        className="remove-btn"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(entry.id);
        }}
        aria-label={isCustomText ? 'Remove text' : 'Remove recipe'}
        type="button"
      >
        ×
      </button>
    </div>
  );
}
