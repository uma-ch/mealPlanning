import { useState } from 'react';

interface RecipeImportModalProps {
  onImport: (url: string) => Promise<void>;
  onClose: () => void;
}

export default function RecipeImportModal({ onImport, onClose }: RecipeImportModalProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidUrl = (urlString: string): boolean => {
    try {
      const parsedUrl = new URL(urlString);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate URL
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!isValidUrl(url.trim())) {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }

    // Import recipe
    try {
      setLoading(true);
      await onImport(url.trim());
      // Success - parent will close modal
    } catch (err: any) {
      // Display user-friendly error messages
      const message = err.message || 'Failed to import recipe';

      if (message.includes('not accessible') || message.includes('HTTP error')) {
        setError('Could not access URL. Please check the link and try again.');
      } else if (message.includes('No recipe found')) {
        setError('No recipe found on this page. Try a different URL or add the recipe manually.');
      } else if (message.includes('Too many')) {
        setError('Too many imports. Please try again in a few minutes.');
      } else if (message.includes('timeout')) {
        setError('Request timed out. The website took too long to respond.');
      } else {
        setError(message);
      }
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
    <div className="recipe-import-modal" onClick={handleOverlayClick}>
      <div className="import-modal-content">
        <div className="modal-header">
          <h2>Import Recipe from URL</h2>
          <button className="close-btn" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="import-form">
          <div className="url-input-group">
            <label htmlFor="recipe-url">Recipe URL</label>
            <input
              id="recipe-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/recipe"
              disabled={loading}
              autoFocus
            />
            {error && <div className="import-error">{error}</div>}
          </div>

          {loading && (
            <div className="import-loading">
              <div className="loading-spinner"></div>
              <p>Importing recipe... This may take a few seconds.</p>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading || !url.trim()}>
              {loading ? 'Importing...' : 'Import Recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
