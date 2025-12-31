import { useState, useEffect } from 'react';
import { GroceryList, GroceryListItem, GroceryCategory } from '@recipe-planner/shared';
import { API_URL } from '../config';
import GroceryItem from '../components/GroceryItem';
import AddManualItemForm from '../components/AddManualItemForm';

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

  // Group items by category
  const groupedItems = groceryList.items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, GroceryListItem[]>);

  // Define category order
  const categoryOrder = [
    GroceryCategory.PRODUCE,
    GroceryCategory.MEAT_SEAFOOD,
    GroceryCategory.DAIRY_EGGS,
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
        <div className="grocery-categories">
          {sortedCategories.map((category) => (
            <div key={category} className="category-section">
              <div className="category-header">
                <span>{category}</span>
                <span className="category-count">{groupedItems[category].length}</span>
              </div>
              <div className="category-items">
                {groupedItems[category].map((item) => (
                  <GroceryItem
                    key={item.id}
                    item={item}
                    onToggle={(isChecked) => handleToggleItem(item.id, isChecked)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
