import { GroceryListItem } from '@recipe-planner/shared';

interface GroceryItemProps {
  item: GroceryListItem;
  onToggle: (isChecked: boolean) => void;
}

export default function GroceryItem({ item, onToggle }: GroceryItemProps) {
  return (
    <div className={`grocery-item ${item.isChecked ? 'checked' : ''}`}>
      <label>
        <input
          type="checkbox"
          checked={item.isChecked}
          onChange={(e) => onToggle(e.target.checked)}
        />
        <span className="item-text">{item.ingredientText}</span>
      </label>
    </div>
  );
}
