import { useDraggable } from '@dnd-kit/core';
import type { Recipe } from '@recipe-planner/shared';

interface DraggableRecipeCardProps {
  recipe: Recipe;
}

export default function DraggableRecipeCard({ recipe }: DraggableRecipeCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: recipe.id,
    data: { recipe },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`draggable-recipe-card ${isDragging ? 'dragging' : ''}`}
    >
      {recipe.imageUrl && (
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="recipe-thumbnail"
        />
      )}
      <div className="recipe-info">
        <h4>{recipe.title}</h4>
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="recipe-tags">
            {recipe.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
