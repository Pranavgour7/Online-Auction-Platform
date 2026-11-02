import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Determine initial theme based on saved preference or local time
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('auctionhub_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return { mode: savedTheme, isAuto: false };
    }
    
    // Auto detection based on current time (Dark mode between 7 PM (19:00) and 6 AM (06:00))
    const currentHour = new Date().getHours();
    const isNight = currentHour >= 19 || currentHour < 6;
    return { mode: isNight ? 'dark' : 'light', isAuto: true };
  };

  const initial = getInitialTheme();
  const [theme, setTheme] = useState(initial.mode);
  const [isAuto, setIsAuto] = useState(initial.isAuto);

  // Apply theme to html root attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Check periodically (every minute) if auto mode is enabled to transition at sunrise/sunset
  useEffect(() => {
    if (!isAuto) return;

    const interval = setInterval(() => {
      const currentHour = new Date().getHours();
      const isNight = currentHour >= 19 || currentHour < 6;
      const expectedMode = isNight ? 'dark' : 'light';
      if (expectedMode !== theme) {
        setTheme(expectedMode);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isAuto, theme]);

  // Toggle theme manually
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    setIsAuto(false);
    localStorage.setItem('auctionhub_theme', nextTheme);
  };

  // Reset to auto timing mode
  const resetToAutoTiming = () => {
    localStorage.removeItem('auctionhub_theme');
    setIsAuto(true);
    const currentHour = new Date().getHours();
    const isNight = currentHour >= 19 || currentHour < 6;
    setTheme(isNight ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, isAuto, toggleTheme, resetToAutoTiming }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
