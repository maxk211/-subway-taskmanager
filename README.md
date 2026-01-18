# Subway Taskmanager

Ein professioneller Taskmanager für 9 Subway Restaurants mit Mitarbeiterverwaltung, wiederkehrenden Aufgaben und umfangreichen Dashboard-Funktionen.

## 🚀 Als Webapp deployen

**Schnellstart (15 Minuten)**: Siehe [QUICK-START.md](QUICK-START.md)

**Detaillierte Anleitung**: Siehe [DEPLOYMENT.md](DEPLOYMENT.md)

**Hosting**:
- Frontend: Vercel (kostenlos)
- Backend: Railway (Free Tier verfügbar)
- Datenbank: PostgreSQL auf Railway (inklusive)

## Features

- **Authentifizierung mit 3 Rollen**: Admin, Manager, Mitarbeiter
- **Dashboard**: Übersicht über alle Tasks, Stores und Mitarbeiter-Performance
- **Wiederkehrende Aufgaben**: Täglich, wöchentlich oder monatlich
- **Schichtbasiert**: Frühschicht und Spätschicht
- **Foto-Upload**: Mitarbeiter können Fotos als Aufgabennachweis hochladen
- **Reports**: Excel- und PDF-Export für Analysen
- **Mobile-First**: Optimiert für Tablets und Smartphones
- **Automatische Task-Generierung**: Täglich um 1 Uhr nachts via Cron-Job

## Technologie-Stack

### Backend
- Node.js + Express
- SQLite (einfach migrierbar auf PostgreSQL)
- JWT-Authentifizierung
- Multer für Datei-Uploads
- ExcelJS & PDFKit für Reports

### Frontend
- React 18
- React Router für Navigation
- Tailwind CSS für modernes Design
- Recharts für Statistik-Visualisierung
- Heroicons für Icons
- React Hot Toast für Benachrichtigungen

## Installation

### Voraussetzungen
- Node.js (v16 oder höher)
- npm oder yarn

### Backend Setup

1. In den Backend-Ordner wechseln:
```bash
cd subway-taskmanager/backend
```

2. Dependencies installieren:
```bash
npm install
```

3. Environment-Datei erstellen:
```bash
cp .env.example .env
```

4. `.env` Datei bearbeiten und JWT_SECRET anpassen:
```
PORT=5000
JWT_SECRET=dein-super-geheimer-jwt-schluessel-hier-aendern
NODE_ENV=development
UPLOAD_PATH=./uploads
```

5. Datenbank initialisieren:
```bash
npm run init-db
```

6. Backend starten:
```bash
npm run dev
```

Der Backend-Server läuft nun auf `http://localhost:5000`

### Frontend Setup

1. Neues Terminal öffnen und in den Frontend-Ordner wechseln:
```bash
cd subway-taskmanager/frontend
```

2. Dependencies installieren:
```bash
npm install
```

3. Frontend starten:
```bash
npm start
```

Das Frontend läuft nun auf `http://localhost:3000`

## Standard-Zugangsdaten

Nach der Datenbank-Initialisierung sind folgende Benutzer verfügbar:

- **Admin**:
  - Username: `admin`
  - Passwort: `admin123`

- **Manager** (Store 1):
  - Username: `manager1`
  - Passwort: `manager123`

- **Mitarbeiter** (Store 1):
  - Username: `mitarbeiter1`
  - Passwort: `mitarbeiter123`

## Funktionen nach Rolle

### Admin
- Zugriff auf alle 9 Stores
- Dashboard mit Gesamtübersicht
- Store-Verwaltung
- Mitarbeiter-Verwaltung (alle Stores)
- Aufgabenvorlagen erstellen/bearbeiten
- Reports exportieren
- Statistiken einsehen

### Manager
- Zugriff auf zugewiesenen Store
- Dashboard für eigenen Store
- Mitarbeiter-Verwaltung (eigener Store)
- Aufgaben generieren
- Reports exportieren
- Statistiken einsehen

### Mitarbeiter
- Eigene Aufgaben ansehen
- Aufgaben als erledigt markieren
- Fotos hochladen (falls erforderlich)
- Notizen zu Aufgaben hinzufügen

## Aufgaben-System

### Aufgabenvorlagen
Aufgabenvorlagen definieren wiederkehrende Aufgaben:

- **Täglich**: Wird jeden Tag generiert
- **Wöchentlich**: An einem bestimmten Wochentag
- **Monatlich**: An einem bestimmten Tag im Monat
- **Einmalig**: Nur einmal

### Schichten
- **Frühschicht**: Aufgaben für die Frühschicht
- **Spätschicht**: Aufgaben für die Spätschicht
- **Beide**: Aufgaben für beide Schichten (generiert 2 separate Tasks)

### Standard-Aufgaben
Das System kommt mit vordefinierten Aufgaben:

1. Brot-Bestand prüfen (täglich, Frühschicht)
2. Kühlschrank-Temperaturen kontrollieren (täglich, beide Schichten)
3. Kassenabrechnung (täglich, Spätschicht)
4. Gründliche Reinigung der Ausgabe (täglich, Spätschicht, Foto erforderlich)
5. Warenbestellung prüfen (wöchentlich, Montag, Frühschicht)
6. Tiefenreinigung Küche (wöchentlich, Sonntag, Spätschicht, Foto erforderlich)
7. Inventur (monatlich, beide Schichten)

## Automatische Task-Generierung

Ein Cron-Job läuft täglich um 1:00 Uhr nachts und generiert automatisch alle fälligen Aufgaben für den Tag.

Manuelle Generierung ist über die UI möglich (Admin/Manager):
1. Zu "Meine Aufgaben" navigieren
2. Datum auswählen
3. Store auswählen
4. "Aufgaben generieren" klicken

## Reports

### Excel-Export
- Detaillierte Aufgabenliste mit allen Informationen
- Filterbar nach Zeitraum und Store
- Ideal für detaillierte Analysen

### PDF-Export
- Kompakte Zusammenfassung
- Gesamtstatistiken
- Performance pro Store
- Ideal für Management-Reports

## Mobile Optimierung

Die Anwendung ist vollständig responsive und optimiert für:
- Desktop-Browser
- Tablets (iPad, Android Tablets)
- Smartphones (iOS, Android)

Features:
- Touch-optimierte Bedienung
- Kamera-Integration für Foto-Upload
- Optimierte Layouts für kleine Bildschirme

## Datenbank-Schema

### Stores
- id, name, address, city

### Users
- id, username, password, full_name, email, role, store_id, active

### Task Templates
- id, title, description, category, shift, recurrence, recurrence_day, store_id, requires_photo

### Tasks
- id, template_id, store_id, title, description, shift, due_date, status, completed_by, completed_at, photo_path, notes

## Erweiterungsmöglichkeiten

Das System ist erweiterbar für:

1. **Push-Benachrichtigungen**: Integration mit Firebase Cloud Messaging
2. **E-Mail-Benachrichtigungen**: Bei überfälligen Aufgaben
3. **Echtzeit-Updates**: Mit WebSockets
4. **Barcode-Scanner**: Für Inventur
5. **Zeiterfassung**: Integration mit Arbeitszeiterfassung
6. **Multi-Tenancy**: Für Franchise-Betrieb

## Produktion

### Backend für Produktion vorbereiten

1. Environment-Variablen setzen:
```bash
NODE_ENV=production
JWT_SECRET=sicherer-produktions-schluessel
PORT=5000
```

2. Build erstellen:
```bash
npm run build
```

3. Mit PM2 oder ähnlichem Process Manager starten:
```bash
pm2 start server.js --name subway-taskmanager
```

### Frontend für Produktion vorbereiten

1. Build erstellen:
```bash
npm run build
```

2. Build-Ordner mit Webserver (nginx, Apache) ausliefern

3. API-URL konfigurieren:
```bash
REACT_APP_API_URL=https://api.deine-domain.de/api
```

## Support & Entwicklung

Entwickelt für 9 Subway Restaurants mit Fokus auf:
- Einfache Bedienung
- Zuverlässigkeit
- Mobile-First
- Skalierbarkeit

## Lizenz

Proprietär - Entwickelt für Subway Restaurant-Betrieb
