import React, { useState, useEffect } from 'react';
import { HiSearch, HiX } from 'react-icons/hi';
import { useTheme } from '../../context/ThemeContext';
import api from '../../utils/api';

export default function UserSearch({ onSelectUser, onCancel }) {
  const { isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    const searchUsers = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/users/search?query=${encodeURIComponent(searchQuery)}`);
        setSearchResults(response.data.users || []);
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  return (
    <div className={`flex flex-col max-h-96 ${
      isDarkMode ? 'bg-slate-800' : 'bg-white'
    }`}>
      <div className={`p-4 border-b ${
        isDarkMode ? 'border-slate-700' : 'border-gray-200'
      }`}>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
          isDarkMode 
            ? 'bg-slate-700 border-slate-600' 
            : 'bg-gray-100 border-gray-300'
        }`}>
          <HiSearch className={isDarkMode ? 'text-slate-400' : 'text-gray-400'} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`flex-1 bg-transparent outline-none text-sm ${
              isDarkMode ? 'text-white placeholder-slate-500' : 'text-gray-900 placeholder-gray-400'
            }`}
            autoFocus
          />
          <button
            onClick={onCancel}
            className={`p-1 rounded hover:${
              isDarkMode ? 'bg-slate-600' : 'bg-gray-200'
            }`}
          >
            <HiX size={18} className={isDarkMode ? 'text-slate-300' : 'text-gray-600'} />
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className={`w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin`}></div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-1 p-2">
        {searchResults.length === 0 && searchQuery && !loading && (
          <p className={`text-center py-8 text-sm ${
            isDarkMode ? 'text-slate-400' : 'text-gray-500'
          }`}>
            No users found
          </p>
        )}
        
        {searchResults.map((user) => (
          <button
            key={user.id}
            onClick={() => onSelectUser(user.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
              isDarkMode
                ? 'hover:bg-slate-700 text-slate-200'
                : 'hover:bg-gray-100 text-gray-900'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ${
              user.avatar_url ? '' : 'bg-gradient-to-br from-cyan-500 to-blue-500'
            }`}>
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user.name}</p>
              <p className={`text-xs truncate ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{user.email}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
