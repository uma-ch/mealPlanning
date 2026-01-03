import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GroceryListItem } from '@recipe-planner/shared';

interface GroceryItemProps {
  item: GroceryListItem;
  onToggle: (isChecked: boolean) => void;
}

export default function GroceryItem({ item, onToggle }: GroceryItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : undefined,
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
    </div>
  );
}
