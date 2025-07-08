// components/LiveDataProvider.js
'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const LiveDataContext = createContext();

export const useLiveData = () => useContext(LiveDataContext);

export const LiveDataProvider = ({ children }) => {
  const [liveMetrics, setLiveMetrics] = useState({
    revenue: 0,
    users: 0,
    conversion: 0,
    lastUpdate: new Date()
  });

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setLiveMetrics(prev => ({
        revenue: prev.revenue + Math.random() * 1000,
        users: prev.users + Math.floor(Math.random() * 10),
        conversion: (Math.random() * 100).toFixed(2),
        lastUpdate: new Date()
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <LiveDataContext.Provider value={liveMetrics}>
      {children}
    </LiveDataContext.Provider>
  );
};