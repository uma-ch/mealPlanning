import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, useSensors, useSensor, PointerSensor } from '@dnd-kit/core';
import { GroceryList, GroceryListItem, GroceryCategory } from '@recipe-planner/shared';
import { API_URL } from '../config';
import DroppableCategorySection from '../components/DroppableCategorySection';
import AddManualItemForm from '../components/AddManualItemForm';
import { getIngredientSortKey } from '../utils/ingredientGrouping';

export default function GroceryListPage() {
  const [groceryList, setGroceryList] = useState<GroceryList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchGroceryList = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/grocery`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setGroceryList(data.groceryList);
      setError(null);
    } catch (err) {
      console.error('Error fetching grocery list:', err);
      setError(`Failed to load grocery list: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroceryList();
  }, []);

  const handleToggleItem = async (itemId: string, isChecked: boolean) => {
    try {
      const response = await fetch(`${API_URL}/grocery/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isChecked }),
      });

      if (!response.ok) throw new Error('Failed to update item');

      // Optimistically update the UI
      setGroceryList(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map(item =>
            item.id === itemId ? { ...item, isChecked, checkedAt: isChecked ? new Date().toISOString() : null } : item
          ),
        };
      });
    } catch (err) {
      console.error('Error toggling item:', err);
      alert('Failed to update item');
      // Refresh to get correct state
      fetchGroceryList();
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`${API_URL}/grocery/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete item');

      // Optimistically update the UI
      setGroceryList(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.filter(item => item.id !== itemId),
        };
      });
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Failed to delete item');
      // Refresh to get correct state
      fetchGroceryList();
    }
  };

  const handleAddManualItem = async (ingredientText: string, category: GroceryCategory) => {
    try {
      const response = await fetch(`${API_URL}/grocery/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredientText, category }),
      });

      if (!response.ok) throw new Error('Failed to add item');

      await fetchGroceryList();
      setShowAddForm(false);
    } catch (err) {
      console.error('Error adding item:', err);
      alert('Failed to add item');
    }
  };

  const handleClearList = async () => {
    if (!confirm('Are you sure you want to clear the grocery list?')) return;

    try {
      const response = await fetch(`${API_URL}/grocery`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to clear list');

      setGroceryList(null);
    } catch (err) {
      console.error('Error clearing list:', err);
      alert('Failed to clear list');
    }
  };

  const handleCategoryChange = async (itemId: string, newCategory: GroceryCategory) => {
    try {
      const response = await fetch(`${API_URL}/grocery/items/${itemId}/category`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCategory }),
      });

      if (!response.ok) throw new Error('Failed to update category');

      // Optimistically update the UI
      setGroceryList(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map(item =>
            item.id === itemId ? { ...item, category: newCategory } : item
          ),
        };
      });
    } catch (err) {
      console.error('Error updating category:', err);
      alert('Failed to update category');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const itemId = active.id as string;
    const newCategory = over.id as GroceryCategory;
    const item = groceryList?.items.find(i => i.id === itemId);

    if (item && item.category !== newCategory) {
      handleCategoryChange(itemId, newCategory);
    }
  };

  const handleExportToAppleNotes = () => {
    if (!groceryList || groceryList.items.length === 0) return;

    // Group items by category
    const groupedItems = groceryList.items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, GroceryListItem[]>);

    // Sort items within each category by normalized ingredient name
    Object.keys(groupedItems).forEach(category => {
      groupedItems[category].sort((a, b) => {
        const sortKeyA = getIngredientSortKey(a.ingredientText);
        const sortKeyB = getIngredientSortKey(b.ingredientText);
        return sortKeyA.localeCompare(sortKeyB);
      });
    });

    // Category order
    const categoryOrder = [
      GroceryCategory.PRODUCE,
      GroceryCategory.MEAT_SEAFOOD,
      GroceryCategory.DAIRY,
      GroceryCategory.BAKERY,
      GroceryCategory.PANTRY,
      GroceryCategory.FROZEN,
      GroceryCategory.OTHER,
    ];

    // Build formatted text for Apple Notes
    let exportText = 'Shopping List\n\n';

    categoryOrder.forEach(category => {
      if (groupedItems[category] && groupedItems[category].length > 0) {
        exportText += `${category}\n`;
        groupedItems[category].forEach(item => {
          // Use markdown checkbox format that Apple Notes supports
          const checkbox = item.isChecked ? '- [x]' : '- [ ]';
          exportText += `${checkbox} ${item.ingredientText}\n`;
        });
        exportText += '\n';
      }
    });

    // Copy to clipboard
    navigator.clipboard.writeText(exportText).then(
      () => {
        alert('✅ Grocery list copied to clipboard!\n\nYou can now paste it into Apple Notes.');
      },
      () => {
        alert('Failed to copy to clipboard. Please try again.');
      }
    );
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before dragging starts
      },
    })
  );

  if (loading) {
    return (
      <div className="grocery-list-page">
        <div className="grocery-loading">Loading grocery list...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grocery-list-page">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!groceryList) {
    return (
      <div className="grocery-list-page">
        <div className="empty-grocery-state">
          <h2>No Active Grocery List</h2>
          <p>Select recipes from the Recipes page and click "Generate Grocery List" to create a new list.</p>
        </div>
      </div>
    );
  }

  // Group items by category and sort by normalized ingredient name
  const groupedItems = groceryList.items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, GroceryListItem[]>);

  // Sort items within each category by normalized ingredient name
  // This groups similar items together (e.g., "1 clove garlic" and "2 cloves garlic")
  Object.keys(groupedItems).forEach(category => {
    groupedItems[category].sort((a, b) => {
      const sortKeyA = getIngredientSortKey(a.ingredientText);
      const sortKeyB = getIngredientSortKey(b.ingredientText);
      return sortKeyA.localeCompare(sortKeyB);
    });
  });

  // Define category order
  const categoryOrder = [
    GroceryCategory.PRODUCE,
    GroceryCategory.MEAT_SEAFOOD,
    GroceryCategory.DAIRY,
    GroceryCategory.BAKERY,
    GroceryCategory.PANTRY,
    GroceryCategory.FROZEN,
    GroceryCategory.OTHER,
  ];

  // Sort categories according to the defined order
  const sortedCategories = categoryOrder.filter(category => groupedItems[category]);

  return (
    <div className="grocery-list-page">
      <div className="grocery-header">
        <h1>Grocery List</h1>
        <div className="grocery-actions">
          <button
            className="btn-secondary"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : '+ Add Item'}
          </button>
          <button
            className="btn-primary"
            onClick={handleExportToAppleNotes}
          >
            📋 Export to Notes
          </button>
          <button
            className="btn-danger"
            onClick={handleClearList}
          >
            Clear List
          </button>
        </div>
      </div>

      {showAddForm && (
        <AddManualItemForm
          onSubmit={handleAddManualItem}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {groceryList.items.length === 0 ? (
        <div className="empty-grocery-state">
          <p>Your grocery list is empty. Add items manually or generate from recipes.</p>
        </div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="grocery-categories">
            {sortedCategories.map((category) => (
              <DroppableCategorySection
                key={category}
                category={category}
                items={groupedItems[category]}
                onToggleItem={handleToggleItem}
                onDeleteItem={handleDeleteItem}
              />
            ))}
          </div>
        </DndContext>
      )}
    </div>
  );
}
