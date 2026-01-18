import React, { useState } from 'react';
import { format, subDays } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { DocumentArrowDownIcon, TableCellsIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const Reports = () => {
  const { isAdmin } = useAuth();
  const [dateRange, setDateRange] = useState({
    start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd')
  });
  const [selectedStore, setSelectedStore] = useState('');
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      const response = await fetch('/api/stores', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setStores(data);
    } catch (error) {
      toast.error('Fehler beim Laden der Stores');
    }
  };

  const downloadExcel = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        ...(selectedStore && { store_id: selectedStore })
      });

      const response = await fetch(`/api/reports/excel?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Download fehlgeschlagen');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subway-report-${dateRange.start_date}-${dateRange.end_date}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Excel-Report erfolgreich heruntergeladen!');
    } catch (error) {
      toast.error('Fehler beim Download des Excel-Reports');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        ...(selectedStore && { store_id: selectedStore })
      });

      const response = await fetch(`/api/reports/pdf?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Download fehlgeschlagen');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subway-report-${dateRange.start_date}-${dateRange.end_date}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('PDF-Report erfolgreich heruntergeladen!');
    } catch (error) {
      toast.error('Fehler beim Download des PDF-Reports');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Reports & Exporte</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Zeitraum & Filter</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Von</label>
            <input
              type="date"
              value={dateRange.start_date}
              onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-subway-green focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bis</label>
            <input
              type="date"
              value={dateRange.end_date}
              onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-subway-green focus:border-transparent"
            />
          </div>

          {isAdmin && (
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={downloadExcel}
            disabled={loading}
            className="flex items-center justify-center px-6 py-4 border-2 border-subway-green text-subway-green rounded-lg hover:bg-subway-green hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TableCellsIcon className="h-6 w-6 mr-2" />
            <div className="text-left">
              <div className="font-semibold">Excel exportieren</div>
              <div className="text-sm">Detaillierte Aufgabenliste als XLSX</div>
            </div>
          </button>

          <button
            onClick={downloadPDF}
            disabled={loading}
            className="flex items-center justify-center px-6 py-4 border-2 border-subway-green text-subway-green rounded-lg hover:bg-subway-green hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DocumentTextIcon className="h-6 w-6 mr-2" />
            <div className="text-left">
              <div className="font-semibold">PDF exportieren</div>
              <div className="text-sm">Zusammenfassung als PDF</div>
            </div>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Report-Informationen</h2>

        <div className="space-y-4 text-sm text-gray-600">
          <div className="flex items-start">
            <DocumentArrowDownIcon className="h-5 w-5 mr-2 text-subway-green flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900">Excel-Export</p>
              <p>Enthält alle Aufgaben im gewählten Zeitraum mit Details wie Store, Datum, Schicht, Status, erledigender Mitarbeiter und Zeitstempel.</p>
            </div>
          </div>

          <div className="flex items-start">
            <DocumentArrowDownIcon className="h-5 w-5 mr-2 text-subway-green flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900">PDF-Export</p>
              <p>Kompakte Zusammenfassung mit Gesamtstatistiken und Performance-Übersicht pro Store.</p>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mt-4">
            <p className="text-sm text-blue-800">
              <strong>Tipp:</strong> Für detaillierte Analysen verwende den Excel-Export. Für Management-Berichte und Übersichten eignet sich der PDF-Export besser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
