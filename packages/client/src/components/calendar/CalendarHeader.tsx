import { formatWeekRange } from '../../utils/dateHelpers';

interface CalendarHeaderProps {
  currentWeekStart: Date;
  onNavigate: (direction: 'prev' | 'next') => void;
  onToday: () => void;
  onGenerateGroceryList: () => void;
}

export default function CalendarHeader({
  currentWeekStart,
  onNavigate,
  onToday,
  onGenerateGroceryList,
}: CalendarHeaderProps) {
  return (
    <div className="calendar-header">
      <div className="header-left">
        <h1>Meal Calendar</h1>
        <div className="week-display">{formatWeekRange(currentWeekStart)}</div>
      </div>

      <div className="header-controls">
        <button
          className="btn-nav"
          onClick={() => onNavigate('prev')}
          aria-label="Previous week"
          type="button"
        >
          ‹
        </button>
        <button
          className="btn-secondary"
          onClick={onToday}
          type="button"
        >
          Today
        </button>
        <button
          className="btn-nav"
          onClick={() => onNavigate('next')}
          aria-label="Next week"
          type="button"
        >
          ›
        </button>
      </div>

      <button
        className="btn-primary"
        onClick={onGenerateGroceryList}
        type="button"
      >
        Generate Grocery List
      </button>
    </div>
  );
}
