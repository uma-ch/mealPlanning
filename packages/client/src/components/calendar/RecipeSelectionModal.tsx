import { useState } from 'react';
import type { Recipe } from '@recipe-planner/shared';

interface RecipeSelectionModalProps {
  date: string;
  recipes: Recipe[];
  onSelectRecipe: (recipeId: string, date: string) => void;
  onClose: () => void;
}

export default function RecipeSelectionModal({
  date,
  recipes,
  onSelectRecipe,
  onClose,
}: RecipeSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecipes = recipes.filter(recipe =>
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content recipe-selection-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Recipe to {formattedDate}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <input
            type="text"
            className="recipe-search"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />

          <div className="recipe-list">
            {filteredRecipes.length === 0 ? (
              <div className="no-recipes">
                {searchTerm ? 'No recipes match your search' : 'No recipes available'}
              </div>
            ) : (
              filteredRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="recipe-option"
                  onClick={() => {
                    onSelectRecipe(recipe.id, date);
                    onClose();
                  }}
                >
                  {recipe.imageUrl && (
                    <img src={recipe.imageUrl} alt={recipe.title} className="recipe-thumb" />
                  )}
                  <div className="recipe-info">
                    <h3>{recipe.title}</h3>
                    {recipe.tags && recipe.tags.length > 0 && (
                      <div className="recipe-tags-small">
                        {recipe.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="tag-small">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
