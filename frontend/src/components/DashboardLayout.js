import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, 
  HeartPulse, 
  Brain, 
  Utensils, 
  User, 
  LogOut, 
  Menu,
  Moon,
  Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Heart Risk', path: '/predict', icon: <HeartPulse size={20} /> },
    { name: 'Stress Analysis', path: '/stress-test', icon: <Brain size={20} /> },
    { name: 'Nutrition Planner', path: '/nutrition', icon: <Utensils size={20} /> },
    { name: 'Profile', path: '/profile', icon: <User size={20} /> }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text)] transition-colors duration-300">
      
      {/* Sidebar */}
      <motion.aside 
        initial={{ width: 250 }}
        animate={{ width: sidebarOpen ? 250 : 80 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        className="h-full bg-[var(--color-sidebar)] border-r border-[var(--color-border)] shadow-sm flex flex-col z-20"
      >
        <div className="flex items-center justify-between p-4 h-16 border-b border-[var(--color-border)]">
          <AnimatePresence mode="wait">
            {sidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="font-bold text-xl tracking-tight text-[var(--color-primary)] whitespace-nowrap"
              >
                HealthPrism
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-[var(--color-text-light)] transition-colors">
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                  ? 'bg-[var(--color-primary)] text-white shadow-md shadow-blue-500/20' 
                  : 'text-[var(--color-text-light)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--color-text)]'
                }`}
              >
                <div className={`${isActive ? 'text-white' : 'text-[var(--color-text-light)]'}`}>
                  {item.icon}
                </div>
                <AnimatePresence mode="wait">
                  {sidebarOpen && (
                    <motion.span 
                      initial={{ opacity: 0, w: 0 }}
                      animate={{ opacity: 1, w: 'auto' }}
                      exit={{ opacity: 0, w: 0 }}
                      className="font-medium whitespace-nowrap"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-[var(--color-border)]">
          <button 
            onClick={logout}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl w-full text-[var(--color-text-light)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors ${!sidebarOpen && 'justify-center'}`}
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="font-medium whitespace-nowrap">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-16 glass-panel border-b border-[var(--color-border)] flex items-center justify-between px-6 z-10 sticky top-0">
          <h1 className="font-semibold text-lg text-[var(--color-text)] hidden sm:block">
            {navItems.find(i => location.pathname === i.path || (i.path !== '/' && location.pathname.startsWith(i.path)))?.name || 'Overview'}
          </h1>
          <div className="flex items-center gap-4 ml-auto">
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[var(--color-text-light)] transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="h-8 w-px bg-[var(--color-border)] mx-1"></div>
            <Link to="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold shadow-sm">
                {user?.fullname?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden md:block text-sm">
                <p className="font-medium text-[var(--color-text)]">{user?.fullname}</p>
                <p className="text-xs text-[var(--color-text-light)]">Pro Plan</p>
              </div>
            </Link>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[var(--color-bg)] p-4 md:p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-[1400px] mx-auto h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
