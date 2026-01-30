import { useState } from 'react';

interface GroceryListModalProps {
  onClose: () => void;
  onGenerate: (startDate: string, endDate: string) => Promise<void>;
  defaultStartDate: string;
  defaultEndDate: string;
}

export default function GroceryListModal({
  onClose,
  onGenerate,
  defaultStartDate,
  defaultEndDate,
}: GroceryListModalProps) {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    if (startDate > endDate) {
      setError('Start date must be before end date');
      return;
    }

    try {
      setLoading(true);
      await onGenerate(startDate, endDate);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to generate grocery list');
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="recipe-form-modal" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Generate Grocery List</h2>
          <button className="close-btn" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="start-date">Start Date</label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="end-date">End Date</label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
