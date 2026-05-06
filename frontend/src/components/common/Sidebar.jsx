import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { HiBriefcase, HiChat, HiChevronDown, HiChevronRight, HiMoon, HiSun, HiLogout, HiSearch, HiX } from 'react-icons/hi';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import brandingImage from '../../pages/RA_branding.png';

export default function Sidebar({ teams, selectedTeam, onTeamSelect, onCreateTeam, isOpen, onClose }) {
  const { isDarkMode, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [expandedTeams, setExpandedTeams] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const bgClass = isDarkMode ? 'bg-dark-card border-dark-border' : 'bg-light-card border-light-border';
  const textClass = isDarkMode ? 'text-dark-text' : 'text-light-text';
  const secondaryTextClass = isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <div className={`
        fixed md:static inset-y-0 left-0 z-50 flex flex-col h-screen overflow-y-auto
        transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out
        w-72 ${bgClass} border-r ${isDarkMode ? 'border-dark-border bg-dark-card' : 'border-light-border bg-white'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-opacity-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img src={brandingImage} alt="RA Branding" className="w-10 h-10 rounded-xl shadow-glow" />
              <div>
                <h1 className={`text-lg font-bold ${textClass}`}>TaskFlow</h1>
                <p className={`text-xs ${secondaryTextClass}`}>Collabrative ToDo</p>
              </div>
            </div>
            {/* Mobile Close Button */}
            <button className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800" onClick={onClose}>
              <HiX size={20} />
            </button>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDarkMode ? 'bg-dark-bg' : 'bg-light-bg'}`}>
            <HiSearch className={`${secondaryTextClass}`} />
            <input
              type="text"
              placeholder="Search projects..."
              className={`bg-transparent outline-none text-sm w-full ${textClass} placeholder-opacity-60 placeholder-gray-400`}
            />
          </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-2">
          <div 
            className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all ${
              location.pathname === '/dashboard'
                ? 'bg-primary-500 text-white'
                : `${textClass} hover:${isDarkMode ? 'bg-dark-bg' : 'bg-gray-100'}`
            }`}
            onClick={() => onTeamSelect('dashboard')}
          >
            <HiBriefcase size={20} />
            <span className="font-medium">Dashboard</span>
          </div>

           <div 
             onClick={() => navigate('/personal')}
             className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all ${
               location.pathname === '/personal'
                 ? 'bg-primary-500 text-white'
                 : `${textClass} ${isDarkMode ? 'hover:bg-dark-bg' : 'hover:bg-gray-100'}`
             }`}
           >
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9a2 2 0 012-2z" />
             </svg>
             <span className="font-medium">Personal Tasks</span>
           </div>

           <div 
             onClick={() => navigate('/messages')}
             className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all ${
               location.pathname === '/messages'
                 ? 'bg-primary-500 text-white'
                 : `${textClass} ${isDarkMode ? 'hover:bg-dark-bg' : 'hover:bg-gray-100'}`
             }`}
           >
             <HiChat size={20} />
             <span className="font-medium">Messages</span>
           </div>
         </div>

        {/* Teams Section */}
        <div className="mt-6">
          <div className="px-4 py-3">
            <button
              onClick={() => setExpandedTeams(!expandedTeams)}
              className={`flex items-center justify-between w-full font-semibold ${secondaryTextClass} hover:${textClass} transition-colors`}
            >
              <span className="flex items-center gap-2">
                TEAMS ({teams.length})
              </span>
              {expandedTeams ? <HiChevronDown size={16} /> : <HiChevronRight size={16} />}
            </button>
          </div>

          {expandedTeams && (
            <div className="px-2 space-y-1">
              {teams && teams.length > 0 ? (
                teams.map((team) => (
                  <div
                    key={team.id}
                    onClick={() => onTeamSelect(team.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      String(selectedTeam) === String(team.id)
                        ? 'bg-primary-500 text-white'
                        : `${textClass} ${isDarkMode ? 'hover:bg-dark-bg' : 'hover:bg-gray-100'}`
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${selectedTeam === team.id ? 'bg-white' : 'bg-primary-400'}`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{team.name}</p>
                        <p className={`text-xs ${selectedTeam === team.id ? 'text-white opacity-80' : secondaryTextClass}`}>
                          {team.members_count || 1} members
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className={`text-sm ${secondaryTextClass} px-3 py-2`}>No teams yet</p>
              )}

              <button
                onClick={onCreateTeam}
                className={`w-full p-3 rounded-lg border-2 border-dashed transition-all ${
                  isDarkMode
                    ? 'border-dark-border hover:border-primary-400 hover:bg-dark-bg'
                    : 'border-light-border hover:border-primary-400 hover:bg-gray-50'
                } ${secondaryTextClass} hover:text-primary-500 font-medium text-sm`}
              >
                + New Team
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className={`p-4 border-t ${isDarkMode ? 'border-dark-border' : 'border-light-border'} space-y-2`}>
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
            isDarkMode ? 'hover:bg-dark-bg' : 'hover:bg-gray-100'
          } ${textClass}`}
        >
          {isDarkMode ? <HiSun size={18} /> : <HiMoon size={18} />}
          <span className="text-sm font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20`}
        >
          <HiLogout size={18} />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
      </div>
    </>
  );
}
