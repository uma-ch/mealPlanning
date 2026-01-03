import { useState } from 'react';

interface RecipeImportModalProps {
  onImport: (url: string) => Promise<void>;
  onImportPdf: (file: File) => Promise<{ totalSaved: number; totalExtracted: number }>;
  onClose: () => void;
  initialTab?: 'url' | 'pdf';
}

type TabType = 'url' | 'pdf';

export default function RecipeImportModal({ onImport, onImportPdf, onClose, initialTab = 'url' }: RecipeImportModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [url, setUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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

  // File validation
  const validateFile = (file: File): boolean => {
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      return false;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('File size must be less than 20 MB');
      return false;
    }
    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmitUrl = async (e: React.FormEvent) => {
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

  const handleSubmitPdf = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedFile) {
      setError('Please select a PDF file');
      return;
    }

    try {
      setLoading(true);
      const result = await onImportPdf(selectedFile);
      alert(`Successfully imported ${result.totalSaved} recipe(s) from PDF!`);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to import recipes from PDF');
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
          <h2>Import Recipe</h2>
          <button className="close-btn" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="import-tabs">
          <button
            className={`import-tab ${activeTab === 'url' ? 'active' : ''}`}
            onClick={() => setActiveTab('url')}
            type="button"
          >
            From URL
          </button>
          <button
            className={`import-tab ${activeTab === 'pdf' ? 'active' : ''}`}
            onClick={() => setActiveTab('pdf')}
            type="button"
          >
            From PDF
          </button>
        </div>

        {/* URL Tab */}
        {activeTab === 'url' && (
          <form onSubmit={handleSubmitUrl} className="import-form">
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
        )}

        {/* PDF Tab */}
        {activeTab === 'pdf' && (
          <form onSubmit={handleSubmitPdf} className="import-form">
            <div className="pdf-upload-group">
              <label>Upload PDF</label>

              {/* Drag-drop zone */}
              <div
                className="pdf-dropzone"
                onDrop={handleFileDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <input
                  type="file"
                  id="pdf-file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  disabled={loading}
                  style={{ display: 'none' }}
                />
                <label htmlFor="pdf-file" className="dropzone-label">
                  {selectedFile ? (
                    <>
                      <span className="file-icon">📄</span>
                      <span className="file-name">{selectedFile.name}</span>
                      <span className="file-size">
                        ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="upload-icon">⬆️</span>
                      <p>Drag & drop PDF here or click to browse</p>
                      <p className="upload-hint">Maximum file size: 20 MB</p>
                    </>
                  )}
                </label>
              </div>

              {error && <div className="import-error">{error}</div>}
            </div>

            {loading && (
              <div className="import-loading">
                <div className="loading-spinner"></div>
                <p>Extracting recipes from PDF... This may take up to 30 seconds.</p>
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading || !selectedFile}>
                {loading ? 'Importing...' : 'Import Recipes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
