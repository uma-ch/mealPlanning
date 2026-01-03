import { useDroppable } from '@dnd-kit/core';
import { GroceryCategory, GroceryListItem } from '@recipe-planner/shared';
import GroceryItem from './GroceryItem';

interface DroppableCategorySectionProps {
  category: GroceryCategory;
  items: GroceryListItem[];
  onToggleItem: (itemId: string, isChecked: boolean) => void;
  onDeleteItem: (itemId: string) => void;
}

export default function DroppableCategorySection({
  category,
  items,
  onToggleItem,
  onDeleteItem,
}: DroppableCategorySectionProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: category,
    data: { category },
  });

  return (
    <div
      key={category}
      className={`category-section ${isOver ? 'drop-target' : ''}`}
      ref={setNodeRef}
    >
      <div className="category-header">
        <span>{category}</span>
        <span className="category-count">{items.length}</span>
      </div>
      <div className="category-items">
        {items.map((item) => (
          <GroceryItem
            key={item.id}
            item={item}
            onToggle={(isChecked) => onToggleItem(item.id, isChecked)}
            onDelete={onDeleteItem}
          />
        ))}
      </div>
    </div>
  );
}
