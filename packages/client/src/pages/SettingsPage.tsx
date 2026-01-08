import { useState, useEffect } from 'react';
import { ApiKey, CreateApiKeyResponse } from '@recipe-planner/shared';
import { API_URL } from '../config';
import { getAuthHeaders } from '../utils/auth';
import '../styles/SettingsPage.css';

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch(`${API_URL}/api-keys`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch API keys');

      const data = await response.json();
      setApiKeys(data.apiKeys || []);
    } catch (err) {
      console.error('Error fetching API keys:', err);
      setError('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newKeyName.trim()) {
      setError('Please enter a name for the API key');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api-keys`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newKeyName.trim() }),
      });

      if (!response.ok) throw new Error('Failed to create API key');

      const data: CreateApiKeyResponse = await response.json();

      setCreatedKey(data.key);
      setNewKeyName('');
      setShowCreateForm(false);
      setError(null);
      await fetchApiKeys();
    } catch (err) {
      console.error('Error creating API key:', err);
      setError('Failed to create API key');
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api-keys/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to revoke API key');

      setError(null);
      await fetchApiKeys();
    } catch (err) {
      console.error('Error revoking API key:', err);
      setError('Failed to revoke API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('API key copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="loading">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <h1>Settings</h1>

      <section className="settings-section">
        <div className="section-header">
          <h2>API Keys</h2>
          <p className="section-description">
            Manage API keys for the browser extension and other integrations
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {createdKey && (
          <div className="api-key-created">
            <h3>API Key Created!</h3>
            <p className="warning-text">
              Save this key now - you won't be able to see it again!
            </p>
            <div className="key-display">
              <code>{createdKey}</code>
              <button
                className="btn-secondary"
                onClick={() => copyToClipboard(createdKey)}
              >
                Copy
              </button>
            </div>
            <button
              className="btn-text"
              onClick={() => setCreatedKey(null)}
            >
              Done
            </button>
          </div>
        )}

        {!showCreateForm && !createdKey && (
          <button
            className="btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            + Create New API Key
          </button>
        )}

        {showCreateForm && (
          <form onSubmit={handleCreateKey} className="create-key-form">
            <div className="form-group">
              <label htmlFor="keyName">API Key Name</label>
              <input
                type="text"
                id="keyName"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., Chrome Extension"
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">
                Create
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewKeyName('');
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="api-keys-list">
          {apiKeys.length === 0 ? (
            <p className="empty-state">No API keys yet</p>
          ) : (
            <table className="api-keys-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Key</th>
                  <th>Created</th>
                  <th>Last Used</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((key) => (
                  <tr key={key.id}>
                    <td>{key.name}</td>
                    <td>
                      <code>{key.keyPrefix}...</code>
                    </td>
                    <td>{new Date(key.createdAt).toLocaleDateString()}</td>
                    <td>
                      {key.lastUsedAt
                        ? new Date(key.lastUsedAt).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td>
                      <span className={`status ${key.isActive ? 'active' : 'inactive'}`}>
                        {key.isActive ? 'Active' : 'Revoked'}
                      </span>
                    </td>
                    <td>
                      {key.isActive && (
                        <button
                          className="btn-danger-text"
                          onClick={() => handleRevokeKey(key.id)}
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
