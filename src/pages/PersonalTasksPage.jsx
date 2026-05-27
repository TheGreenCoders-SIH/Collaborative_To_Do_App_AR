import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTeam } from '../hooks/useTeam';
import { useTheme } from '../context/ThemeContext';
import { Button, Input, Modal } from '../components/common';
import Sidebar from '../components/common/Sidebar';
import { HiChevronLeft, HiPlus, HiCheckCircle, HiClock, HiTrash } from 'react-icons/hi';

const PersonalTasksPage = () => {
  const { user } = useAuth();
  const { teams } = useTeam();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Scoped to the logged-in user ID
  const [tasks, setTasks] = useState(() => {
    if (user && user.id) {
      const saved = localStorage.getItem(`personal_tasks_${user.id}`);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('dashboard');

  // Persist tasks in localStorage whenever they change
  useEffect(() => {
    if (user && user.id) {
      localStorage.setItem(`personal_tasks_${user.id}`, JSON.stringify(tasks));
    }
  }, [tasks, user]);

  // Calculate user streak dynamically
  const calculateStreak = (tasksList) => {
    if (!tasksList || tasksList.length === 0) return 0;
    
    // Group tasks by date and check completion status
    const dateCompletion = {};
    tasksList.forEach(t => {
      if (!dateCompletion[t.date]) {
        dateCompletion[t.date] = { total: 0, completed: 0 };
      }
      dateCompletion[t.date].total += 1;
      if (t.completed) {
        dateCompletion[t.date].completed += 1;
      }
    });

    let streakCount = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    while (true) {
      const year = checkDate.getFullYear();
      const month = String(checkDate.getMonth() + 1).padStart(2, '0');
      const day = String(checkDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const dayData = dateCompletion[dateStr];
      if (dayData && dayData.total > 0 && dayData.completed === dayData.total) {
        streakCount++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        if (streakCount === 0) {
          checkDate.setDate(checkDate.getDate() - 1);
          const yesterdayYear = checkDate.getFullYear();
          const yesterdayMonth = String(checkDate.getMonth() + 1).padStart(2, '0');
          const yesterdayDay = String(checkDate.getDate()).padStart(2, '0');
          const yesterdayDateStr = `${yesterdayYear}-${yesterdayMonth}-${yesterdayDay}`;
          const yesterdayData = dateCompletion[yesterdayDateStr];
          if (yesterdayData && yesterdayData.total > 0 && yesterdayData.completed === yesterdayData.total) {
            streakCount++;
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }
        }
        break;
      }
    }
    return streakCount;
  };

  const streak = calculateStreak(tasks);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentDate);

  const getTasksForDate = (day) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dateStr = `${year}-${month}-${String(day).padStart(2, '0')}`;
    return tasks.filter(t => t.date === dateStr);
  };

  const toggleTask = (taskId) => {
    setTasks(tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ));
  };

  const addTask = () => {
    if (!newTaskTitle.trim() || !selectedDate) return;
    const newTask = {
      id: Date.now(),
      date: selectedDate,
      title: newTaskTitle,
      completed: false
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    setShowAddModal(false);
  };

  const deletePersonalTask = (taskId) => {
    if (window.confirm('Delete this task?')) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  const selectedDateTasks = selectedDate ? getTasksForDate(parseInt(selectedDate.split('-')[2])) : [];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleTeamSelect = (teamId) => {
    if (teamId && teamId !== 'dashboard') {
      navigate(`/team/${teamId}`);
      setSelectedTeam(teamId);
    } else {
      navigate('/dashboard');
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
                onClick={() => navigate('/dashboard')}
                className={`hidden md:block p-2 hover:${isDarkMode ? 'bg-dark-bg' : 'bg-gray-100'} rounded-lg transition-colors`}
              >
                <HiChevronLeft className={textClass} size={20} />
              </button>
              <div>
                <h1 className={`text-xl md:text-2xl font-bold ${textClass}`}>Personal Tasks</h1>
                <p className={`hidden md:block text-sm ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>
                  Your daily goals and tasks
                </p>
              </div>
            </div>

            {/* Streak Badge */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isDarkMode ? 'bg-orange-500/10' : 'bg-orange-50'}`}>
              <span className="text-2xl">🔥</span>
              <div>
                <p className={`font-bold text-orange-500`}>{streak} day</p>
                <p className={`text-xs ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>streak</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calendar */}
            <div className={`lg:col-span-2 ${cardClass} rounded-xl border ${borderClass} p-6`}>
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold ${textClass}`}>
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                    className={`px-3 py-1 rounded-lg border ${borderClass} hover:${isDarkMode ? 'bg-dark-bg' : 'bg-gray-50'}`}
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                    className={`px-3 py-1 rounded-lg border ${borderClass} hover:${isDarkMode ? 'bg-dark-bg' : 'bg-gray-50'}`}
                  >
                    →
                  </button>
                </div>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {dayNames.map(day => (
                  <div key={day} className={`text-center text-sm font-semibold ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'} py-2`}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`}></div>
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayTasks = getTasksForDate(day);
                  const dayCompleted = dayTasks.filter(t => t.completed).length;
                  const hasCompletedAll = dayTasks.length > 0 && dayCompleted === dayTasks.length;
                  
                  const year = currentDate.getFullYear();
                  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                  const dateStr = `${year}-${month}-${String(day).padStart(2, '0')}`;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`aspect-square p-2 rounded-lg border-2 relative transition-all ${
                        selectedDate === dateStr
                          ? 'border-primary-500'
                          : borderClass
                      } ${
                        hasCompletedAll
                          ? isDarkMode
                            ? 'bg-green-500/10'
                            : 'bg-green-50'
                          : isDarkMode
                          ? 'hover:bg-dark-bg'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`text-sm font-semibold ${textClass}`}>{day}</div>
                      {dayTasks.length > 0 && (
                        <div className="mt-1 text-xs">
                          {hasCompletedAll ? (
                            <span className="text-green-500 font-bold">✓</span>
                          ) : dayCompleted > 0 ? (
                            <span className={isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'}>
                              {dayCompleted}/{dayTasks.length}
                            </span>
                          ) : (
                            <span className="text-orange-500">●</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Stats */}
              <div className={`mt-6 pt-6 border-t ${borderClass} grid grid-cols-3 gap-4`}>
                <div>
                  <p className={`text-2xl font-bold text-green-500`}>{tasks.filter(t => t.completed).length}</p>
                  <p className={`text-sm ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>Completed</p>
                </div>
                <div>
                  <p className={`text-2xl font-bold text-yellow-500`}>{tasks.filter(t => !t.completed).length}</p>
                  <p className={`text-sm ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>Pending</p>
                </div>
                <div>
                  <p className={`text-2xl font-bold text-primary-500`}>{tasks.length}</p>
                  <p className={`text-sm ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>Total</p>
                </div>
              </div>
            </div>

            {/* Task List for Selected Date */}
            <div className={`${cardClass} rounded-xl border ${borderClass} p-6 h-fit`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-bold ${textClass}`}>
                  {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  }) : 'Select a date'}
                </h3>
                {selectedDate && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    <HiPlus size={18} />
                  </button>
                )}
              </div>

              {selectedDate ? (
                <div className="space-y-2">
                  {selectedDateTasks.length === 0 ? (
                    <div className={`text-center py-8 ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>
                      <p className="text-sm">No tasks for this day</p>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="mt-3 text-primary-500 text-sm font-medium hover:text-primary-600"
                      >
                        Add one →
                      </button>
                    </div>
                  ) : (
                    selectedDateTasks.map(task => (
                      <div
                        key={task.id}
                        className={`p-3 rounded-lg border ${borderClass} flex items-center gap-3 hover:shadow-soft transition-all cursor-pointer ${
                          task.completed ? `${isDarkMode ? 'bg-dark-bg' : 'bg-gray-50'}` : ''
                        }`}
                        onClick={() => toggleTask(task.id)}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            task.completed
                              ? 'border-green-500 bg-green-500'
                              : borderClass
                          }`}
                        >
                          {task.completed && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className={`flex-1 text-sm ${task.completed ? 'line-through' : ''} ${textClass}`}>
                          {task.title}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePersonalTask(task.id);
                          }}
                          className="text-red-500 hover:text-red-600 p-1 rounded-lg transition-colors"
                          title="Delete Task"
                        >
                          <HiTrash size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <p className={`text-center py-8 ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>
                  Select a date to view tasks
                </p>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Add Task Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Task">
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${textClass} mb-2`}>
              Date: {selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Not selected'}
            </label>
          </div>
          <Input
            label="Task Title"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="e.g., Morning Exercise"
            onKeyPress={(e) => e.key === 'Enter' && addTask()}
          />
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowAddModal(false)}
              className={`flex-1 py-2 rounded-xl border ${borderClass} ${textClass} font-medium hover:${isDarkMode ? 'bg-dark-bg' : 'bg-gray-100'} transition-colors`}
            >
              Cancel
            </button>
            <button
              onClick={addTask}
              className="flex-1 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium hover:shadow-glow transition-all"
            >
              Add Task
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PersonalTasksPage;
