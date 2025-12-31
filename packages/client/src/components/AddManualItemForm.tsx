import { useState } from 'react';
import { GroceryCategory } from '@recipe-planner/shared';

interface AddManualItemFormProps {
  onSubmit: (ingredientText: string, category: GroceryCategory) => void;
  onCancel: () => void;
}

export default function AddManualItemForm({ onSubmit, onCancel }: AddManualItemFormProps) {
  const [ingredientText, setIngredientText] = useState('');
  const [category, setCategory] = useState<GroceryCategory>(GroceryCategory.OTHER);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredientText.trim()) return;

    onSubmit(ingredientText.trim(), category);
    setIngredientText('');
    setCategory(GroceryCategory.OTHER);
  };

  return (
    <form className="add-item-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <input
          type="text"
          value={ingredientText}
          onChange={(e) => setIngredientText(e.target.value)}
          placeholder="Enter ingredient..."
          className="item-input"
          autoFocus
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as GroceryCategory)}
          className="category-select"
        >
          {Object.values(GroceryCategory).map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-primary" disabled={!ingredientText.trim()}>
          Add
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
