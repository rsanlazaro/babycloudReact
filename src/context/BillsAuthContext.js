// src/context/BillsAuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const BillsAuthContext = createContext();

export const BillsAuthProvider = ({ children }) => {
  const [isBillsAuthenticated, setIsBillsAuthenticated] = useState(() => {
    return sessionStorage.getItem('billsAuth') === 'true';
  });

  const authenticateBills = () => {
    sessionStorage.setItem('billsAuth', 'true');
    setIsBillsAuthenticated(true);
    return true;
  };

  const clearBillsAuth = () => {
    sessionStorage.removeItem('billsAuth');
    sessionStorage.removeItem('billsAuthTimestamp');
    setIsBillsAuthenticated(false);
  };

  useEffect(() => {
    // On page load, check if this is a refresh or new session
    const lastTimestamp = sessionStorage.getItem('billsAuthTimestamp');
    const currentTime = Date.now();
    
    if (lastTimestamp) {
      const timeDiff = currentTime - parseInt(lastTimestamp, 10);
      // If more than 3 seconds since last beforeunload, assume window was closed and reopened
      if (timeDiff > 3000) {
        sessionStorage.removeItem('billsAuth');
        sessionStorage.removeItem('billsAuthTimestamp');
        setIsBillsAuthenticated(false);
      }
    }
    
    // Clear the timestamp after checking
    sessionStorage.removeItem('billsAuthTimestamp');

    // Set up beforeunload to store timestamp when page unloads
    const handleBeforeUnload = () => {
      // Store current timestamp - if page reloads quickly, it's a refresh
      sessionStorage.setItem('billsAuthTimestamp', Date.now().toString());
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <BillsAuthContext.Provider value={{ 
      isBillsAuthenticated, 
      authenticateBills, 
      clearBillsAuth 
    }}>
      {children}
    </BillsAuthContext.Provider>
  );
};

export const useBillsAuth = () => {
  const context = useContext(BillsAuthContext);
  if (!context) {
    throw new Error('useBillsAuth must be used within BillsAuthProvider');
  }
  return context;
};