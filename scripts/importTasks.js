require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Mapping für Schicht
const shiftMap = {
  'Früh': 'frueh',
  'Mittel': 'beide',  // Mittel = kann in beiden Schichten erledigt werden
  'Spät': 'spaet'
};

// Mapping für Wochentag
const dayMap = {
  'Montag': 'monday',
  'Dienstag': 'tuesday',
  'Mittwoch': 'wednesday',
  'Donnerstag': 'thursday',
  'Freitag': 'friday',
  'Samstag': 'saturday',
  'Sonntag': 'sunday'
};

// Alle Aufgaben aus der Liste
const tasks = [
  // TÄGLICHE AUFGABEN - FRÜHSCHICHT
  { id: 1001, title: 'Licht & Sichtkontrolle', description: 'Licht einschalten, Lobby, Küche und Theke visuell prüfen.', category: 'Öffnung', shift: 'Früh', recurrence: 'daily', day: null, week: null },
  { id: 1002, title: 'Hände waschen zu Schichtbeginn', description: 'Vor Beginn der Arbeiten gründlich Hände waschen.', category: 'Hygiene', shift: 'Früh', recurrence: 'daily', day: null, week: null },
  { id: 1003, title: 'Probleme im Dashboard dokumentieren', description: 'Bei Auffälligkeiten Schichtzustand mit Foto/Text im Dashboard dokumentieren.', category: 'Dokumentation', shift: 'Früh', recurrence: 'daily', day: null, week: null },
  { id: 1010, title: 'Gärschrank einschalten', description: 'Gärschrank für die Brotvorragung einschalten.', category: 'Geräte', shift: 'Früh', recurrence: 'daily', day: null, week: null },
  { id: 1011, title: 'Theke einschalten', description: 'Kühltheke einschalten und auf Betriebstemperatur bringen.', category: 'Geräte', shift: 'Früh', recurrence: 'daily', day: null, week: null },
  { id: 1020, title: 'Kühlhaus Temperatur prüfen', description: 'Sicherstellen, dass das Kühlhaus zwischen 0–4 °C liegt, Abweichungen melden.', category: 'Hygiene', shift: 'Früh', recurrence: 'daily', day: null, week: null },
  { id: 1021, title: 'Tiefkühlung Temperatur prüfen', description: 'Sicherstellen, dass die Tiefkühlung ≤ –18 °C liegt, Abweichungen melden.', category: 'Hygiene', shift: 'Früh', recurrence: 'daily', day: null, week: null },
  { id: 1030, title: 'Kassenabrechnung Vortag prüfen', description: 'Kassenabrechnung vom Vortag prüfen, ggf. korrigieren oder durchführen.', category: 'Finanzen', shift: 'Früh', recurrence: 'daily', day: null, week: null },
  { id: 1040, title: 'Brotbedarf berechnen', description: 'Brotbedarf je nach erwarteter Gästeanzahl berechnen.', category: 'Vorbereitung', shift: 'Früh', recurrence: 'daily', day: null, week: null },
  { id: 1041, title: 'Produktbedarf berechnen', description: 'Bedarf für Gemüse, Fleisch, Käse, Soßen etc. berechnen.', category: 'Vorbereitung', shift: 'Früh', recurrence: 'daily', day: null, week: null },
  { id: 1042, title: 'Cookie-Bedarf berechnen', description: 'Bedarf an Cookies für den Tag berechnen.', category: 'Vorbereitung', shift: 'Früh', recurrence: 'daily', day: null, week: null },
  { id: 1043, title: 'Waffle-Fries Bedarf prüfen', description: 'Bedarf an Waffle Fries prüfen und einplanen.', category: 'Vorbereitung', shift: 'Früh', recurrence: 'daily', day: null, week: null },
  { id: 1050, title: 'Brot aus Tiefkühlung holen', description: 'Brot laut Bedarf aus der Tiefkühlung holen.', category: 'Backbereich', shift: 'Früh', recurrence: 'daily', day: null, week: null },
  { id: 1051, title: 'Erste 6 Bleche in Gärschrank geben', description: 'Die ersten 6 Bleche mit Brot in den Gärschrank stellen.', category: 'Backbereich', shift: 'Früh', recurrence: 'daily', day: null, week: null },
  { id: 1052, title: 'Gärschrank-Timer-Logik einhalten', description: 'Wenn Timer klingelt, neue 6 Bleche nachlegen.', category: 'Backbereich', shift: 'Früh', recurrence: 'daily', day: null, week: null },
  { id: 1060, title: 'Thekenprodukte einräumen', description: 'Alle Produkte gemäß Vorbereitungsliste in die Theke einräumen.', category: 'Theke', shift: 'Früh', recurrence: 'daily', day: null, week: null },
  { id: 1061, title: 'Labels & MHD prüfen', description: 'MHDs prüfen und korrekte Beschriftung sicherstellen.', category: 'Hygiene', shift: 'Früh', recurrence: 'daily', day: null, week: null },
  { id: 1062, title: 'FIFO in Theke sicherstellen', description: 'Produkte nach FIFO-Prinzip in der Theke einräumen.', category: 'Hygiene', shift: 'Früh', recurrence: 'daily', day: null, week: null },
  { id: 1063, title: 'Thekenoptik prüfen', description: 'Gleichmäßige Höhe, Sauberkeit, Vollständigkeit prüfen.', category: 'Theke', shift: 'Früh', recurrence: 'daily', day: null, week: null },
  { id: 1070, title: 'Cookies backen', description: 'Cookies backen, sobald der Ofen die Zieltemperatur erreicht.', category: 'Backbereich', shift: 'Früh', recurrence: 'daily', day: null, week: null },
  { id: 1071, title: 'Waffle Fries vorbereiten', description: 'Waffle Fries nach Bedarf vorbereiten.', category: 'Küche', shift: 'Früh', recurrence: 'daily', day: null, week: null },
  { id: 1072, title: 'Vorbereitung laut Liste durchführen', description: 'Alle Produkte gemäß Vorbereitungsliste vorbereiten.', category: 'Vorbereitung', shift: 'Früh', recurrence: 'daily', day: null, week: null },
  { id: 1080, title: 'Toaster einschalten', description: 'Toaster ca. 30 Minuten vor Öffnung einschalten.', category: 'Geräte', shift: 'Früh', recurrence: 'daily', day: null, week: null },
  { id: 1081, title: 'Selforder-Terminals einschalten', description: 'Selforder-Terminals starten (falls vorhanden).', category: 'Geräte', shift: 'Früh', recurrence: 'daily', day: null, week: null },

  // TÄGLICHE AUFGABEN - MITTELSCHICHT (beide)
  { id: 2001, title: 'Thekenfüllstand prüfen', description: 'Sicherstellen, dass alle Plätze in der Theke gefüllt sind.', category: 'Theke', shift: 'Mittel', recurrence: 'daily', day: null, week: null },
  { id: 2002, title: 'Gemüse auffüllen', description: 'Gemüse nach Bedarf auffüllen, Frische beachten.', category: 'Theke', shift: 'Mittel', recurrence: 'daily', day: null, week: null },
  { id: 2003, title: 'Fleisch & Käse auffüllen', description: 'Fleisch und Käse nach Bedarf auffüllen.', category: 'Theke', shift: 'Mittel', recurrence: 'daily', day: null, week: null },
  { id: 2004, title: 'Soßen & Toppings auffüllen', description: 'Soßen und Toppings regelmäßig prüfen und auffüllen.', category: 'Theke', shift: 'Mittel', recurrence: 'daily', day: null, week: null },
  { id: 2005, title: 'Haltbarkeit & Frische prüfen', description: 'Produkte in der Theke auf Frische und Haltbarkeit prüfen.', category: 'Hygiene', shift: 'Mittel', recurrence: 'daily', day: null, week: null },
  { id: 2006, title: 'Thekenscheiben reinigen', description: 'Fingerabdrücke und Spritzer an Thekenscheiben entfernen.', category: 'Reinigung', shift: 'Mittel', recurrence: 'daily', day: null, week: null },
  { id: 2007, title: 'Thekenarbeitsflächen reinigen', description: 'Arbeitsflächen im Thekenbereich sauber halten.', category: 'Reinigung', shift: 'Mittel', recurrence: 'daily', day: null, week: null },
  { id: 2008, title: 'Brotbestände prüfen', description: 'Brotbestand prüfen, rechtzeitig nachbacken.', category: 'Backbereich', shift: 'Mittel', recurrence: 'daily', day: null, week: null },
  { id: 2009, title: 'Cookies nachbacken', description: 'Cookiebestand prüfen und bei Bedarf nachbacken.', category: 'Backbereich', shift: 'Mittel', recurrence: 'daily', day: null, week: null },
  { id: 2010, title: 'Waffle Fries nachproduzieren', description: 'Waffle Fries prüfen und bei Bedarf vorbereiten.', category: 'Küche', shift: 'Mittel', recurrence: 'daily', day: null, week: null },
  { id: 2020, title: 'Tische im Gästebereich reinigen', description: 'Tische regelmäßig abwischen.', category: 'Lobby', shift: 'Mittel', recurrence: 'daily', day: null, week: null },
  { id: 2021, title: 'Stühle korrekt positionieren', description: 'Stühle ordentlich anordnen.', category: 'Lobby', shift: 'Mittel', recurrence: 'daily', day: null, week: null },
  { id: 2022, title: 'Boden im Gästebereich sauber halten', description: 'Verschmutzungen im Gästebereich direkt beseitigen.', category: 'Lobby', shift: 'Mittel', recurrence: 'daily', day: null, week: null },
  { id: 2023, title: 'Getränkekühlschrank auffüllen', description: 'Getränkekühlschrank auffüllen und Ordnung sicherstellen.', category: 'Lobby', shift: 'Mittel', recurrence: 'daily', day: null, week: null },
  { id: 2024, title: 'Verbrauchsmaterial auffüllen', description: 'Servietten, Tüten, Delipapier etc. nachfüllen.', category: 'Lobby', shift: 'Mittel', recurrence: 'daily', day: null, week: null },
  { id: 2025, title: 'Gästetoilette prüfen', description: 'Zustand prüfen, Verschmutzungen sofort beseitigen.', category: 'Sanitär', shift: 'Mittel', recurrence: 'daily', day: null, week: null },
  { id: 2030, title: 'Boden in Theke & Küche sauber halten', description: 'Boden in Theken- und Küchenbereich bei Bedarf reinigen.', category: 'Reinigung', shift: 'Mittel', recurrence: 'daily', day: null, week: null },
  { id: 2031, title: 'Arbeitsflächen zwischendurch reinigen', description: 'Arbeitsflächen im Küchenbereich sauber halten.', category: 'Reinigung', shift: 'Mittel', recurrence: 'daily', day: null, week: null },
  { id: 2032, title: 'Geräte zwischendurch reinigen', description: 'Häufig genutzte Geräte regelmäßig abwischen.', category: 'Reinigung', shift: 'Mittel', recurrence: 'daily', day: null, week: null },
  { id: 2033, title: 'Ordnung in Küche & Lager sicherstellen', description: 'Kein Müll oder Verpackungen herumliegen lassen.', category: 'Organisation', shift: 'Mittel', recurrence: 'daily', day: null, week: null },
  { id: 2034, title: 'Offene Kartons leeren & entsorgen', description: 'Offene Kartons leeren und Kartons entsorgen.', category: 'Lager', shift: 'Mittel', recurrence: 'daily', day: null, week: null },
  { id: 2035, title: 'Regale im Lager ordentlich einräumen', description: 'Regale geordnet einräumen und FIFO beachten.', category: 'Lager', shift: 'Mittel', recurrence: 'daily', day: null, week: null },
  { id: 2036, title: 'Verbrauchsmaterial im Lager auffüllen', description: 'Handschuhe, Servietten, Rollen etc. rechtzeitig auffüllen.', category: 'Lager', shift: 'Mittel', recurrence: 'daily', day: null, week: null },
  { id: 2040, title: 'Nachtretarder vorbereiten', description: 'Nachtretarder für Abend oder Folgetag vorbereiten.', category: 'Vorbereitung', shift: 'Mittel', recurrence: 'daily', day: null, week: null },

  // TÄGLICHE AUFGABEN - SPÄTSCHICHT
  { id: 3001, title: 'Temperaturen messen', description: 'Thekentemperaturen prüfen.', category: 'Hygiene', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3002, title: 'Toastofen außen reinigen', description: 'Toastofen außen abwischen.', category: 'Reinigung', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3003, title: 'Brotwagen & Schienen reinigen', description: 'Brotwagen inkl. Schienen reinigen.', category: 'Reinigung', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3004, title: 'Mikrowelle innen & außen reinigen', description: 'Mikrowelle innen und außen säubern.', category: 'Reinigung', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3005, title: 'Safe & Boden reinigen', description: 'Safe und Boden drumherum reinigen.', category: 'Reinigung', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3006, title: 'Wrappapierbox reinigen', description: 'Wrappapierbox innen/außen reinigen.', category: 'Reinigung', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3007, title: 'Backcounter reinigen', description: 'Backcounter auswischen.', category: 'Reinigung', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3008, title: 'Fächer von Bröseln befreien', description: 'Brösel/Dreck aus Fächern entfernen.', category: 'Reinigung', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3009, title: 'Papiertuch-/Seifen-/Handschuhspender reinigen', description: 'Halter/Spender abwischen.', category: 'Reinigung', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3010, title: 'Kassenbereich reinigen', description: 'Kassenbereich gründlich reinigen.', category: 'Reinigung', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3011, title: 'Boden im Thekenbereich schrubben', description: 'Boden gründlich schrubben.', category: 'Reinigung', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3020, title: 'Auftaukontrolle', description: 'Kontrollieren, ob alles korrekt aufgetaut ist.', category: 'Hygiene', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3021, title: 'Vorbereitungstisch & Fliesen reinigen', description: 'Vorbereitungstisch desinfizieren, Fliesen dahinter reinigen.', category: 'Reinigung', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3022, title: 'Brotwagen Küche reinigen', description: 'Brotwagen inkl. Schienen im Küchenbereich reinigen.', category: 'Reinigung', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3023, title: 'Mülltonnen reinigen', description: 'Mülltonnen innen & außen reinigen.', category: 'Reinigung', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3024, title: 'Cambros & Saucenflaschen spülen', description: 'Cambros und Saucenflaschen reinigen.', category: 'Reinigung', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3025, title: 'Schmutzwasserbecken reinigen', description: 'Schmutzwasserbecken gründlich reinigen.', category: 'Reinigung', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3026, title: 'TK-/Kühlraumtür reinigen', description: 'TK-/Kühlraumtür & Griffe säubern.', category: 'Reinigung', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3027, title: 'Küchenboden schrubben', description: 'Küchenboden gründlich schrubben.', category: 'Reinigung', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3030, title: 'Tische & Stühle reinigen', description: 'Tische & Stühle inkl. Beine reinigen.', category: 'Lobby', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3031, title: 'Getränkekühlschrank reinigen', description: 'Kühlschrank Scheiben/Griffe reinigen & auffüllen.', category: 'Lobby', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3032, title: 'Lobby kehren', description: 'Lobby vollständig kehren.', category: 'Lobby', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3033, title: 'Fußmatte ausschütteln', description: 'Fußmatte draußen ausschütteln.', category: 'Lobby', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3034, title: 'Kundentoilette reinigen', description: 'Kundentoilette reinigen & wischen.', category: 'Sanitär', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3040, title: 'Theke ausschalten', description: 'Theke ca. 30 Min vor Ladenschluss ausschalten.', category: 'Geräte', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3050, title: 'Warmes Wasser in Brotschrank', description: 'Warmes Wasser in Brotschrank stellen.', category: 'Backbereich', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3051, title: 'Toastofen ausschalten', description: 'Toastofen ausschalten.', category: 'Geräte', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3052, title: 'Soßenstöpsel & Gewürzbehälter reinigen/wechseln', description: 'Stöpsel spülen, Gewürzbehälter außen reinigen.', category: 'Reinigung', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3053, title: 'Theke ausräumen', description: 'Theke vollständig ausräumen.', category: 'Theke', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3054, title: 'Fleisch- & Gemüsetheke reinigen', description: 'Theke inkl. Scheiben und Griffe reinigen.', category: 'Reinigung', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3055, title: 'Griffe reinigen', description: 'Griffe von Toastofen & Brotwagen reinigen.', category: 'Reinigung', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3056, title: 'Handwaschbecken reinigen', description: 'Handwaschbecken an der Theke säubern.', category: 'Reinigung', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3060, title: 'Toastschaufel & Backgitter spülen', description: 'Toastschaufel und Backgitter reinigen.', category: 'Reinigung', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3061, title: 'Portionierer/Zangen/Messer spülen', description: 'Utensilien gründlich spülen.', category: 'Reinigung', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3062, title: 'Boden erneut kehren (bei Bedarf)', description: 'Boden bei Bedarf erneut kehren.', category: 'Reinigung', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3063, title: 'Spüle & Fliesen dahinter reinigen', description: 'Spüle und Fliesen reinigen.', category: 'Reinigung', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3064, title: 'Utensilien aufräumen', description: 'Gespülte Utensilien ordentlich verräumen.', category: 'Organisation', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3070, title: 'Openschild ausschalten', description: 'Openschild/Licht ausschalten.', category: 'Geräte', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3080, title: 'Abrechnung machen', description: 'Tagesabrechnung durchführen.', category: 'Finanzen', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3090, title: 'Abschluss-Rundgang', description: 'Rundgang durch Küche, Lager, Kühlhaus, Lobby.', category: 'Schließung', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3091, title: 'Prüfen: sauber & ausgeschaltet', description: 'Prüfen, ob alles sauber, aus und verstaut ist.', category: 'Schließung', shift: 'Spät', recurrence: 'daily', day: null, week: null },
  { id: 3092, title: 'Türen schließen & Alarm setzen', description: 'Türen schließen, Alarm setzen / abschließen.', category: 'Schließung', shift: 'Spät', recurrence: 'daily', day: null, week: null },

  // WÖCHENTLICHE AUFGABEN - WOCHE 1
  { id: 5101, title: 'Stuhllehnen & Tischplatten reinigen', description: 'Stuhllehnen und Tischplatten mit Schmutzradierer reinigen.', category: 'Sonderputz Lobby', shift: 'Früh', recurrence: 'weekly', day: 'Montag', week: 1 },
  { id: 5102, title: 'Bodenrandleisten Lobby reinigen', description: 'Alle Bodenrandleisten in der Lobby abwischen.', category: 'Sonderputz Lobby', shift: 'Mittel', recurrence: 'weekly', day: 'Montag', week: 1 },
  { id: 5103, title: 'Bilder & Logo entstauben', description: 'Bilder und Logo in der Lobby entstauben.', category: 'Sonderputz Lobby', shift: 'Spät', recurrence: 'weekly', day: 'Montag', week: 1 },
  { id: 5104, title: 'Fensterbretter reinigen', description: 'Fensterbretter in der Lobby reinigen.', category: 'Sonderputz Lobby', shift: 'Spät', recurrence: 'weekly', day: 'Montag', week: 1 },
  { id: 5111, title: 'Backofen auseinanderbauen & reinigen', description: 'Backofen auseinanderbauen und gründlich reinigen.', category: 'Sonderputz Backbereich', shift: 'Früh', recurrence: 'weekly', day: 'Dienstag', week: 1 },
  { id: 5112, title: 'Boden unter Backstation schrubben', description: 'Boden unter der Backstation gründlich schrubben.', category: 'Sonderputz Backbereich', shift: 'Mittel', recurrence: 'weekly', day: 'Dienstag', week: 1 },
  { id: 5113, title: 'Menüboard vorne reinigen', description: 'Menüboard vorne mit Glasreiniger reinigen.', category: 'Sonderputz Technik', shift: 'Spät', recurrence: 'weekly', day: 'Dienstag', week: 1 },
  { id: 5114, title: 'Menüboard Rückseite entstauben', description: 'Rückseite des Menüboards entstauben.', category: 'Sonderputz Technik', shift: 'Spät', recurrence: 'weekly', day: 'Dienstag', week: 1 },
  { id: 5115, title: 'Klimaanlagengitter entstauben', description: 'Klimaanlagengitter entstauben.', category: 'Sonderputz Technik', shift: 'Spät', recurrence: 'weekly', day: 'Dienstag', week: 1 },
  { id: 5121, title: 'Regale im Kühlraum abwischen', description: 'Regale im Kühlraum feucht abwischen.', category: 'Sonderputz Kühlraum', shift: 'Früh', recurrence: 'weekly', day: 'Mittwoch', week: 1 },
  { id: 5122, title: 'Bleche im Kühlraum wechseln', description: 'Bleche im Kühlraum wechseln bzw. reinigen.', category: 'Sonderputz Kühlraum', shift: 'Mittel', recurrence: 'weekly', day: 'Mittwoch', week: 1 },
  { id: 5123, title: 'Soßencambros tauschen', description: 'Soßencambros tauschen und reinigen.', category: 'Sonderputz Kühlraum', shift: 'Spät', recurrence: 'weekly', day: 'Mittwoch', week: 1 },
  { id: 5124, title: 'Kühlungsboden wischen', description: 'Boden im Kühlraum wischen.', category: 'Sonderputz Kühlraum', shift: 'Spät', recurrence: 'weekly', day: 'Mittwoch', week: 1 },
  { id: 5131, title: 'Fächer unter Theke auswischen', description: 'Fächer unter der Theke vollständig auswischen.', category: 'Sonderputz Theke', shift: 'Früh', recurrence: 'weekly', day: 'Donnerstag', week: 1 },
  { id: 5132, title: 'Kondensatoren entstauben', description: 'Kondensatoren an Geräten entstauben.', category: 'Sonderputz Technik', shift: 'Mittel', recurrence: 'weekly', day: 'Donnerstag', week: 1 },
  { id: 5133, title: 'Küche schrubben inkl. unter Regal', description: 'Küchenboden und Bereich unter Regalen gründlich schrubben.', category: 'Sonderputz Küche', shift: 'Spät', recurrence: 'weekly', day: 'Donnerstag', week: 1 },
  { id: 5134, title: 'Graue Kisten reinigen', description: 'Graue Kisten komplett reinigen.', category: 'Sonderputz Küche', shift: 'Spät', recurrence: 'weekly', day: 'Donnerstag', week: 1 },
  { id: 5141, title: 'Fliesen Kundentoilette abwaschen', description: 'Fliesen in der Kundentoilette abwaschen.', category: 'Sonderputz Sanitär', shift: 'Früh', recurrence: 'weekly', day: 'Freitag', week: 1 },
  { id: 5142, title: 'Waschbecken Kundentoilette reinigen', description: 'Waschbecken in der Kundentoilette gründlich reinigen.', category: 'Sonderputz Sanitär', shift: 'Mittel', recurrence: 'weekly', day: 'Freitag', week: 1 },
  { id: 5143, title: 'Toilette komplett schrubben', description: 'Toilette in der Kundentoilette komplett schrubben.', category: 'Sonderputz Sanitär', shift: 'Spät', recurrence: 'weekly', day: 'Freitag', week: 1 },
  { id: 5151, title: 'Retarder reinigen', description: 'Retarder inkl. Schienen innen & außen reinigen.', category: 'Sonderputz Theke', shift: 'Früh', recurrence: 'weekly', day: 'Samstag', week: 1 },
  { id: 5152, title: 'Bodenrandleisten Thekenbereich reinigen', description: 'Bodenrandleisten im Thekenbereich reinigen.', category: 'Sonderputz Theke', shift: 'Spät', recurrence: 'weekly', day: 'Samstag', week: 1 },
  { id: 5161, title: 'Getränkekühlschrank komplett reinigen', description: 'Getränkekühlschrank innen & außen reinigen.', category: 'Sonderputz Lobby', shift: 'Früh', recurrence: 'weekly', day: 'Sonntag', week: 1 },
  { id: 5162, title: 'Müllstationen & Tonnen reinigen', description: 'Müllstationen innen & außen inkl. Tonnen reinigen.', category: 'Sonderputz Müll', shift: 'Spät', recurrence: 'weekly', day: 'Sonntag', week: 1 },

  // WÖCHENTLICHE AUFGABEN - WOCHE 2
  { id: 5201, title: 'Lichtleiste über Theke abwischen', description: 'Lichtleiste über der Theke mit geeigneten Reinigungsmitteln abwischen.', category: 'Sonderputz Decke/Theke', shift: 'Früh', recurrence: 'weekly', day: 'Montag', week: 2 },
  { id: 5202, title: 'Decken & Lüftungsgitter entstauben', description: 'Alle Decken inkl. Lüftungsgitter sorgfältig entstauben.', category: 'Sonderputz Decke/Theke', shift: 'Mittel', recurrence: 'weekly', day: 'Montag', week: 2 },
  { id: 5203, title: 'Schrank unter Handwaschbecken reinigen', description: 'Schrank unter dem Handwaschbecken vollständig ausräumen und reinigen.', category: 'Sonderputz Decke/Theke', shift: 'Spät', recurrence: 'weekly', day: 'Montag', week: 2 },
  { id: 5211, title: 'Tisch-, Stuhl- und Bankbeine reinigen', description: 'Alle Tisch-, Stuhl- und Bankbeine im Gästebereich gründlich reinigen.', category: 'Sonderputz Lobby/Theke', shift: 'Früh', recurrence: 'weekly', day: 'Dienstag', week: 2 },
  { id: 5212, title: 'Sitzflächen & Lehnen reinigen', description: 'Sitzflächen und Lehnen mit Glasreiniger und Schmutzradierer reinigen.', category: 'Sonderputz Lobby/Theke', shift: 'Mittel', recurrence: 'weekly', day: 'Dienstag', week: 2 },
  { id: 5213, title: 'Wand hinter Theke feucht reinigen', description: 'Wandflächen hinter der Theke feucht abwischen.', category: 'Sonderputz Lobby/Theke', shift: 'Spät', recurrence: 'weekly', day: 'Dienstag', week: 2 },
  { id: 5214, title: 'Handschuhbox, Seifenspender, Waschbecken reinigen', description: 'Handschuhbox, Seifenspender und Waschbecken an der Theke gründlich reinigen.', category: 'Sonderputz Lobby/Theke', shift: 'Spät', recurrence: 'weekly', day: 'Dienstag', week: 2 },
  { id: 5221, title: 'Wände & Decke im Kühlraum reinigen', description: 'Wände und Decke im Kühlraum feucht reinigen.', category: 'Sonderputz Kühlraum', shift: 'Früh', recurrence: 'weekly', day: 'Mittwoch', week: 2 },
  { id: 5222, title: 'TK-/Kühlraumtür säubern', description: 'TK- und Kühlraumtüren außen und Griffe säubern.', category: 'Sonderputz Kühlraum', shift: 'Mittel', recurrence: 'weekly', day: 'Mittwoch', week: 2 },
  { id: 5223, title: 'Kühlungsboden wischen', description: 'Boden im Kühl- und TK-Bereich gründlich wischen.', category: 'Sonderputz Kühlraum', shift: 'Spät', recurrence: 'weekly', day: 'Mittwoch', week: 2 },
  { id: 5231, title: 'Wand hinter & über Arbeitstisch reinigen', description: 'Wandflächen hinter und über dem Arbeitstisch gründlich reinigen.', category: 'Sonderputz Küche/Kasse', shift: 'Früh', recurrence: 'weekly', day: 'Donnerstag', week: 2 },
  { id: 5232, title: 'Kassenbereich reinigen (Flächen & Fächer)', description: 'Kassenbereich inkl. Flächen und Fächern reinigen.', category: 'Sonderputz Küche/Kasse', shift: 'Mittel', recurrence: 'weekly', day: 'Donnerstag', week: 2 },
  { id: 5233, title: 'Safe abwischen & Boden drumherum schrubben', description: 'Safe abwischen und Boden im Bereich des Safes schrubben.', category: 'Sonderputz Küche/Kasse', shift: 'Spät', recurrence: 'weekly', day: 'Donnerstag', week: 2 },
  { id: 5241, title: 'Alle Türen & Rahmen abwaschen', description: 'Alle Innen- und ggf. Eingangstüren sowie Türrahmen abwaschen.', category: 'Sonderputz Eingang/Türen', shift: 'Früh', recurrence: 'weekly', day: 'Freitag', week: 2 },
  { id: 5242, title: 'Eingangstüren mit Glasreiniger reinigen', description: 'Eingangstüren innen und außen mit Glasreiniger reinigen.', category: 'Sonderputz Eingang/Türen', shift: 'Spät', recurrence: 'weekly', day: 'Freitag', week: 2 },
  { id: 5251, title: 'Brotwagen neben Backstation reinigen', description: 'Brotwagen neben der Backstation gründlich reinigen.', category: 'Sonderputz Backbereich', shift: 'Früh', recurrence: 'weekly', day: 'Samstag', week: 2 },
  { id: 5252, title: 'Oberseiten Geräte rückseitige Thekenseite reinigen', description: 'Oberseiten der Geräte auf der rückseitigen Thekenseite reinigen.', category: 'Sonderputz Backbereich', shift: 'Mittel', recurrence: 'weekly', day: 'Samstag', week: 2 },
  { id: 5253, title: 'Backcounter rauswischen & desinfizieren', description: 'Backcounter komplett rauswischen und desinfizieren.', category: 'Sonderputz Backbereich', shift: 'Spät', recurrence: 'weekly', day: 'Samstag', week: 2 },
  { id: 5261, title: 'Lobby schrubben (Bereich Tische & Stühle)', description: 'Lobbyboden im Bereich der Tische und Stühle gründlich schrubben.', category: 'Sonderputz Lobby', shift: 'Spät', recurrence: 'weekly', day: 'Sonntag', week: 2 },

  // WÖCHENTLICHE AUFGABEN - WOCHE 3
  { id: 5301, title: 'Stuhllehnen & Tischplatten reinigen', description: 'Stuhllehnen und Tischplatten mit Schmutzradierer reinigen.', category: 'Sonderputz Lobby', shift: 'Früh', recurrence: 'weekly', day: 'Montag', week: 3 },
  { id: 5302, title: 'Alle Wände in der Lobby abwischen', description: 'Sämtliche Wände im Lobbybereich feucht abwischen.', category: 'Sonderputz Lobby', shift: 'Mittel', recurrence: 'weekly', day: 'Montag', week: 3 },
  { id: 5303, title: 'Bilder & Logo entstauben', description: 'Bilder und Subway-Logo in der Lobby entstauben.', category: 'Sonderputz Lobby', shift: 'Spät', recurrence: 'weekly', day: 'Montag', week: 3 },
  { id: 5311, title: 'Gärschrank auseinanderbauen & reinigen', description: 'Gärschrank inkl. Rückwand auseinanderbauen und gründlich reinigen.', category: 'Sonderputz Backstation/Technik', shift: 'Früh', recurrence: 'weekly', day: 'Dienstag', week: 3 },
  { id: 5312, title: 'Boden unter Backstation schrubben', description: 'Boden unter der Backstation gründlich schrubben.', category: 'Sonderputz Backstation/Technik', shift: 'Mittel', recurrence: 'weekly', day: 'Dienstag', week: 3 },
  { id: 5313, title: 'Menüboard reinigen', description: 'Menüboard vorne vollständig reinigen.', category: 'Sonderputz Backstation/Technik', shift: 'Spät', recurrence: 'weekly', day: 'Dienstag', week: 3 },
  { id: 5314, title: 'Rückseite Menüboard entstauben', description: 'Rückseite des Menüboards entstauben.', category: 'Sonderputz Backstation/Technik', shift: 'Spät', recurrence: 'weekly', day: 'Dienstag', week: 3 },
  { id: 5321, title: 'Regale im Kühlraum abwischen', description: 'Regale im Kühlraum feucht abwischen.', category: 'Sonderputz Kühlraum', shift: 'Früh', recurrence: 'weekly', day: 'Mittwoch', week: 3 },
  { id: 5322, title: 'Bleche im Kühlraum wechseln', description: 'Bleche im Kühlraum tauschen bzw. reinigen.', category: 'Sonderputz Kühlraum', shift: 'Mittel', recurrence: 'weekly', day: 'Mittwoch', week: 3 },
  { id: 5323, title: 'Soßencambros tauschen', description: 'Soßencambros tauschen und reinigen.', category: 'Sonderputz Kühlraum', shift: 'Spät', recurrence: 'weekly', day: 'Mittwoch', week: 3 },
  { id: 5324, title: 'Kühlungsboden wischen', description: 'Boden im Kühlraum gründlich wischen.', category: 'Sonderputz Kühlraum', shift: 'Spät', recurrence: 'weekly', day: 'Mittwoch', week: 3 },
  { id: 5331, title: 'Grünes Regal über Spüle reinigen', description: 'Grünes Regal über der Spüle vollständig reinigen.', category: 'Sonderputz Küche/Kasse', shift: 'Früh', recurrence: 'weekly', day: 'Donnerstag', week: 3 },
  { id: 5332, title: 'Fliesen im Durchgang reinigen', description: 'Fliesen im Durchgangsbereich reinigen.', category: 'Sonderputz Küche/Kasse', shift: 'Mittel', recurrence: 'weekly', day: 'Donnerstag', week: 3 },
  { id: 5333, title: 'Spülbecken entkalken', description: 'Spülbecken gründlich entkalken.', category: 'Sonderputz Küche/Kasse', shift: 'Spät', recurrence: 'weekly', day: 'Donnerstag', week: 3 },
  { id: 5334, title: 'Kassenbereich reinigen', description: 'Kassenbereich komplett reinigen.', category: 'Sonderputz Küche/Kasse', shift: 'Spät', recurrence: 'weekly', day: 'Donnerstag', week: 3 },
  { id: 5335, title: 'Safe + Boden drumherum reinigen', description: 'Safe und den Bodenbereich drumherum gründlich reinigen.', category: 'Sonderputz Küche/Kasse', shift: 'Spät', recurrence: 'weekly', day: 'Donnerstag', week: 3 },
  { id: 5341, title: 'Kundentoilette komplett schrubben', description: 'Kundentoilette inkl. Fliesen, Waschbecken und Toilette gründlich schrubben.', category: 'Sonderputz Toiletten/Küche', shift: 'Früh', recurrence: 'weekly', day: 'Freitag', week: 3 },
  { id: 5342, title: 'Arbeitstisch mit Schublade reinigen', description: 'Arbeitstisch mit Schublade gründlich reinigen.', category: 'Sonderputz Toiletten/Küche', shift: 'Mittel', recurrence: 'weekly', day: 'Freitag', week: 3 },
  { id: 5343, title: 'Wand hinter Vorbereitungstisch & Boden darunter', description: 'Wand hinter dem Vorbereitungstisch und Boden darunter reinigen.', category: 'Sonderputz Toiletten/Küche', shift: 'Spät', recurrence: 'weekly', day: 'Freitag', week: 3 },
  { id: 5351, title: 'Brotwagen neben Theke gründlich reinigen', description: 'Brotwagen neben der Theke inkl. Schienen gründlich reinigen.', category: 'Sonderputz Theke/Brotwagen', shift: 'Früh', recurrence: 'weekly', day: 'Samstag', week: 3 },
  { id: 5352, title: 'Bodenrandleisten im Thekenbereich reinigen', description: 'Bodenrandleisten im Bereich der Theke reinigen.', category: 'Sonderputz Theke/Brotwagen', shift: 'Spät', recurrence: 'weekly', day: 'Samstag', week: 3 },
  { id: 5361, title: 'Getränkekühlschrank innen & außen reinigen', description: 'Getränkekühlschrank innen und außen reinigen.', category: 'Sonderputz Kühlschrank/Müll', shift: 'Früh', recurrence: 'weekly', day: 'Sonntag', week: 3 },
  { id: 5362, title: 'Müllstationen inkl. Tonnen reinigen', description: 'Müllstationen und Mülltonnen gründlich reinigen.', category: 'Sonderputz Kühlschrank/Müll', shift: 'Spät', recurrence: 'weekly', day: 'Sonntag', week: 3 },

  // WÖCHENTLICHE AUFGABEN - WOCHE 4
  { id: 5401, title: 'Geräte Rück- & Oberseiten reinigen', description: 'Alle Geräte-Rückseiten und Oberseiten gründlich reinigen.', category: 'Sonderputz Geräte/Decke', shift: 'Früh', recurrence: 'weekly', day: 'Montag', week: 4 },
  { id: 5402, title: 'Lichtleiste über Theke abwischen', description: 'Lichtleiste über der Theke abwischen.', category: 'Sonderputz Geräte/Decke', shift: 'Mittel', recurrence: 'weekly', day: 'Montag', week: 4 },
  { id: 5403, title: 'Decken & Lüftungsgitter entstauben', description: 'Alle Decken inkl. Lüftungsgitter entstauben.', category: 'Sonderputz Geräte/Decke', shift: 'Spät', recurrence: 'weekly', day: 'Montag', week: 4 },
  { id: 5411, title: 'Tische, Stühle & Bänke – Beine reinigen', description: 'Beine von Tischen, Stühlen und Bänken im Gästebereich reinigen.', category: 'Sonderputz Lobby/Theke', shift: 'Früh', recurrence: 'weekly', day: 'Dienstag', week: 4 },
  { id: 5412, title: 'Sitzflächen & Lehnen reinigen', description: 'Sitzflächen und Lehnen im Gästebereich reinigen.', category: 'Sonderputz Lobby/Theke', shift: 'Mittel', recurrence: 'weekly', day: 'Dienstag', week: 4 },
  { id: 5413, title: 'Wand hinter Theke reinigen', description: 'Wand hinter der Theke gründlich reinigen.', category: 'Sonderputz Lobby/Theke', shift: 'Spät', recurrence: 'weekly', day: 'Dienstag', week: 4 },
  { id: 5414, title: 'Handschuhbox, Seifenspender, Waschbecken reinigen', description: 'Handschuhbox, Seifenspender und Waschbecken reinigen.', category: 'Sonderputz Lobby/Theke', shift: 'Spät', recurrence: 'weekly', day: 'Dienstag', week: 4 },
  { id: 5421, title: 'TK & Kühlraum außen reinigen', description: 'Tiefkühl- und Kühlraum von außen reinigen.', category: 'Sonderputz Kühlraum', shift: 'Früh', recurrence: 'weekly', day: 'Mittwoch', week: 4 },
  { id: 5422, title: 'Kühlraumtür innen reinigen', description: 'Kühlraumtür innen reinigen.', category: 'Sonderputz Kühlraum', shift: 'Mittel', recurrence: 'weekly', day: 'Mittwoch', week: 4 },
  { id: 5423, title: 'Kühlungsboden wischen', description: 'Boden im Kühlbereich wischen.', category: 'Sonderputz Kühlraum', shift: 'Spät', recurrence: 'weekly', day: 'Mittwoch', week: 4 },
  { id: 5431, title: 'Kassenbereich reinigen', description: 'Kassenbereich gründlich reinigen.', category: 'Sonderputz Kasse/Spülbereich', shift: 'Früh', recurrence: 'weekly', day: 'Donnerstag', week: 4 },
  { id: 5432, title: 'Safe + Boden drumherum reinigen', description: 'Safe und Boden im Bereich des Safes reinigen.', category: 'Sonderputz Kasse/Spülbereich', shift: 'Mittel', recurrence: 'weekly', day: 'Donnerstag', week: 4 },
  { id: 5433, title: 'Spülmaschine innen & außen reinigen', description: 'Spülmaschine innen und außen gründlich reinigen.', category: 'Sonderputz Kasse/Spülbereich', shift: 'Spät', recurrence: 'weekly', day: 'Donnerstag', week: 4 },
  { id: 5434, title: 'Boden unter Spüle & Spülmaschine schrubben', description: 'Boden unter Spüle und Spülmaschine gründlich schrubben.', category: 'Sonderputz Kasse/Spülbereich', shift: 'Spät', recurrence: 'weekly', day: 'Donnerstag', week: 4 },
  { id: 5435, title: 'Schmutzwaschbecken gründlich reinigen', description: 'Schmutzwaschbecken komplett reinigen.', category: 'Sonderputz Kasse/Spülbereich', shift: 'Spät', recurrence: 'weekly', day: 'Donnerstag', week: 4 },
  { id: 5441, title: 'Mitarbeitertoilette schrubben', description: 'Mitarbeitertoilette vollständig schrubben.', category: 'Sonderputz Mitarbeitertoilette/Küche', shift: 'Früh', recurrence: 'weekly', day: 'Freitag', week: 4 },
  { id: 5442, title: 'Fliesen & Waschbecken reinigen', description: 'Fliesen und Waschbecken in der Mitarbeitertoilette reinigen.', category: 'Sonderputz Mitarbeitertoilette/Küche', shift: 'Mittel', recurrence: 'weekly', day: 'Freitag', week: 4 },
  { id: 5443, title: 'Grünes Regal über Spüle + Wand dahinter', description: 'Grünes Regal über der Spüle und Wand dahinter reinigen.', category: 'Sonderputz Mitarbeitertoilette/Küche', shift: 'Spät', recurrence: 'weekly', day: 'Freitag', week: 4 },
  { id: 5444, title: 'Mülltonnen im Küchenbereich auswaschen', description: 'Mülltonnen im Küchenbereich gründlich auswaschen.', category: 'Sonderputz Mitarbeitertoilette/Küche', shift: 'Spät', recurrence: 'weekly', day: 'Freitag', week: 4 },
  { id: 5451, title: 'Brotwagen Vorbereitungsbereich reinigen', description: 'Brotwagen im Vorbereitungsbereich gründlich reinigen.', category: 'Sonderputz Vorbereitung/Backbereich', shift: 'Früh', recurrence: 'weekly', day: 'Samstag', week: 4 },
  { id: 5452, title: 'Backcounter rauswischen & desinfizieren', description: 'Backcounter vollständig rauswischen und desinfizieren.', category: 'Sonderputz Vorbereitung/Backbereich', shift: 'Spät', recurrence: 'weekly', day: 'Samstag', week: 4 },
  { id: 5461, title: 'Lobby schrubben (Gehwege)', description: 'Lobby-Gehwege gründlich schrubben.', category: 'Sonderputz Lobby', shift: 'Spät', recurrence: 'weekly', day: 'Sonntag', week: 4 },
];

async function importTasks() {
  const client = await pool.connect();

  try {
    console.log('Lösche bestehende Task-Templates...');
    await client.query('DELETE FROM tasks');
    await client.query('DELETE FROM task_templates');
    await client.query('ALTER SEQUENCE task_templates_id_seq RESTART WITH 1');

    console.log(`Importiere ${tasks.length} Aufgaben-Templates...`);

    let count = 0;
    for (const task of tasks) {
      const shift = shiftMap[task.shift] || 'beide';
      const recurrence = task.recurrence;
      const recurrenceDay = task.day ? dayMap[task.day] : null;

      // Für wöchentliche Aufgaben mit Wochennummer: Speichere die Woche im recurrence_day Feld
      // Format: "monday_w1" für Montag Woche 1
      let finalRecurrenceDay = recurrenceDay;
      if (task.week && recurrenceDay) {
        finalRecurrenceDay = `${recurrenceDay}_w${task.week}`;
      }

      await client.query(
        `INSERT INTO task_templates (title, description, category, shift, recurrence, recurrence_day, requires_photo)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [task.title, task.description, task.category, shift, recurrence, finalRecurrenceDay, 0]
      );
      count++;

      if (count % 20 === 0) {
        console.log(`  ${count} Templates importiert...`);
      }
    }

    console.log(`\n✅ ${count} Aufgaben-Templates erfolgreich importiert!`);

    // Zeige Zusammenfassung
    const summary = await client.query(`
      SELECT recurrence, COUNT(*) as count
      FROM task_templates
      GROUP BY recurrence
    `);

    console.log('\nZusammenfassung:');
    summary.rows.forEach(row => {
      console.log(`  ${row.recurrence}: ${row.count} Templates`);
    });

  } catch (error) {
    console.error('Fehler:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

importTasks();
