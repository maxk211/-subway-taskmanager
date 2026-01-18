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
  PlusIcon
} from '@heroicons/react/24/outline';

const Tasks = () => {
  const { user, isAdmin, isManager } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedShift, setSelectedShift] = useState('');
  const [selectedStore, setSelectedStore] = useState(user?.store_id || '');
  const [stores, setStores] = useState([]);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [completionData, setCompletionData] = useState({
    notes: '',
    photo: null
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

  const openCompleteModal = (task) => {
    setSelectedTask(task);
    setCompletionData({ notes: '', photo: null });
    setShowCompleteModal(true);
  };

  const handleCompleteTask = async () => {
    try {
      const formData = new FormData();
      formData.append('notes', completionData.notes);
      if (completionData.photo) {
        formData.append('photo', completionData.photo);
      }

      await api.put(`/tasks/${selectedTask.id}/complete`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Aufgabe als erledigt markiert!');
      setShowCompleteModal(false);
      loadTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Fehler beim Abschließen der Aufgabe');
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
          <button
            onClick={generateTasks}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-subway-green hover:bg-subway-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-subway-green"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Aufgaben generieren
          </button>
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
                onClick={() => openCompleteModal(task)}
                className="w-full mt-4 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-subway-green hover:bg-subway-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-subway-green"
              >
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Als erledigt markieren
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

      {/* Complete Task Modal */}
      {showCompleteModal && selectedTask && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCompleteModal(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Aufgabe abschließen
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notizen (optional)
                    </label>
                    <textarea
                      value={completionData.notes}
                      onChange={(e) => setCompletionData({ ...completionData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-subway-green focus:border-transparent"
                      placeholder="Zusätzliche Informationen..."
                    />
                  </div>

                  {selectedTask.requires_photo && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Foto hochladen {selectedTask.requires_photo ? '(Pflicht)' : '(Optional)'}
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => setCompletionData({ ...completionData, photo: e.target.files[0] })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-subway-green focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleCompleteTask}
                  disabled={selectedTask.requires_photo && !completionData.photo}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-subway-green text-base font-medium text-white hover:bg-subway-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-subway-green sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Abschließen
                </button>
                <button
                  onClick={() => setShowCompleteModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-subway-green sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
