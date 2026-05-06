import { useState, useEffect, useRef } from 'react';
import { activity } from '../utils/api';

export const usePolling = (teamId, interval = 5000) => {
  const [updates, setUpdates] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);

  const fetchUpdates = async () => {
    if (!teamId || !lastUpdate) return;
    
    try {
      const { data } = await activity.getUpdates(teamId, lastUpdate);
      if (data.length > 0) {
        setUpdates(prev => [...data.reverse(), ...prev].slice(0, 50));
        setLastUpdate(new Date().toISOString());
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  };

  useEffect(() => {
    if (teamId) {
      setLastUpdate(new Date().toISOString());
      intervalRef.current = setInterval(fetchUpdates, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [teamId, interval]);

  const clearUpdates = () => setUpdates([]);

  return { updates, clearUpdates };
};