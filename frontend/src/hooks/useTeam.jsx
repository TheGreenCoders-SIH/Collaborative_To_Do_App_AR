import { createContext, useContext, useState, useCallback } from 'react';
import { teams as teamsApi, tasks as tasksApi } from '../utils/api';

const TeamContext = createContext(null);

export const TeamProvider = ({ children }) => {
  const [teams, setTeams] = useState([]);
  const [currentTeam, setCurrentTeam] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await teamsApi.getAll();
      setTeams(data);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTeam = async (teamData) => {
    const { data } = await teamsApi.create(teamData);
    setTeams(prev => [data, ...prev]);
    return data;
  };

  const selectTeam = async (teamId) => {
    setLoading(true);
    try {
      const { data: team } = await teamsApi.getOne(teamId);
      setCurrentTeam(team);
      const { data: taskData } = await tasksApi.getAll(teamId);
      setTasks(taskData);
      return team;
    } catch (error) {
      console.error('Failed to fetch team:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMember = async (teamId, email) => {
    const { data } = await teamsApi.addMember(teamId, email);
    if (currentTeam && currentTeam.id === teamId) {
      setCurrentTeam(prev => ({ ...prev, members: [...prev.members, data.user] }));
    }
    return data;
  };

  const removeMember = async (teamId, userId) => {
    await teamsApi.removeMember(teamId, userId);
    if (currentTeam && currentTeam.id === teamId) {
      setCurrentTeam(prev => ({ ...prev, members: prev.members.filter(m => m.id !== userId) }));
    }
  };

  const createTask = async (teamId, taskData) => {
    const { data } = await tasksApi.create(teamId, taskData);
    setTasks(prev => [data, ...prev]);
    return data;
  };

  const updateTask = async (taskId, taskData) => {
    const { data } = await tasksApi.update(taskId, taskData);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...data } : t));
    return data;
  };

  const updateTaskStatus = async (taskId, status) => {
    const { data } = await tasksApi.updateStatus(taskId, status);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...data } : t));
    return data;
  };

  const deleteTask = async (taskId) => {
    await tasksApi.delete(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const refreshTasks = async () => {
    if (currentTeam) {
      const { data } = await tasksApi.getAll(currentTeam.id);
      setTasks(data);
    }
  };

  return (
    <TeamContext.Provider value={{
      teams,
      currentTeam,
      tasks,
      loading,
      fetchTeams,
      createTeam,
      selectTeam,
      addMember,
      removeMember,
      createTask,
      updateTask,
      updateTaskStatus,
      deleteTask,
      refreshTasks
    }}>
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam must be used within TeamProvider');
  }
  return context;
};