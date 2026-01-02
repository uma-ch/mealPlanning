import { useMemo } from 'react';
import type { Recipe } from '@recipe-planner/shared';
import DraggableRecipeCard from './DraggableRecipeCard';

interface RecipeSidebarProps {
  recipes: Recipe[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function RecipeSidebar({ recipes, searchQuery, onSearchChange }: RecipeSidebarProps) {
  // Filter recipes based on search query
  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return recipes;

    const query = searchQuery.toLowerCase();
    return recipes.filter((recipe) =>
      recipe.title.toLowerCase().includes(query) ||
      recipe.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [recipes, searchQuery]);

  return (
    <div className="recipe-sidebar">
      <div className="sidebar-header">
        <h3>Recipes</h3>
        <input
          type="text"
          className="search-input"
          placeholder="Search recipes..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="recipes-list">
        {filteredRecipes.length === 0 ? (
          <div className="empty-state">
            {searchQuery ? 'No recipes found' : 'No recipes available'}
          </div>
        ) : (
          filteredRecipes.map((recipe) => (
            <DraggableRecipeCard key={recipe.id} recipe={recipe} />
          ))
        )}
      </div>
    </div>
  );
}
