import React, { useState, useEffect } from 'react';
import {
  ClipboardDocumentCheckIcon,
  SunIcon,
  ClockIcon,
  MoonIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

const checklistData = {
  frueh: {
    name: 'Frühschicht',
    icon: SunIcon,
    color: 'blue',
    items: [
      'Licht & Sichtkontrolle',
      'Hände waschen zu Schichtbeginn',
      'Probleme im Dashboard dokumentieren',
      'Gärschrank einschalten',
      'Theke einschalten',
      'Kühlhaus Temperatur prüfen',
      'Tiefkühlung Temperatur prüfen',
      'Kassenabrechnung Vortag prüfen',
      'Brotbedarf berechnen',
      'Produktbedarf berechnen',
      'Cookie-Bedarf berechnen',
      'Waffle-Fries Bedarf prüfen',
      'Brot aus Tiefkühlung holen',
      'Erste 6 Bleche in Gärschrank geben',
      'Gärschrank-Timer-Logik einhalten',
      'Thekenprodukte einräumen',
      'Labels & MHD prüfen',
      'FIFO in Theke sicherstellen',
      'Thekenoptik prüfen',
      'Cookies backen',
      'Waffle Fries vorbereiten',
      'Vorbereitung laut Liste durchführen',
      'Toaster einschalten',
      'Selforder-Terminals einschalten'
    ]
  },
  mittel: {
    name: 'Mittelschicht',
    icon: ClockIcon,
    color: 'orange',
    items: [
      'Tische im Gästebereich reinigen',
      'Stühle korrekt positionieren',
      'Boden im Gästebereich sauber halten',
      'Getränkekühlschrank auffüllen',
      'Verbrauchsmaterial auffüllen',
      'Gästetoilette prüfen',
      'Boden in Theke & Küche sauber halten',
      'Arbeitsflächen zwischendurch reinigen',
      'Geräte zwischendurch reinigen',
      'Ordnung in Küche & Lager sicherstellen',
      'Offene Kartons leeren & entsorgen',
      'Regale im Lager ordentlich einräumen',
      'Verbrauchsmaterial im Lager auffüllen',
      'Nachtretarder vorbereiten'
    ]
  },
  spaet: {
    name: 'Spätschicht',
    icon: MoonIcon,
    color: 'purple',
    items: [
      'Temperaturen messen',
      'Toastofen außen reinigen',
      'Brotwagen & Schienen reinigen',
      'Mikrowelle innen & außen reinigen',
      'Safe & Boden reinigen',
      'Wrappapierbox reinigen',
      'Backcounter reinigen',
      'Fächer von Bröseln befreien',
      'Papiertuch-/Seifen-/Handschuhspender reinigen',
      'Kassenbereich reinigen',
      'Boden im Thekenbereich schrubben',
      'Auftaukontrolle',
      'Vorbereitungstisch & Fliesen reinigen',
      'Brotwagen Küche reinigen',
      'Mülltonnen reinigen',
      'Cambros & Saucenflaschen spülen',
      'Schmutzwasserbecken reinigen',
      'TK-/Kühlraumtür reinigen',
      'Küchenboden schrubben',
      'Tische & Stühle reinigen',
      'Getränkekühlschrank reinigen',
      'Lobby kehren',
      'Fußmatte ausschütteln',
      'Kundentoilette reinigen',
      'Theke ausschalten',
      'Warmes Wasser in Brotschrank',
      'Toastofen ausschalten',
      'Soßenstöpsel & Gewürzbehälter reinigen/wechseln',
      'Theke ausräumen',
      'Fleisch- & Gemüsetheke reinigen',
      'Griffe reinigen',
      'Handwaschbecken reinigen',
      'Toastschaufel & Backgitter spülen',
      'Portionierer/Zangen/Messer spülen',
      'Boden erneut kehren (bei Bedarf)',
      'Spüle & Fliesen dahinter reinigen',
      'Utensilien aufräumen',
      'Openschild ausschalten',
      'Abrechnung machen',
      'Abschluss-Rundgang',
      'Prüfen: sauber & ausgeschaltet',
      'Türen schließen & Alarm setzen'
    ]
  }
};

const getTodayString = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

const Checklists = () => {
  const [checkedItems, setCheckedItems] = useState({
    frueh: {},
    mittel: {},
    spaet: {}
  });
  const [expandedList, setExpandedList] = useState('frueh');

  // Lade gespeicherten Zustand beim Start, setze zurück wenn neuer Tag
  useEffect(() => {
    const savedData = localStorage.getItem('subway-checklists');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      if (parsed.date === getTodayString()) {
        setCheckedItems(parsed.items);
      } else {
        // Neuer Tag - zurücksetzen
        localStorage.removeItem('subway-checklists');
      }
    }
  }, []);

  // Speichere Änderungen in localStorage
  useEffect(() => {
    const hasAnyChecked = Object.values(checkedItems).some(
      list => Object.keys(list).length > 0
    );
    if (hasAnyChecked) {
      localStorage.setItem('subway-checklists', JSON.stringify({
        date: getTodayString(),
        items: checkedItems
      }));
    }
  }, [checkedItems]);

  const toggleItem = (listKey, index) => {
    setCheckedItems(prev => ({
      ...prev,
      [listKey]: {
        ...prev[listKey],
        [index]: !prev[listKey][index]
      }
    }));
  };

  const getProgress = (listKey) => {
    const items = checklistData[listKey].items;
    const checked = Object.values(checkedItems[listKey]).filter(Boolean).length;
    return { checked, total: items.length, percentage: Math.round((checked / items.length) * 100) };
  };

  const resetChecklist = (listKey) => {
    setCheckedItems(prev => ({
      ...prev,
      [listKey]: {}
    }));
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-200',
        progress: 'bg-blue-500',
        badge: 'bg-blue-100 text-blue-800'
      },
      orange: {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        border: 'border-orange-200',
        progress: 'bg-orange-500',
        badge: 'bg-orange-100 text-orange-800'
      },
      purple: {
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        border: 'border-purple-200',
        progress: 'bg-purple-500',
        badge: 'bg-purple-100 text-purple-800'
      }
    };
    return colors[color];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Checklisten</h1>
        <p className="mt-2 sm:mt-0 text-sm text-gray-500">
          Tägliche Aufgaben nach Schicht
        </p>
      </div>

      {/* Checklist Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {Object.entries(checklistData).map(([key, list]) => {
              const isActive = expandedList === key;
              const progress = getProgress(key);
              const colors = getColorClasses(list.color);
              const IconComponent = list.icon;

              return (
                <button
                  key={key}
                  onClick={() => setExpandedList(key)}
                  className={`flex-1 px-4 py-4 text-center border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? `border-subway-green text-subway-green`
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <IconComponent className="h-5 w-5" />
                    <span>{list.name}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${colors.badge}`}>
                      {progress.checked}/{progress.total}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Active Checklist Content */}
        {Object.entries(checklistData).map(([key, list]) => {
          if (expandedList !== key) return null;

          const progress = getProgress(key);
          const colors = getColorClasses(list.color);
          const IconComponent = list.icon;

          return (
            <div key={key} className="p-6">
              {/* Progress Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${colors.bg}`}>
                    <IconComponent className={`h-6 w-6 ${colors.text}`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{list.name}</h2>
                    <p className="text-sm text-gray-500">
                      {progress.checked} von {progress.total} erledigt ({progress.percentage}%)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => resetChecklist(key)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Zurücksetzen
                </button>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                <div
                  className={`h-2.5 rounded-full transition-all duration-300 ${colors.progress}`}
                  style={{ width: `${progress.percentage}%` }}
                ></div>
              </div>

              {/* Checklist Items */}
              <div className="space-y-2">
                {list.items.map((item, index) => {
                  const isChecked = checkedItems[key][index];
                  const itemNumber = index + 1;

                  return (
                    <div
                      key={index}
                      onClick={() => toggleItem(key, index)}
                      className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-green-50 border-green-300'
                          : `bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm`
                      }`}
                    >
                      <div className="flex-shrink-0 mr-3 w-8 text-center">
                        <span className={`text-sm font-medium ${isChecked ? 'text-green-600' : 'text-gray-400'}`}>
                          {itemNumber}.
                        </span>
                      </div>
                      <div className="flex-shrink-0 mr-3">
                        {isChecked ? (
                          <CheckCircleSolidIcon className="h-6 w-6 text-green-500" />
                        ) : (
                          <div className="h-6 w-6 rounded-full border-2 border-gray-300"></div>
                        )}
                      </div>
                      <span className={`text-sm ${isChecked ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                        {item}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="bg-subway-yellow/10 border border-subway-yellow/30 rounded-lg p-4">
        <div className="flex items-start">
          <ClipboardDocumentCheckIcon className="h-6 w-6 text-subway-green mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900">Hinweis</h3>
            <p className="text-sm text-gray-600 mt-1">
              Diese Checklisten dienen als tägliche Orientierung für die Schichtaufgaben.
              Die Markierungen werden jeden Tag automatisch zurückgesetzt.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checklists;
