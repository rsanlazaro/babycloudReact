// src/context/BillsAuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const BillsAuthContext = createContext();

export const BillsAuthProvider = ({ children }) => {
  const [isBillsAuthenticated, setIsBillsAuthenticated] = useState(() => {
    return sessionStorage.getItem('billsAuth') === 'true';
  });

  const authenticateBills = () => {
    sessionStorage.setItem('billsAuth', 'true'); // Set first
    setIsBillsAuthenticated(true); // Then update state
    return true; // Return success
  };

  const clearBillsAuth = () => {
    sessionStorage.removeItem('billsAuth');
    setIsBillsAuthenticated(false);
  };

  // Clear bills auth when tab/browser closes (sessionStorage handles this automatically)
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.removeItem('billsAuth');
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