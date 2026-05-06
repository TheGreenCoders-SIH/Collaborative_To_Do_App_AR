import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTeam } from '../hooks/useTeam';
import { useTheme } from '../context/ThemeContext';
import { Button, Input, Modal, Card } from '../components/common';
import Sidebar from '../components/common/Sidebar';
import EditProfileModal from '../components/messaging/EditProfileModal';
import { HiPlus, HiChevronRight, HiCalendar, HiUsers } from 'react-icons/hi';

const DashboardPage = () => {
  const { user } = useAuth();
  const { teams, loading, fetchTeams, createTeam } = useTeam();
  const { isDarkMode } = useTheme();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [approvalRule, setApprovalRule] = useState('creator_only');
  const [selectedTeam, setSelectedTeam] = useState('dashboard');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const team = await createTeam({ name: newTeamName, description: newTeamDesc, approval_rule: approvalRule });
      setShowCreateModal(false);
      setNewTeamName('');
      setNewTeamDesc('');
      navigate(`/team/${team.id}`);
    } catch (error) {
      alert('Failed to create team');
    }
  };

  const handleTeamSelect = (teamId) => {
    if (teamId && teamId !== 'dashboard') {
      navigate(`/team/${teamId}`);
    } else {
      setSelectedTeam('dashboard');
    }
  };

  const bgClass = isDarkMode ? 'bg-dark-bg' : 'bg-white';
  const textClass = isDarkMode ? 'text-dark-text' : 'text-light-text';
  const cardClass = isDarkMode ? 'bg-dark-card' : 'bg-light-card';
  const borderClass = isDarkMode ? 'border-dark-border' : 'border-light-border';

  return (
    <div className={`flex h-screen ${bgClass}`}>
      {/* Sidebar */}
      <Sidebar
        teams={teams}
        selectedTeam={selectedTeam}
        onTeamSelect={handleTeamSelect}
        onCreateTeam={() => setShowCreateModal(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className={`border-b ${borderClass} ${cardClass} sticky top-0 z-40`}>
          <div className="px-4 md:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                className="md:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800"
                onClick={() => setIsSidebarOpen(true)}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className={`text-xl md:text-2xl font-bold ${textClass}`}>Dashboard</h1>
                <p className={`hidden md:block text-sm ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>
                  Welcome back, {user?.name}
                </p>
              </div>
            </div>

            {/* User Profile */}
            <div 
              className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setShowEditProfile(true)}
              title="Edit Profile"
            >
              <div className="flex items-center gap-3">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full items-center justify-center text-white font-medium text-sm"
                  style={{ display: user?.avatar_url ? 'none' : 'flex' }}
                >
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className={`text-sm font-medium ${textClass}`}>{user?.name}</p>
                  <p className={`text-xs ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          {/* Stats Section */}
          <div className="grid grid-cols-3 gap-3 md:gap-6 mb-8 md:mb-12">
            {/* Total Teams */}
            <div className={`${cardClass} rounded-xl p-3 md:p-6 border ${borderClass} hover:shadow-soft transition-all flex flex-col justify-center`}>
              <div className="flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <p className={`text-xs md:text-sm ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'} mb-0.5 md:mb-1 truncate`}>
                    Total Teams
                  </p>
                  <p className={`text-lg md:text-3xl font-bold ${textClass}`}>{teams.length}</p>
                </div>
                <div className="w-8 h-8 md:w-12 md:h-12 flex-shrink-0 bg-primary-500/10 rounded-lg md:rounded-xl flex items-center justify-center">
                  <HiUsers className="text-primary-500 w-4 h-4 md:w-6 md:h-6" />
                </div>
              </div>
            </div>

            {/* Active Projects */}
            <div className={`${cardClass} rounded-xl p-3 md:p-6 border ${borderClass} hover:shadow-soft transition-all flex flex-col justify-center`}>
              <div className="flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <p className={`text-xs md:text-sm ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'} mb-0.5 md:mb-1 truncate`}>
                    Active Projects
                  </p>
                  <p className={`text-lg md:text-3xl font-bold ${textClass}`}>{teams.filter(t => !t.archived).length}</p>
                </div>
                <div className="w-8 h-8 md:w-12 md:h-12 flex-shrink-0 bg-accent-500/10 rounded-lg md:rounded-xl flex items-center justify-center">
                  <svg className="text-accent-500 w-4 h-4 md:w-6 md:h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 2H3v7h6V2zM9 11H3v7h6v-7zM18 2h-6v7h6V2zM18 11h-6v7h6v-7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Pending Tasks */}
            <div className={`${cardClass} rounded-xl p-3 md:p-6 border ${borderClass} hover:shadow-soft transition-all flex flex-col justify-center`}>
              <div className="flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <p className={`text-xs md:text-sm ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'} mb-0.5 md:mb-1 truncate`}>
                    In Progress
                  </p>
                  <p className={`text-lg md:text-3xl font-bold ${textClass}`}>0</p>
                </div>
                <div className="w-8 h-8 md:w-12 md:h-12 flex-shrink-0 bg-yellow-500/10 rounded-lg md:rounded-xl flex items-center justify-center">
                  <HiCalendar className="text-yellow-500 w-4 h-4 md:w-6 md:h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Teams Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className={`text-xl font-bold ${textClass}`}>Your Teams</h2>
                <p className={`text-sm ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>
                  {teams.length} team{teams.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
                <HiPlus size={18} />
                New Team
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
              </div>
            ) : teams.length === 0 ? (
              <div className={`${cardClass} rounded-xl p-12 text-center border-2 border-dashed ${borderClass}`}>
                <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HiUsers className="text-primary-500" size={32} />
                </div>
                <h3 className={`text-lg font-semibold ${textClass} mb-2`}>No teams yet</h3>
                <p className={`${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'} mb-6`}>
                  Create your first team to start collaborating with your team members
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <HiPlus size={18} className="mr-2" />
                  Create Your First Team
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team) => (
                  <Link
                    key={team.id}
                    to={`/team/${team.id}`}
                    className={`${cardClass} rounded-xl p-6 border ${borderClass} hover:shadow-soft hover:border-primary-500/50 transition-all group cursor-pointer`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-400/20 to-accent-400/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        team.approval_rule === 'creator_only'
                          ? 'bg-primary-500/10 text-primary-500'
                          : 'bg-accent-500/10 text-accent-500'
                      }`}>
                        {team.approval_rule === 'creator_only' ? 'Creator' : 'Shared'}
                      </span>
                    </div>
                    <h3 className={`text-lg font-semibold ${textClass} mb-2 group-hover:text-primary-500 transition-colors flex items-center justify-between`}>
                      {team.name}
                      <HiChevronRight className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    {team.description && (
                      <p className={`text-sm line-clamp-2 mb-4 ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>
                        {team.description}
                      </p>
                    )}
                    <div className={`pt-4 border-t ${borderClass} flex items-center justify-between text-sm ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>
                      <span className="flex items-center gap-1">
                        <HiUsers size={16} />
                        {team.members_count || 1} members
                      </span>
                      <span>Created {new Date(team.created_at).toLocaleDateString()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Team Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Team"
      >
        <form onSubmit={handleCreateTeam} className="space-y-5">
          <Input
            label="Team Name"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="e.g., Engineering Team"
            required
          />

          <div>
            <label className={`block text-sm font-medium mb-1.5 ${
              isDarkMode ? 'text-slate-300' : 'text-gray-700'
            }`}>
              Description (optional)
            </label>
            <textarea
              value={newTeamDesc}
              onChange={(e) => setNewTeamDesc(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-lg border transition-all focus:outline-none focus:ring-2 min-h-[100px] ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
              }`}
              placeholder="What's this team about?"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1.5 ${
              isDarkMode ? 'text-slate-300' : 'text-gray-700'
            }`}>
              Approval Rule
            </label>
            <select
              value={approvalRule}
              onChange={(e) => setApprovalRule(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500 focus:ring-cyan-500/20'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20'
              }`}
            >
              <option value="creator_only">Creator Approval Only</option>
              <option value="all_must_approve">All Members Must Approve</option>
            </select>
            <p className={`mt-1.5 text-xs ${
              isDarkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>
              {approvalRule === 'creator_only'
                ? 'Only the team creator can approve tasks to be completed'
                : 'All team members must approve tasks before completion'}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
            >
              Create Team
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Profile Modal */}
      <EditProfileModal isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} />
    </div>
  );
};

export default DashboardPage;