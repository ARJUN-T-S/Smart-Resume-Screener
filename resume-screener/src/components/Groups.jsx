import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { idToken } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // Fetch groups
  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://smart-resume-screener-r6s0.onrender.com/groups/', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }

      const result = await response.json();
      if (result.success) {
        setGroups(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      alert('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  // Add new group
  const handleAddGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    try {
      setSubmitting(true);
      const response = await fetch('https://smart-resume-screener-r6s0.onrender.com/groups/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ groupName: groupName.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to create group');
      }

      const result = await response.json();
      if (result.success) {
        setGroupName('');
        setShowAddForm(false);
        fetchGroups();
        alert('Group created successfully!');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle group click - pass data via state
  const handleGroupClick = (group) => {
    navigate('/group', { state: { group } });
  };

  useEffect(() => {
    fetchGroups();
  }, [idToken]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Groups</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Group
        </button>
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/20">
          <h3 className="text-lg font-medium text-white mb-3">Create New Group</h3>
          <form onSubmit={handleAddGroup} className="space-y-3">
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:border-blue-400 focus:bg-white/10 transition-colors"
              required
            />
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create Group'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 border border-white/20"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-blue-200 mt-2">Loading groups...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-blue-200">No groups found. Create your first group!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <div
              key={group._id}
              onClick={() => handleGroupClick(group)}
              className="p-4 bg-white/5 border border-white/20 rounded-lg hover:border-blue-400 hover:bg-white/10 cursor-pointer transition-colors"
            >
              <h3 className="font-medium text-white">{group.groupName}</h3>
              <p className="text-sm text-blue-200">Group ID: {group._id}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Groups;