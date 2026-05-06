import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useTeam } from '../hooks/useTeam';
import { activity } from '../utils/api';
import Sidebar from '../components/common/Sidebar';
import { HiChevronLeft, HiTrendingUp, HiCheckCircle, HiClock } from 'react-icons/hi';

const MetricsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { teams } = useTeam();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(id);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data } = await activity.getMetrics(id);
        setMetrics(data);
      } catch (error) {
        console.error('Failed to load metrics');
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [id]);

  const handleTeamSelect = (teamId) => {
    if (teamId && teamId !== 'dashboard') {
      navigate(`/metrics/${teamId}`);
      setSelectedTeam(teamId);
    } else {
      navigate('/dashboard');
    }
  };

  const bgClass = isDarkMode ? 'bg-dark-bg' : 'bg-white';
  const textClass = isDarkMode ? 'text-dark-text' : 'text-light-text';
  const cardClass = isDarkMode ? 'bg-dark-card' : 'bg-light-card';
  const borderClass = isDarkMode ? 'border-dark-border' : 'border-light-border';
  const statsBgClass = isDarkMode ? 'bg-gradient-to-br from-dark-bg to-dark-card' : 'bg-gradient-to-br from-gray-50 to-white';

  const { user_metrics = [], team_stats = {}, approval_stats = {} } = metrics || {};

  return (
    <div className={`flex h-screen ${bgClass}`}>
      {/* Sidebar */}
      <Sidebar
        teams={teams}
        selectedTeam={selectedTeam}
        onTeamSelect={handleTeamSelect}
        onCreateTeam={() => {}}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className={`border-b ${borderClass} ${cardClass} sticky top-0 z-40`}>
          <div className="px-4 md:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <button 
                className="md:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800"
                onClick={() => setIsSidebarOpen(true)}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => navigate(-1)}
                className={`hidden md:block p-2 hover:${isDarkMode ? 'bg-dark-bg' : 'bg-gray-100'} rounded-lg transition-colors`}
              >
                <HiChevronLeft className={textClass} size={20} />
              </button>
              <div>
                <h1 className={`text-xl md:text-2xl font-bold ${textClass}`}>Team Metrics</h1>
                <p className={`hidden md:block text-sm ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>
                  Performance and analytics
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-lg"
>
              <HiTrendingUp className="text-green-500" size={20} />
              <span className={`text-sm font-medium ${textClass}`}>
                {team_stats?.completed_tasks || 0} tasks completed
              </span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Total Tasks */}
                <div className={`${cardClass} rounded-xl p-6 border ${borderClass} hover:shadow-soft transition-all`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'} mb-1`}>
                        Total Tasks
                      </p>
                      <p className={`text-3xl font-bold ${textClass}`}>{team_stats?.total_tasks || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
                      <HiClock className="text-primary-500" size={24} />
                    </div>
                  </div>
                </div>

                {/* Completed Tasks */}
                <div className={`${cardClass} rounded-xl p-6 border ${borderClass} hover:shadow-soft transition-all`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'} mb-1`}>
                        Completed
                      </p>
                      <p className={`text-3xl font-bold text-green-500`}>{team_stats?.completed_tasks || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                      <HiCheckCircle className="text-green-500" size={24} />
                    </div>
                  </div>
                </div>

                {/* In Progress */}
                <div className={`${cardClass} rounded-xl p-6 border ${borderClass} hover:shadow-soft transition-all`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'} mb-1`}>
                        In Progress
                      </p>
                      <p className={`text-3xl font-bold text-blue-500`}>{team_stats?.in_progress_tasks || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                      <HiClock className="text-blue-500" size={24} />
                    </div>
                  </div>
                </div>

                {/* Pending Approval */}
                <div className={`${cardClass} rounded-xl p-6 border ${borderClass} hover:shadow-soft transition-all`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'} mb-1`}>
                        Pending Approval
                      </p>
                      <p className={`text-3xl font-bold text-yellow-500`}>{team_stats?.pending_approval_tasks || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                      <HiClock className="text-yellow-500" size={24} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Leaderboard */}
              <div className={`${cardClass} rounded-xl border ${borderClass} overflow-hidden`}>
                <div className={`px-6 py-4 border-b ${borderClass}`}>
                  <h2 className={`text-lg font-bold ${textClass}`}>Team Leaderboard</h2>
                  <p className={`text-sm ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>
                    Top performers by tasks completed
                  </p>
                </div>

                <div className="overflow-y-auto max-h-80">
                  {user_metrics.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className={isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'}>
                        No metrics available yet
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-opacity-10">
                      {user_metrics.map((user, index) => (
                        <div
                          key={user.id}
                          className={`px-6 py-4 flex items-center gap-4 hover:${isDarkMode ? 'bg-dark-bg' : 'bg-gray-50'} transition-colors`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                              index === 0
                                ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                                : index === 1
                                ? 'bg-gradient-to-br from-gray-400 to-gray-600'
                                : index === 2
                                ? 'bg-gradient-to-br from-orange-400 to-orange-600'
                                : 'bg-gradient-to-br from-primary-400 to-primary-600'
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium ${textClass}`}>{user.name}</p>
                            <p className={`text-xs ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>
                              {user.email}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary-500">
                              {user.tasks_completed || 0}
                            </p>
                            <p className={`text-xs ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>
                              completed
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Approval Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Approval Stats Card */}
                <div className={`${cardClass} rounded-xl border ${borderClass} p-6`}>
                  <h3 className={`text-lg font-bold ${textClass} mb-6`}>Approval Stats</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-sm ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>
                          Total Approved
                        </p>
                        <p className="font-bold text-green-500">{approval_stats?.total_approved || 0}</p>
                      </div>
                      <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-dark-bg' : 'bg-gray-200'}`}>
                        <div
                          className="h-full bg-gradient-to-r from-green-400 to-green-600"
                          style={{
                            width: `${
                              ((approval_stats?.total_approved || 0) /
                                ((approval_stats?.total_approved || 0) +
                                  (approval_stats?.total_rejected || 0))) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-sm ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>
                          Total Rejected
                        </p>
                        <p className="font-bold text-red-500">{approval_stats?.total_rejected || 0}</p>
                      </div>
                      <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-dark-bg' : 'bg-gray-200'}`}>
                        <div
                          className="h-full bg-gradient-to-r from-red-400 to-red-600"
                          style={{
                            width: `${
                              ((approval_stats?.total_rejected || 0) /
                                ((approval_stats?.total_approved || 0) +
                                  (approval_stats?.total_rejected || 0))) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className={`pt-4 border-t ${borderClass}`}>
                      <p className={`text-sm ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'} mb-2`}>
                        Success Rate
                      </p>
                      <p className={`text-2xl font-bold text-primary-500`}>
                        {approval_stats?.total_approved || approval_stats?.total_rejected
                          ? Math.round(
                              ((approval_stats?.total_approved || 0) /
                                ((approval_stats?.total_approved || 0) +
                                  (approval_stats?.total_rejected || 0))) *
                                100
                            )
                          : 0}
                        %
                      </p>
                    </div>
                  </div>
                </div>

                {/* Completion Rate Card */}
                <div className={`${cardClass} rounded-xl border ${borderClass} p-6`}>
                  <h3 className={`text-lg font-bold ${textClass} mb-6`}>Completion Rate</h3>
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="relative w-32 h-32 flex items-center justify-center mb-6">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke={isDarkMode ? '#3A3A3E' : '#E5E5E5'}
                          strokeWidth="8"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke="url(#grad)"
                          strokeWidth="8"
                          strokeDasharray={`${
                            ((team_stats?.completed_tasks || 0) / (team_stats?.total_tasks || 1)) *
                            100 *
                            3.14
                          } 314`}
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#2D7FFD" />
                            <stop offset="100%" stopColor="#357BF1" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute text-center">
                        <p className={`text-3xl font-bold ${textClass}`}>
                          {team_stats?.total_tasks
                            ? Math.round(
                                ((team_stats?.completed_tasks || 0) / team_stats?.total_tasks) *
                                  100
                              )
                            : 0}
                          %
                        </p>
                      </div>
                    </div>
                    <p className={`text-center ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>
                      {team_stats?.completed_tasks || 0} of {team_stats?.total_tasks || 0} tasks completed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MetricsPage;
             