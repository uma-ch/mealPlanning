import { useEffect, useState } from 'react';
import type { HouseholdDetails } from '@recipe-planner/shared';
import { API_URL } from '../config';
import '../styles/HouseholdPage.css';

export default function HouseholdPage() {
  const [household, setHousehold] = useState<HouseholdDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joiningHousehold, setJoiningHousehold] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [copiedInviteCode, setCopiedInviteCode] = useState(false);

  useEffect(() => {
    fetchHousehold();
  }, []);

  const fetchHousehold = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/household`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch household');
      }

      const data = await response.json();
      setHousehold(data);
      setNewName(data.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load household');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    try {
      setJoiningHousehold(true);
      setError('');

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/household/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteCode: joinCode.trim().toUpperCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join household');
      }

      // Update user's householdId in localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.householdId = data.household.id;
      localStorage.setItem('user', JSON.stringify(user));

      // Refresh household data
      await fetchHousehold();
      setJoinCode('');
      alert('Successfully joined household! The page will reload to show shared data.');
      window.location.reload(); // Reload to refresh all household data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join household');
    } finally {
      setJoiningHousehold(false);
    }
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/household`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to update household name');
      }

      await fetchHousehold();
      setEditingName(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update name');
    }
  };

  const copyInviteCode = () => {
    if (household?.inviteCode) {
      navigator.clipboard.writeText(household.inviteCode);
      setCopiedInviteCode(true);
      setTimeout(() => setCopiedInviteCode(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="household-page">
        <div className="loading">Loading household...</div>
      </div>
    );
  }

  return (
    <div className="household-page">
      <h1>Household</h1>

      {error && <div className="error-message">{error}</div>}

      {household && (
        <>
          {/* Household Name Section */}
          <section className="household-section">
            <h2>Household Name</h2>
            {editingName ? (
              <form onSubmit={handleUpdateName} className="edit-name-form">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Household name"
                  autoFocus
                />
                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setEditingName(false);
                      setNewName(household.name);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="household-name">
                <h3>{household.name}</h3>
                <button
                  className="btn-secondary btn-small"
                  onClick={() => setEditingName(true)}
                >
                  Edit
                </button>
              </div>
            )}
          </section>

          {/* Invite Code Section */}
          <section className="household-section">
            <h2>Invite Others</h2>
            <p>Share this code with others to invite them to your household:</p>
            <div className="invite-code-display">
              <code className="invite-code">{household.inviteCode}</code>
              <button className="btn-secondary" onClick={copyInviteCode}>
                {copiedInviteCode ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="help-text">
              When they join, they'll have access to all your shared recipes, meal plans, and
              grocery lists.
            </p>
          </section>

          {/* Members Section */}
          <section className="household-section">
            <h2>Members ({household.members.length})</h2>
            <div className="members-list">
              {household.members.map((member) => (
                <div key={member.id} className="member-item">
                  <div className="member-info">
                    <strong>{member.email}</strong>
                    <span className="member-date">
                      Joined {new Date(member.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Join Different Household Section */}
      <section className="household-section join-section">
        <h2>Join a Different Household</h2>
        <p className="warning-text">
          Warning: Joining a different household will move you out of your current household. If
          you're the only member, your current household will be deleted.
        </p>
        <form onSubmit={handleJoinHousehold} className="join-form">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Enter invite code"
            maxLength={10}
            disabled={joiningHousehold}
          />
          <button type="submit" className="btn-primary" disabled={joiningHousehold || !joinCode}>
            {joiningHousehold ? 'Joining...' : 'Join Household'}
          </button>
        </form>
      </section>
    </div>
  );
}
