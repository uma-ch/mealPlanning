interface RecipeAddModalProps {
  onClose: () => void;
  onImportUrl: () => void;
  onImportPdf: () => void;
  onAddManual: () => void;
}

export default function RecipeAddModal({
  onClose,
  onImportUrl,
  onImportPdf,
  onAddManual,
}: RecipeAddModalProps) {
  return (
    <div className="recipe-form-modal" onClick={onClose}>
      <div className="modal-content add-options-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Recipe</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="add-options-body">
          <button className="add-option-btn" onClick={onImportUrl}>
            <div className="option-icon">🔗</div>
            <div className="option-content">
              <h3>Import from URL</h3>
              <p>Import a recipe from a website URL</p>
            </div>
          </button>

          <button className="add-option-btn" onClick={onImportPdf}>
            <div className="option-icon">📄</div>
            <div className="option-content">
              <h3>Import from PDF</h3>
              <p>Extract recipes from a PDF file</p>
            </div>
          </button>

          <button className="add-option-btn" onClick={onAddManual}>
            <div className="option-icon">✏️</div>
            <div className="option-content">
              <h3>Add Manually</h3>
              <p>Create a recipe from scratch</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
