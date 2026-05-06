import React from 'react';
import { HiCalendar, HiUsers, HiEye } from 'react-icons/hi';

export default function TaskCard({ task, onClick, isDarkMode }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'to_do':
        return { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-500' };
      case 'in_progress':
        return { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-500' };
      case 'pending_approval':
        return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-500' };
      case 'done':
        return { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-500' };
      default:
        return { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-500' };
    }
  };

  const statusColor = getStatusColor(task.status);
  const textClass = isDarkMode ? 'text-dark-text' : 'text-light-text';
  const secondaryTextClass = isDarkMode ? 'text-dark-textSecondary' : 'text-light-textSecondary';
  const cardBg = isDarkMode ? 'bg-dark-card' : 'bg-white';
  const borderClass = isDarkMode ? 'border-dark-border' : 'border-light-border';

  const progressPercentage = task.completed_subtasks && task.total_subtasks 
    ? Math.round((task.completed_subtasks / task.total_subtasks) * 100)
    : 0;

  const dueDate = task.due_date ? new Date(task.due_date) : null;
  const isOverdue = dueDate && dueDate < new Date() && task.status !== 'done';
  const dueDateStr = dueDate ? dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;

  return (
    <div
      onClick={onClick}
      className={`${cardBg} border ${borderClass} rounded-xl p-4 hover:shadow-soft transition-all cursor-pointer group`}
    >
      {/* Title */}
      <h4 className={`font-semibold ${textClass} mb-3 line-clamp-2 group-hover:text-primary-500`}>
        {task.title}
      </h4>

      {/* Description */}
      {task.description && (
        <p className={`text-sm ${secondaryTextClass} line-clamp-2 mb-3`}>
          {task.description}
        </p>
      )}

      {/* Progress Bar */}
      {task.total_subtasks > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs ${secondaryTextClass}`}>Progress</span>
            <span className={`text-xs font-medium ${statusColor.text}`}>
              {task.completed_subtasks}/{task.total_subtasks}
            </span>
          </div>
          <div className={`w-full h-2 bg-gray-300 rounded-full overflow-hidden ${isDarkMode ? 'bg-dark-bg' : 'bg-gray-100'}`}>
            <div
              className="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="space-y-2 mb-3">
        {/* Due Date */}
        {dueDate && (
          <div className="flex items-center gap-2 text-xs">
            <HiCalendar className={isOverdue ? 'text-red-500' : secondaryTextClass} size={14} />
            <span className={isOverdue ? 'text-red-500 font-medium' : secondaryTextClass}>
              {dueDateStr}
            </span>
          </div>
        )}

        {/* Assigned Users */}
        {task.assigned_users && task.assigned_users.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {task.assigned_users.slice(0, 3).map((user) => (
                <div
                  key={user.id}
                  className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-xs font-medium border-2 border-current"
                  title={user.name}
                >
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            {task.assigned_users.length > 3 && (
              <span className={`text-xs ${secondaryTextClass}`}>
                +{task.assigned_users.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Priority/Status Badge */}
      <div className="flex items-center justify-between">
        <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusColor.bg} ${statusColor.text} border ${statusColor.border}`}>
          {task.status?.replace('_', ' ').toUpperCase()}
        </span>
        {task.priority && (
          <span className={`text-xs font-medium px-2 py-1 rounded-md ${
            task.priority === 'high' ? 'bg-red-500/10 text-red-500' :
            task.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
            'bg-blue-500/10 text-blue-500'
          }`}>
            {task.priority.toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
}
