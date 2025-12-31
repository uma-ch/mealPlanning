import { useState, useEffect } from 'react';
import { Recipe } from '@recipe-planner/shared';
import { API_URL } from '../config';
import RecipeCard from '../components/RecipeCard';
import RecipeForm from '../components/RecipeForm';
import RecipeDetail from '../components/RecipeDetail';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      console.log('Fetching recipes from:', `${API_URL}/recipes`);
      const response = await fetch(`${API_URL}/recipes`);
      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Recipes data:', data);
      setRecipes(data.recipes || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching recipes:', err);
      setError(`Failed to load recipes: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const handleCreateRecipe = async (recipeData: any) => {
    try {
      const response = await fetch(`${API_URL}/recipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipeData),
      });

      if (!response.ok) throw new Error('Failed to create recipe');

      await fetchRecipes();
      setShowForm(false);
    } catch (err) {
      console.error('Error creating recipe:', err);
      alert('Failed to create recipe');
    }
  };

  const handleUpdateRecipe = async (id: string, recipeData: any) => {
    try {
      const response = await fetch(`${API_URL}/recipes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipeData),
      });

      if (!response.ok) throw new Error('Failed to update recipe');

      await fetchRecipes();
      setEditingRecipe(null);
    } catch (err) {
      console.error('Error updating recipe:', err);
      alert('Failed to update recipe');
    }
  };

  const handleDeleteRecipe = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recipe?')) return;

    try {
      const response = await fetch(`${API_URL}/recipes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete recipe');

      await fetchRecipes();
    } catch (err) {
      console.error('Error deleting recipe:', err);
      alert('Failed to delete recipe');
    }
  };

  if (loading) {
    return (
      <div className="recipes-page">
        <div className="loading">Loading recipes...</div>
      </div>
    );
  }

  return (
    <div className="recipes-page">
      <div className="recipes-header">
        <h1>My Recipes</h1>
        <button
          className="btn-primary"
          onClick={() => setShowForm(true)}
        >
          + Add Recipe
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {viewingRecipe && (
        <RecipeDetail
          recipe={viewingRecipe}
          onClose={() => setViewingRecipe(null)}
          onEdit={() => {
            setEditingRecipe(viewingRecipe);
            setViewingRecipe(null);
          }}
          onDelete={() => {
            handleDeleteRecipe(viewingRecipe.id);
            setViewingRecipe(null);
          }}
        />
      )}

      {(showForm || editingRecipe) && (
        <RecipeForm
          recipe={editingRecipe || undefined}
          onSubmit={editingRecipe
            ? (data) => handleUpdateRecipe(editingRecipe.id, data)
            : handleCreateRecipe
          }
          onCancel={() => {
            setShowForm(false);
            setEditingRecipe(null);
          }}
        />
      )}

      {recipes.length === 0 ? (
        <div className="empty-state">
          <p>No recipes yet. Click "Add Recipe" to get started!</p>
        </div>
      ) : (
        <div className="recipes-grid">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onView={() => setViewingRecipe(recipe)}
              onEdit={() => setEditingRecipe(recipe)}
              onDelete={() => handleDeleteRecipe(recipe.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
