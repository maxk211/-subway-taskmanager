import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { format, subDays } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  BuildingStorefrontIcon,
  UserIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const { user, isAdmin, isManager } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start_date: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd')
  });
  const [selectedStore, setSelectedStore] = useState('');
  const [stores, setStores] = useState([]);

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    loadStats();
  }, [dateRange, selectedStore]);

  const loadStores = async () => {
    try {
      const response = await api.get('/stores');
      setStores(response.data);
    } catch (error) {
      toast.error('Fehler beim Laden der Stores');
    }
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const params = { ...dateRange };
      if (selectedStore) params.store_id = selectedStore;

      const response = await api.get('/tasks/stats/dashboard', { params });
      setStats(response.data);
    } catch (error) {
      toast.error('Fehler beim Laden der Statistiken');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-subway-green"></div>
      </div>
    );
  }

  const completionRate = stats?.totalStats?.total_tasks > 0
    ? Math.round((stats.totalStats.completed_tasks / stats.totalStats.total_tasks) * 100)
    : 0;

  const pieData = [
    { name: 'Erledigt', value: stats?.totalStats?.completed_tasks || 0, color: '#10B981' },
    { name: 'Ausstehend', value: stats?.totalStats?.pending_tasks || 0, color: '#F59E0B' },
    { name: 'Übersprungen', value: stats?.totalStats?.skipped_tasks || 0, color: '#EF4444' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
          {isAdmin && (
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-subway-green focus:border-transparent"
            >
              <option value="">Alle Stores</option>
              {stores.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          )}
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.start_date}
              onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-subway-green"
            />
            <input
              type="date"
              value={dateRange.end_date}
              onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-subway-green"
            />
          </div>
        </div>
      </div>

      {/* Statistik Karten */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <ClockIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Gesamt Aufgaben</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalStats?.total_tasks || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <CheckCircleIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Erledigt</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalStats?.completed_tasks || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <ClockIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Ausstehend</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalStats?.pending_tasks || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-subway-green bg-opacity-10 text-subway-green">
              <CheckCircleIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Erledigungsrate</p>
              <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Store Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.storeStats || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed_tasks" fill="#10B981" name="Erledigt" />
              <Bar dataKey="pending_tasks" fill="#F59E0B" name="Ausstehend" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Verteilung */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Verteilung</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Store Ranking */}
      {isAdmin && stats?.storeStats?.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <TrophyIcon className="h-6 w-6 text-yellow-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Store Ranking</h2>
            </div>
            <p className="text-sm text-gray-500 mt-1">Sortiert nach Erledigungsrate</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[...stats.storeStats]
                .sort((a, b) => (b.completion_rate || 0) - (a.completion_rate || 0))
                .map((store, index) => {
                  const rate = store.completion_rate || 0;
                  const isTop3 = index < 3;
                  const medalColors = ['bg-yellow-400', 'bg-gray-300', 'bg-amber-600'];

                  return (
                    <div key={store.id} className={`flex items-center p-4 rounded-lg ${isTop3 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                      {/* Rank */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${isTop3 ? medalColors[index] : 'bg-gray-400'}`}>
                        {index + 1}
                      </div>

                      {/* Store Info */}
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{store.name}</h3>
                            <p className="text-sm text-gray-500">
                              {store.completed_tasks || 0} von {store.total_tasks || 0} erledigt
                            </p>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${rate >= 80 ? 'text-green-600' : rate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {rate}%
                            </div>
                            <div className="flex items-center text-sm">
                              {rate >= 80 ? (
                                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                              ) : rate < 50 ? (
                                <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                              ) : null}
                              <span className={rate >= 80 ? 'text-green-600' : rate < 50 ? 'text-red-600' : 'text-yellow-600'}>
                                {rate >= 80 ? 'Sehr gut' : rate >= 50 ? 'Akzeptabel' : 'Verbesserung nötig'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${rate >= 80 ? 'bg-green-500' : rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${rate}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Top Mitarbeiter */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Top Mitarbeiter</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mitarbeiter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Store
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Erledigte Aufgaben
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktive Tage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats?.employeeStats?.map((employee, index) => (
                <tr key={employee.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-subway-green rounded-full flex items-center justify-center text-white font-bold">
                        {employee.full_name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{employee.full_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.store_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {employee.completed_tasks}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.active_days}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
