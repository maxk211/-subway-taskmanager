import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  BuildingStorefrontIcon,
  UsersIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

const Layout = ({ children }) => {
  const { user, logout, isAdmin, isManager } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon, roles: ['admin', 'manager'] },
    { name: 'Meine Aufgaben', href: '/tasks', icon: ClipboardDocumentListIcon, roles: ['admin', 'manager', 'employee'] },
    { name: 'Mitarbeiter', href: '/employees', icon: UsersIcon, roles: ['admin', 'manager'] },
    { name: 'Reports', href: '/reports', icon: DocumentArrowDownIcon, roles: ['admin', 'manager'] },
  ];

  const filteredNavigation = navigation.filter(item =>
    item.roles.includes(user?.role)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-subway-green shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-white">
                  SUBWAY
                </span>
                <span className="ml-2 text-sm text-subway-yellow font-semibold">
                  Taskmanager
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-white text-sm">
                <div className="font-semibold">{user?.full_name}</div>
                <div className="text-xs text-subway-yellow">{user?.store_name || 'Alle Stores'}</div>
              </div>
              <button
                onClick={handleLogout}
                className="text-white hover:text-subway-yellow transition-colors"
                title="Abmelden"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Navigation */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-subway-green text-subway-green'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-2" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
