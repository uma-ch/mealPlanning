import { Recipe } from '@recipe-planner/shared';

interface RecipeCardProps {
  recipe: Recipe;
  selected?: boolean;
  onToggleSelect?: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function RecipeCard({ recipe, selected = false, onToggleSelect, onView, onEdit, onDelete }: RecipeCardProps) {
  return (
    <div className={`recipe-card ${selected ? 'selected' : ''}`} onClick={onView}>
      {onToggleSelect && (
        <div className="recipe-checkbox" onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => {}}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {recipe.imageUrl && (
        <div className="recipe-image">
          <img src={recipe.imageUrl} alt={recipe.title} />
        </div>
      )}

      <div className="recipe-content">
        <h3>{recipe.title}</h3>

        {recipe.tags && recipe.tags.length > 0 && (
          <div className="recipe-tags">
            {recipe.tags.map((tag, idx) => (
              <span key={idx} className="tag">{tag}</span>
            ))}
          </div>
        )}

        <div className="recipe-preview">
          <p><strong>Ingredients:</strong></p>
          <p className="text-preview">{recipe.ingredients.slice(0, 100)}...</p>
        </div>

        {recipe.sourceUrl && (
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="source-link"
          >
            View Original
          </a>
        )}
      </div>

      <div className="recipe-actions">
        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="btn-secondary">Edit</button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="btn-danger">Delete</button>
      </div>
    </div>
  );
}
