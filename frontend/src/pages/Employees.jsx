import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  UserPlusIcon,
  PencilIcon,
  KeyIcon,
  UserCircleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const Employees = () => {
  const { user, isAdmin } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    role: 'employee',
    store_id: ''
  });
  const [passwordData, setPasswordData] = useState({
    userId: null,
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadEmployees();
    loadStores();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await api.get('/users');
      setEmployees(response.data);
    } catch (error) {
      toast.error('Fehler beim Laden der Mitarbeiter');
    } finally {
      setLoading(false);
    }
  };

  const loadStores = async () => {
    try {
      const response = await api.get('/stores');
      setStores(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Stores');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingEmployee) {
        await api.put(`/users/${editingEmployee.id}`, {
          full_name: formData.full_name,
          email: formData.email,
          role: formData.role,
          store_id: formData.store_id,
          active: formData.active
        });
        toast.success('Mitarbeiter aktualisiert');
      } else {
        await api.post('/users', formData);
        toast.success('Mitarbeiter erstellt');
      }

      setShowModal(false);
      setEditingEmployee(null);
      setFormData({
        username: '',
        password: '',
        full_name: '',
        email: '',
        role: 'employee',
        store_id: ''
      });
      loadEmployees();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Fehler beim Speichern');
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      username: employee.username,
      password: '',
      full_name: employee.full_name,
      email: employee.email || '',
      role: employee.role,
      store_id: employee.store_id || '',
      active: employee.active
    });
    setShowModal(true);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.password !== passwordData.confirmPassword) {
      toast.error('Passwörter stimmen nicht überein');
      return;
    }

    if (passwordData.password.length < 6) {
      toast.error('Passwort muss mindestens 6 Zeichen haben');
      return;
    }

    try {
      await api.put(`/users/${passwordData.userId}/password`, {
        password: passwordData.password
      });
      toast.success('Passwort geändert');
      setShowPasswordModal(false);
      setPasswordData({ userId: null, password: '', confirmPassword: '' });
    } catch (error) {
      toast.error('Fehler beim Ändern des Passworts');
    }
  };

  const openPasswordModal = (employeeId) => {
    setPasswordData({ userId: employeeId, password: '', confirmPassword: '' });
    setShowPasswordModal(true);
  };

  const toggleActive = async (employee) => {
    try {
      await api.put(`/users/${employee.id}`, {
        ...employee,
        active: employee.active ? 0 : 1
      });
      toast.success(employee.active ? 'Mitarbeiter deaktiviert' : 'Mitarbeiter aktiviert');
      loadEmployees();
    } catch (error) {
      toast.error('Fehler beim Aktualisieren');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-subway-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Mitarbeiter</h1>
        <button
          onClick={() => {
            setEditingEmployee(null);
            setFormData({
              username: '',
              password: '',
              full_name: '',
              email: '',
              role: 'employee',
              store_id: user.store_id || ''
            });
            setShowModal(true);
          }}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-subway-green text-white rounded-lg hover:bg-subway-green-dark transition-colors"
        >
          <UserPlusIcon className="h-5 w-5 mr-2" />
          Neuer Mitarbeiter
        </button>
      </div>

      {/* Mitarbeiter Liste */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mitarbeiter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Benutzername
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Store
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rolle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-subway-green rounded-full flex items-center justify-center text-white font-bold">
                        {employee.full_name?.charAt(0) || '?'}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {employee.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.store_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      employee.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : employee.role === 'manager'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {employee.role === 'admin' ? 'Admin' : employee.role === 'manager' ? 'Manager' : 'Mitarbeiter'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActive(employee)}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        employee.active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {employee.active ? (
                        <>
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Aktiv
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="h-4 w-4 mr-1" />
                          Inaktiv
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(employee)}
                      className="text-subway-green hover:text-subway-green-dark mr-3"
                      title="Bearbeiten"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => openPasswordModal(employee.id)}
                      className="text-gray-500 hover:text-gray-700"
                      title="Passwort ändern"
                    >
                      <KeyIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mitarbeiter Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingEmployee ? 'Mitarbeiter bearbeiten' : 'Neuer Mitarbeiter'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingEmployee && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Benutzername *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-subway-green focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Passwort *
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-subway-green focus:border-transparent"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vollständiger Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-subway-green focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-Mail
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-subway-green focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store *
                </label>
                <select
                  required
                  value={formData.store_id}
                  onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-subway-green focus:border-transparent"
                >
                  <option value="">Store auswählen</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>

              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rolle
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-subway-green focus:border-transparent"
                  >
                    <option value="employee">Mitarbeiter</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingEmployee(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-subway-green text-white rounded-lg hover:bg-subway-green-dark"
                >
                  {editingEmployee ? 'Speichern' : 'Erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Passwort Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Passwort ändern
            </h2>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Neues Passwort *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwordData.password}
                  onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-subway-green focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passwort bestätigen *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-subway-green focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ userId: null, password: '', confirmPassword: '' });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-subway-green text-white rounded-lg hover:bg-subway-green-dark"
                >
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
