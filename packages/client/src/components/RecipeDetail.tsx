import { Recipe } from '@recipe-planner/shared';

interface RecipeDetailProps {
  recipe: Recipe;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function RecipeDetail({ recipe, onClose, onEdit, onDelete }: RecipeDetailProps) {
  return (
    <div className="recipe-detail-modal" onClick={onClose}>
      <div className="modal-content recipe-detail-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{recipe.title}</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        <div className="recipe-detail-body">
          {recipe.imageUrl && (
            <div className="recipe-detail-image">
              <img src={recipe.imageUrl} alt={recipe.title} />
            </div>
          )}

          {recipe.tags && recipe.tags.length > 0 && (
            <div className="recipe-tags">
              {recipe.tags.map((tag, idx) => (
                <span key={idx} className="tag">{tag}</span>
              ))}
            </div>
          )}

          <div className="recipe-section">
            <h3>Ingredients</h3>
            <div className="recipe-text">{recipe.ingredients}</div>
          </div>

          <div className="recipe-section">
            <h3>Instructions</h3>
            <div className="recipe-text">{recipe.instructions}</div>
          </div>

          {recipe.sourceUrl && (
            <div className="recipe-section">
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="source-link"
              >
                View Original Recipe →
              </a>
            </div>
          )}
        </div>

        <div className="recipe-detail-actions">
          <button onClick={onEdit} className="btn-secondary">Edit Recipe</button>
          <button onClick={onDelete} className="btn-danger">Delete Recipe</button>
        </div>
      </div>
    </div>
  );
}
