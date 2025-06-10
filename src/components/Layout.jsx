// src/components/Layout.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  HomeIcon,
  DocumentIcon,
  ShareIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, current: true },
    { name: 'My Files', href: '/files', icon: DocumentIcon, current: false },
    { name: 'Shared', href: '/shared', icon: ShareIcon, current: false },
    { name: 'Search', href: '/search', icon: MagnifyingGlassIcon, current: false },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex z-40 lg:hidden"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative flex-1 flex flex-col max-w-xs w-full"
            >
              <Sidebar navigation={navigation} user={user} onLogout={handleLogout} mobile />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <Sidebar navigation={navigation} user={user} onLogout={handleLogout} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top navigation */}
        <div className="relative z-10 flex-shrink-0 flex h-16 glass-card border-0 border-b border-white/20">
          <button
            className="px-4 border-r border-white/20 text-gray-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex">
              <h1 className="text-xl font-semibold text-white">
                Welcome back, {user?.first_name}
              </h1>
            </div>
            
            <div className="ml-4 flex items-center space-x-4">
              {/* User menu */}
              <div className="relative">
                <div className="flex items-center space-x-3 glass-button px-3 py-2">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user?.first_name?.[0]}{user?.last_name?.[0]}
                      </span>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-white">{user?.full_name}</div>
                    <div className="text-xs text-gray-300">{user?.role}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const Sidebar = ({ navigation, user, onLogout, mobile = false }) => {
  return (
    <div className="flex flex-col h-full glass-card border-0 border-r border-white/20">
      {/* Logo */}
      <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-white/20">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3 glow-effect"
        >
          <ShieldCheckIcon className="h-6 w-6 text-white" />
        </motion.div>
        <span className="text-xl font-bold gradient-text">SecureVault</span>
      </div>

      {/* Navigation */}
      <nav className="mt-5 flex-1 flex flex-col divide-y divide-white/10 overflow-y-auto">
        <div className="px-2 space-y-1">
          {navigation.map((item, index) => (
            <motion.a
              key={item.name}
              href={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                group flex items-center px-2 py-2 text-sm font-medium rounded-lg
                ${item.current
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
                } transition-all duration-200
              `}
            >
              <item.icon
                className={`mr-3 flex-shrink-0 h-6 w-6 ${
                  item.current ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-300'
                }`}
              />
              {item.name}
            </motion.a>
          ))}
        </div>
      </nav>

      {/* User section */}
      <div className="flex-shrink-0 flex border-t border-white/20 p-4">
        <div className="flex-shrink-0 w-full group block">
          <div className="flex items-center">
            <div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </span>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-white">{user?.full_name}</p>
              <p className="text-xs text-gray-300">{user?.email}</p>
            </div>
          </div>
          
          <div className="mt-3 space-y-1">
            <button className="glass-button w-full flex items-center px-3 py-2 text-sm text-gray-300 hover:text-white">
              <Cog6ToothIcon className="mr-3 h-5 w-5" />
              Settings
            </button>
            <button
              onClick={onLogout}
              className="glass-button w-full flex items-center px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-red-500/20"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;