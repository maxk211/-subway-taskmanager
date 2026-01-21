import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  CheckCircleIcon,
  ClockIcon,
  CameraIcon,
  DocumentTextIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Tasks = () => {
  const { user, isAdmin, isManager } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedShift, setSelectedShift] = useState('');
  const [selectedStore, setSelectedStore] = useState(user?.store_id || '');
  const [stores, setStores] = useState([]);
  const [completingTaskId, setCompletingTaskId] = useState(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    shift: 'frueh'
  });

  useEffect(() => {
    if (isAdmin || isManager) {
      loadStores();
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [selectedDate, selectedShift, selectedStore]);

  const loadStores = async () => {
    try {
      const response = await api.get('/stores');
      setStores(response.data);
    } catch (error) {
      toast.error('Fehler beim Laden der Stores');
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      const params = { date: selectedDate };
      if (selectedShift) params.shift = selectedShift;
      if (selectedStore) params.store_id = selectedStore;

      const response = await api.get('/tasks', { params });
      setTasks(response.data);
    } catch (error) {
      toast.error('Fehler beim Laden der Aufgaben');
    } finally {
      setLoading(false);
    }
  };

  const generateTasks = async () => {
    try {
      const storeId = selectedStore || user?.store_id;
      if (!storeId) {
        toast.error('Bitte Store auswählen');
        return;
      }

      await api.post('/tasks/generate', {
        date: selectedDate,
        store_id: storeId
      });

      toast.success('Aufgaben erfolgreich generiert!');
      loadTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Fehler beim Generieren der Aufgaben');
    }
  };

  const handleCompleteTask = async (taskId) => {
    setCompletingTaskId(taskId);
    try {
      await api.put(`/tasks/${taskId}/complete`, {});
      toast.success('Aufgabe erledigt!');
      loadTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Fehler beim Abschließen');
    } finally {
      setCompletingTaskId(null);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();

    if (!newTask.title.trim()) {
      toast.error('Bitte Titel eingeben');
      return;
    }

    const storeId = selectedStore || user?.store_id;
    if (!storeId) {
      toast.error('Bitte Store auswählen');
      return;
    }

    try {
      await api.post('/tasks/create', {
        title: newTask.title,
        description: newTask.description,
        shift: newTask.shift,
        store_id: storeId,
        due_date: selectedDate
      });

      toast.success('Aufgabe erstellt!');
      setShowNewTaskModal(false);
      setNewTask({ title: '', description: '', shift: 'frueh' });
      loadTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Fehler beim Erstellen');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Ausstehend' },
      completed: { color: 'bg-green-100 text-green-800', text: 'Erledigt' },
      skipped: { color: 'bg-red-100 text-red-800', text: 'Übersprungen' }
    };

    const badge = badges[status] || badges.pending;

    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const getShiftBadge = (shift) => {
    const badges = {
      frueh: { color: 'bg-blue-100 text-blue-800', text: 'Frühschicht' },
      spaet: { color: 'bg-purple-100 text-purple-800', text: 'Spätschicht' }
    };

    const badge = badges[shift];

    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${badge.color}`}>
        {badge.text}
      </span>
    );
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
        <h1 className="text-3xl font-bold text-gray-900">Meine Aufgaben</h1>
        {(isAdmin || isManager) && (
          <div className="mt-4 sm:mt-0 flex gap-2">
            <button
              onClick={() => setShowNewTaskModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-subway-green hover:bg-subway-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-subway-green"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Neue Aufgabe
            </button>
            <button
              onClick={generateTasks}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-subway-green"
            >
              Tagesaufgaben generieren
            </button>
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-subway-green focus:border-transparent"
            />
          </div>

          {(isAdmin || isManager) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store</label>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-subway-green focus:border-transparent"
              >
                <option value="">Alle Stores</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Schicht</label>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-subway-green focus:border-transparent"
            >
              <option value="">Alle Schichten</option>
              <option value="frueh">Frühschicht</option>
              <option value="spaet">Spätschicht</option>
            </select>
          </div>
        </div>
      </div>

      {/* Aufgabenliste */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{task.title}</h3>
                <p className="text-sm text-gray-500">{task.category}</p>
              </div>
              {task.requires_photo && (
                <CameraIcon className="h-5 w-5 text-gray-400" title="Foto erforderlich" />
              )}
            </div>

            {task.description && (
              <p className="text-sm text-gray-600 mb-3">{task.description}</p>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              {getShiftBadge(task.shift)}
              {getStatusBadge(task.status)}
            </div>

            {task.status === 'completed' && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Erledigt von: {task.completed_by_name}
                </p>
                <p className="text-xs text-gray-500">
                  {format(new Date(task.completed_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                </p>
                {task.notes && (
                  <p className="text-xs text-gray-600 mt-2">
                    <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                    {task.notes}
                  </p>
                )}
              </div>
            )}

            {task.status === 'pending' && (
              <button
                onClick={() => handleCompleteTask(task.id)}
                disabled={completingTaskId === task.id}
                className="w-full mt-4 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-subway-green hover:bg-subway-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-subway-green disabled:opacity-50"
              >
                {completingTaskId === task.id ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                )}
                {completingTaskId === task.id ? 'Wird gespeichert...' : 'Erledigt'}
              </button>
            )}
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="col-span-full text-center py-12">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Aufgaben</h3>
            <p className="mt-1 text-sm text-gray-500">
              Für diesen Tag sind noch keine Aufgaben vorhanden.
            </p>
          </div>
        )}
      </div>

      {/* Neue Aufgabe Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Neue Aufgabe erstellen</h2>
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titel *
                </label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="z.B. Lieferung annehmen"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-subway-green focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beschreibung
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Optionale Details zur Aufgabe..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-subway-green focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schicht
                </label>
                <select
                  value={newTask.shift}
                  onChange={(e) => setNewTask({ ...newTask, shift: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-subway-green focus:border-transparent"
                >
                  <option value="frueh">Frühschicht</option>
                  <option value="spaet">Spätschicht</option>
                </select>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  <strong>Datum:</strong> {format(new Date(selectedDate), 'dd.MM.yyyy', { locale: de })}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Store:</strong> {stores.find(s => s.id == (selectedStore || user?.store_id))?.name || 'Nicht ausgewählt'}
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-subway-green text-white rounded-lg hover:bg-subway-dark"
                >
                  Erstellen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
