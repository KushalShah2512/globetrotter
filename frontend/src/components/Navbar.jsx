import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { Compass, Calendar, List, Users, ShieldAlert, User as UserIcon, LogOut, Menu, X, Coins } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { currency, currencies, changeCurrency } = useCurrency();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close side drawer whenever route changes
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  if (!user) return null;

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Compass },
    { path: '/trips', label: 'My Trips', icon: List },
    { path: '/community', label: 'Community', icon: Users },
    { path: '/calendar', label: 'Calendar', icon: Calendar },
    { path: '/profile', label: 'Profile', icon: UserIcon },
  ];

  if (user && user.email === 'admin@globetrotter.com') {
    navItems.push({ path: '/admin', label: 'Admin Panel', icon: ShieldAlert });
  }

  return (
    <>
      <nav className="bg-[#1e1e1e] border-b border-[#2d2d2d] sticky top-0 z-50 px-4 sm:px-6 py-3 flex items-center justify-between shadow-md">
        {/* Left: Mobile Hamburger + Brand Logo */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="md:hidden text-gray-300 hover:text-white p-1.5 rounded-lg hover:bg-[#2d2d2d] transition"
            aria-label="Toggle navigation drawer"
          >
            {drawerOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link to="/" className="flex items-center space-x-2 text-xl sm:text-2xl font-bold tracking-wide text-green-500 hover:text-green-400 transition">
            <span>GlobeTrotter</span>
          </Link>
        </div>

        {/* Center Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-green-600 text-white shadow-md'
                    : 'text-gray-400 hover:bg-[#2d2d2d] hover:text-white'
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right User Controls (Clean Avatar Link) */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <Link to="/profile" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-green-500 overflow-hidden group-hover:border-green-400 transition-all shadow-md">
              <img
                src={user.photoUrl || '/default-avatar.png'}
                alt={user.firstName}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="hidden lg:block text-sm font-medium text-gray-300 group-hover:text-white transition">
              Hi, {user.firstName}
            </span>
          </Link>
        </div>
      </nav>

      {/* Mobile Side Drawer Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden transition-opacity"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile Side Drawer Content */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-72 bg-[#1a1a1a] border-r border-[#2d2d2d] z-50 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col justify-between p-6 shadow-2xl ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-4">
            <Link to="/" onClick={() => setDrawerOpen(false)} className="text-xl font-extrabold text-green-500">
              GlobeTrotter
            </Link>
            <button
              onClick={() => setDrawerOpen(false)}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#252525]"
            >
              <X size={20} />
            </button>
          </div>

          {/* User Info Card in Drawer */}
          <div className="bg-[#252525] border border-[#333] rounded-xl p-3.5 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full border border-green-500 overflow-hidden flex-shrink-0">
              <img
                src={user.photoUrl || '/default-avatar.png'}
                alt={user.firstName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 px-3 mb-1">Navigation</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setDrawerOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-green-600 text-white font-bold shadow-md'
                      : 'text-gray-300 hover:bg-[#252525] hover:text-white'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-white' : 'text-green-500'} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Drawer Footer: Sign Out */}
        <div className="border-t border-[#2d2d2d] pt-4">

          {/* Sign Out Button */}
          <button
            onClick={() => {
              setDrawerOpen(false);
              logout();
            }}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-red-950/20 border border-red-500/20 hover:bg-red-600 text-red-400 hover:text-white rounded-xl text-sm font-semibold transition"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>

      </div>
    </>
  );
};

export default Navbar;
