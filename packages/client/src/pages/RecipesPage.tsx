import { useState, useEffect } from 'react';
import { Recipe } from '@recipe-planner/shared';
import { API_URL } from '../config';
import { getAuthHeaders } from '../utils/auth';
import RecipeCard from '../components/RecipeCard';
import RecipeForm from '../components/RecipeForm';
import RecipeDetail from '../components/RecipeDetail';
import RecipeImportModal from '../components/RecipeImportModal';
import RecipeAddModal from '../components/RecipeAddModal';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<Set<string>>(new Set());
  const [generatingList, setGeneratingList] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importModalTab, setImportModalTab] = useState<'url' | 'pdf'>('url');

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      console.log('Fetching recipes from:', `${API_URL}/recipes`);
      const response = await fetch(`${API_URL}/recipes`, {
        headers: getAuthHeaders(),
      });
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to delete recipe');

      await fetchRecipes();
    } catch (err) {
      console.error('Error deleting recipe:', err);
      alert('Failed to delete recipe');
    }
  };

  const handleToggleSelect = (recipeId: string) => {
    setSelectedRecipeIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recipeId)) {
        newSet.delete(recipeId);
      } else {
        newSet.add(recipeId);
      }
      return newSet;
    });
  };

  const handleGenerateGroceryList = async () => {
    if (selectedRecipeIds.size === 0) return;

    try {
      setGeneratingList(true);
      const response = await fetch(`${API_URL}/grocery/generate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ recipeIds: Array.from(selectedRecipeIds) }),
      });

      if (!response.ok) throw new Error('Failed to generate grocery list');

      alert('Grocery list generated! Check the Grocery List page.');
      setSelectedRecipeIds(new Set());
    } catch (err) {
      console.error('Error generating grocery list:', err);
      alert('Failed to generate grocery list');
    } finally {
      setGeneratingList(false);
    }
  };

  const handleImportRecipe = async (url: string) => {
    try {
      const response = await fetch(`${API_URL}/recipes/import-url`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import recipe');
      }

      const { recipe, source } = await response.json();
      alert(`Recipe "${recipe.title}" imported successfully using ${source}!`);

      await fetchRecipes();
      setShowImportModal(false);
    } catch (err: any) {
      console.error('Error importing recipe:', err);
      throw err; // Re-throw to let modal handle error display
    }
  };

  const handleImportPdf = async (file: File): Promise<{ totalSaved: number; totalExtracted: number }> => {
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await fetch(`${API_URL}/recipes/import-pdf`, {
        method: 'POST',
        body: formData, // No Content-Type header - browser sets it
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import recipes from PDF');
      }

      const result = await response.json();

      // Refresh recipe list
      await fetchRecipes();

      return {
        totalSaved: result.totalSaved,
        totalExtracted: result.totalExtracted,
      };
    } catch (err: any) {
      console.error('Error importing PDF:', err);
      throw err;
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
        <div className="header-left">
          <h1>My Recipes</h1>
          {selectedRecipeIds.size > 0 && (
            <div className="selection-controls">
              <span className="selection-count">
                {selectedRecipeIds.size} selected
              </span>
            </div>
          )}
        </div>
        <div className="header-actions">
          <button
            className="btn-primary"
            onClick={handleGenerateGroceryList}
            disabled={selectedRecipeIds.size === 0 || generatingList}
          >
            {generatingList ? 'Generating...' : `Generate Grocery List (${selectedRecipeIds.size})`}
          </button>
          <button
            className="btn-primary"
            onClick={() => setShowAddOptions(true)}
          >
            + Add Recipe
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showAddOptions && (
        <RecipeAddModal
          onClose={() => setShowAddOptions(false)}
          onImportUrl={() => {
            setShowAddOptions(false);
            setImportModalTab('url');
            setShowImportModal(true);
          }}
          onImportPdf={() => {
            setShowAddOptions(false);
            setImportModalTab('pdf');
            setShowImportModal(true);
          }}
          onAddManual={() => {
            setShowAddOptions(false);
            setShowForm(true);
          }}
        />
      )}

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

      {showImportModal && (
        <RecipeImportModal
          onImport={handleImportRecipe}
          onImportPdf={handleImportPdf}
          onClose={() => setShowImportModal(false)}
          initialTab={importModalTab}
          showTabs={false}
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
              selected={selectedRecipeIds.has(recipe.id)}
              onToggleSelect={() => handleToggleSelect(recipe.id)}
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
