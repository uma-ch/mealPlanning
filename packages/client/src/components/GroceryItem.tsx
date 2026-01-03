import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GroceryListItem } from '@recipe-planner/shared';

interface GroceryItemProps {
  item: GroceryListItem;
  onToggle: (isChecked: boolean) => void;
  onDelete: (itemId: string) => void;
}

export default function GroceryItem({ item, onToggle, onDelete }: GroceryItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : undefined,
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(item.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`grocery-item ${item.isChecked ? 'checked' : ''} ${isDragging ? 'dragging' : ''}`}
    >
      <label>
        <input
          type="checkbox"
          checked={item.isChecked}
          onChange={(e) => onToggle(e.target.checked)}
        />
        <span className="item-text">{item.ingredientText}</span>
      </label>
      <button
        className="delete-item-btn"
        onClick={handleDelete}
        title="Delete item"
        aria-label="Delete item"
      >
        ×
      </button>
    </div>
  );
}
