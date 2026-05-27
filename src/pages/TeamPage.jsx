import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTeam } from '../hooks/useTeam';
import { useTheme } from '../context/ThemeContext';
import { tasks as tasksApi, comments as commentsApi, activity } from '../utils/api';
import { usePolling } from '../hooks/usePolling';
import Sidebar from '../components/common/Sidebar';
import TaskCard from '../components/common/TaskCard';
import { Modal, Input } from '../components/common';
import { HiChevronLeft, HiPlus, HiUsers, HiCalendar, HiEye } from 'react-icons/hi';

const statusColumns = [
  { key: 'todo', label: 'To Do', color: 'bg-gradient-to-br from-gray-500/10 to-gray-600/10', borderColor: 'border-gray-500/20' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-gradient-to-br from-blue-500/10 to-blue-600/10', borderColor: 'border-blue-500/20' },
  { key: 'pending_approval', label: 'Pending Approval', color: 'bg-gradient-to-br from-yellow-500/10 to-yellow-600/10', borderColor: 'border-yellow-500/20' },
  { key: 'complete', label: 'Done', color: 'bg-gradient-to-br from-green-500/10 to-green-600/10', borderColor: 'border-green-500/20' }
];

const TeamPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const { teams, currentTeam, tasks, selectTeam, createTask, updateTaskStatus, refreshTasks, addMember, deleteTask } = useTeam();
  const { updates } = usePolling(id);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', deadline: '' });
  const [memberEmail, setMemberEmail] = useState('');
  const [taskComments, setTaskComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(id);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  useEffect(() => {
    if (id) {
      selectTeam(id);
      setSelectedTeam(id);
    }
  }, [id]);

  useEffect(() => {
    if (updates.length > 0) {
      refreshTasks();
    }
  }, [updates]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (isCreatingTask) return;
    setIsCreatingTask(true);
    try {
      await createTask(id, taskForm);
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', deadline: '' });
    } catch (error) {
      alert('Failed to create task');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await addMember(id, memberEmail);
      setShowAddMemberModal(false);
      setMemberEmail('');
      selectTeam(id);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to add member');
    }
  };

  const openTaskDetail = async (task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
    try {
      const { data } = await tasksApi.getOne(task.id);
      setSelectedTask(data);
      const { data: comments } = await commentsApi.getAll(task.id);
      setTaskComments(comments);
    } catch (error) {
      console.error('Failed to load task details');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const { data } = await commentsApi.add(selectedTask.id, newComment);
      setTaskComments([...taskComments, data]);
      setNewComment('');
    } catch (error) {
      alert('Failed to add comment');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId);
        setShowTaskDetail(false);
        setSelectedTask(null);
      } catch (error) {
        alert('Failed to delete task');
      }
    }
  };

  const handleTeamSelect = (teamId) => {
    if (teamId && teamId !== 'dashboard') {
      navigate(`/team/${teamId}`);
      setSelectedTeam(teamId);
    } else {
      navigate('/dashboard');
    }
  };

  if (!currentTeam) {
    return (
      <div className={`flex h-screen items-center justify-center ${isDarkMode ? 'bg-dark-bg' : 'bg-white'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
          <span className={isDarkMode ? 'text-dark-text' : 'text-light-text'}>Loading team...</span>
        </div>
      </div>
    );
  }

  const isCreator = currentTeam.members?.find(m => m.id === user.id)?.role === 'creator';
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
        onCreateTeam={() => setShowTaskModal(true)}
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
                title="Back to Dashboard"
              >
                <HiChevronLeft className={textClass} size={20} />
              </button>
              <div>
                <h1 className={`text-xl md:text-2xl font-bold ${textClass} truncate max-w-[150px] md:max-w-none`}>{currentTeam.name}</h1>
                <p className={`hidden md:block text-sm ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>
                  {currentTeam.description  || 'Team workspace'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTaskModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:shadow-glow transition-all flex items-center gap-2"
              >
                <HiPlus size={18} />
                Add Task
              </button>
              
              {isCreator && (
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className={`px-4 py-2 border ${borderClass} text-primary-500 font-medium rounded-xl hover:${isDarkMode ? 'bg-dark-bg' : 'bg-gray-50'} transition-all flex items-center gap-2`}
                >
                  <HiUsers size={18} />
                  Add Member
                </button>
              )}

              {/* Team Members Preview */}
              <div className="flex items-center gap-2 pl-4 border-l {borderClass}">
                <div className="flex -space-x-2">
                  {currentTeam.members?.slice(0, 4).map(m => (
                    <div
                      key={m.id}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-xs font-medium border-2 border-current"
                      title={m.name}
                    >
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                </div>
                {currentTeam.members?.length > 4 && (
                  <span className={`text-xs font-medium ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>
                    +{currentTeam.members?.length - 4}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Kanban Board */}
        <main className="flex-1 overflow-x-auto p-8">
          <div className="flex gap-6 min-w-max pb-4">
            {statusColumns.map(col => (
              <div
                key={col.key}
                className={`flex-shrink-0 w-80 ${col.color} border-2 ${col.borderColor} rounded-2xl overflow-hidden flex flex-col`}
              >
                {/* Column Header */}
                <div className={`px-6 py-4 border-b ${col.borderColor}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-bold ${textClass} text-sm`}>{col.label}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isDarkMode ? 'bg-dark-bg' : 'bg-gray-200'} ${textClass}`}>
                      {tasks.filter(t => t.status === col.key).length}
                    </span>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {tasks.filter(t => t.status === col.key).length === 0 ? (
                    <div className={`flex items-center justify-center h-24 text-center ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>
                      <p className="text-sm">No tasks yet</p>
                    </div>
                  ) : (
                    tasks.filter(t => t.status === col.key).map(task => (
                      <div key={task.id} onClick={() => openTaskDetail(task)}>
                        <TaskCard task={task} isDarkMode={isDarkMode} />
                      </div>
                    ))
                  )}
                </div>

                {/* Add Task Button */}
                <div className={`p-4 border-t ${col.borderColor}`}>
                  <button
                    onClick={() => setShowTaskModal(true)}
                    className={`w-full py-2 px-4 border-2 border-dashed ${col.borderColor} text-xs font-medium ${isDarkMode ? 'text-dark-textSecondary hover:text-dark-text hover:bg-dark-bg' : 'text-light-textSecondary hover:text-light-text hover:bg-gray-100'} rounded-lg transition-all flex items-center justify-center gap-2`}
                  >
                    <HiPlus size={14} />
                    Add Task
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Create Task Modal */}
      <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title="Create New Task">
        <form onSubmit={handleCreateTask} className="space-y-5">
          <Input
            label="Task Title"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            placeholder="e.g., Implement user authentication"
            required
          />

          <div>
            <label className={`block text-sm font-medium ${textClass} mb-2`}>Description</label>
            <textarea
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              className={`w-full px-4 py-2 rounded-xl border ${borderClass} ${cardClass} ${textClass} min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary-500`}
              placeholder="Add task details..."
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${textClass} mb-2`}>Deadline</label>
            <input
              type="datetime-local"
              value={taskForm.deadline}
              onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
              className={`w-full px-4 py-2 rounded-xl border ${borderClass} ${cardClass} ${textClass} focus:outline-none focus:ring-2 focus:ring-primary-500`}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowTaskModal(false)}
              className={`flex-1 py-2 rounded-xl border ${borderClass} ${textClass} font-medium hover:${isDarkMode ? 'bg-dark-bg' : 'bg-gray-100'} transition-colors`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreatingTask}
              className="flex-1 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingTask ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal isOpen={showAddMemberModal} onClose={() => setShowAddMemberModal(false)} title="Add Team Member">
        <form onSubmit={handleAddMember} className="space-y-5">
          <Input
            label="Member Email"
            type="email"
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
            placeholder="colleague@example.com"
            required
          />

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddMemberModal(false)}
              className={`flex-1 py-2 rounded-xl border ${borderClass} ${textClass} font-medium hover:${isDarkMode ? 'bg-dark-bg' : 'bg-gray-100'} transition-colors`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium hover:shadow-glow transition-all"
            >
              Add Member
            </button>
          </div>
        </form>
      </Modal>

      {/* Task Detail Modal */}
      <Modal isOpen={showTaskDetail} onClose={() => setShowTaskDetail(false)} title={selectedTask?.title || 'Task Details'}>
        {selectedTask && (
          <div className="space-y-6">
            {/* Task Info */}
            <div>
              <h4 className={`text-sm font-semibold ${textClass} mb-2`}>Status</h4>
              <select
                value={selectedTask.status}
                onChange={(e) => handleStatusChange(selectedTask.id, e.target.value)}
                className={`w-full px-4 py-2 rounded-xl border ${borderClass} ${cardClass} ${textClass}`}
              >
                {statusColumns.map(col => (
                  <option key={col.key} value={col.key}>{col.label}</option>
                ))}
              </select>
            </div>

            {selectedTask.description && (
              <div>
                <h4 className={`text-sm font-semibold ${textClass} mb-2`}>Description</h4>
                <p className={`text-sm ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>
                  {selectedTask.description}
                </p>
              </div>
            )}

            {/* Comments Section */}
            <div className="border-t {borderClass} pt-4">
              <h4 className={`text-sm font-semibold ${textClass} mb-3`}>Comments</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {taskComments.length === 0 ? (
                  <p className={`text-sm ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>No comments yet</p>
                ) : (
                  taskComments.map(comment => (
                    <div key={comment.id} className={`p-3 rounded-lg ${isDarkMode ? 'bg-dark-bg' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className={`text-sm font-medium ${textClass}`}>{comment.user_name}</p>
                        <p className={`text-xs ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>
                          {new Date(comment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <p className={`text-sm ${isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>
                        {comment.text}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className={`flex-1 px-4 py-2 rounded-xl border ${borderClass} ${cardClass} ${textClass} focus:outline-none focus:ring-2 focus:ring-primary-500`}
                />
                <button
                  onClick={handleAddComment}
                  className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:shadow-glow transition-all"
                >
                  Add
                </button>
              </div>
            </div>
            
            {/* Delete Task */}
            <div className={`border-t ${borderClass} pt-4 flex justify-end`}>
              <button
                type="button"
                onClick={() => handleDeleteTask(selectedTask.id)}
                className="px-4 py-2 bg-red-500/10 text-red-500 font-medium rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 text-sm"
              >
                Delete Task
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TeamPage;