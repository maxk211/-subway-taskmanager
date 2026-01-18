# Deployment-Anleitung für Subway Taskmanager

Diese Anleitung zeigt dir Schritt für Schritt, wie du den Subway Taskmanager als Webapp auf Vercel (Frontend) und Railway (Backend + PostgreSQL) deployed.

## Voraussetzungen

- GitHub Account
- Vercel Account (kostenlos bei https://vercel.com)
- Railway Account (kostenlos bei https://railway.app)
- Git installiert auf deinem Computer

## Schritt 1: Code zu GitHub hochladen

1. Erstelle ein neues Repository auf GitHub:
   - Gehe zu https://github.com/new
   - Name: `subway-taskmanager`
   - Privat oder Öffentlich nach Wunsch
   - Klicke "Create repository"

2. Lade den Code hoch:

```bash
cd subway-taskmanager
git init
git add .
git commit -m "Initial commit - Subway Taskmanager"
git branch -M main
git remote add origin https://github.com/DEIN-USERNAME/subway-taskmanager.git
git push -u origin main
```

## Schritt 2: Backend auf Railway deployen

### 2.1 Railway Projekt erstellen

1. Gehe zu https://railway.app und logge dich ein
2. Klicke auf "New Project"
3. Wähle "Deploy from GitHub repo"
4. Wähle dein `subway-taskmanager` Repository
5. Railway erkennt automatisch das Node.js Projekt

### 2.2 PostgreSQL Datenbank hinzufügen

1. In deinem Railway Projekt, klicke auf "+ New"
2. Wähle "Database" → "Add PostgreSQL"
3. Railway erstellt automatisch eine PostgreSQL Datenbank
4. Die `DATABASE_URL` wird automatisch als Environment Variable gesetzt

### 2.3 Backend-Service konfigurieren

1. Klicke auf dein Backend-Service (subway-taskmanager)
2. Gehe zu "Settings"
3. Unter "Root Directory" setze: `backend`
4. Unter "Start Command" setze: `npm start`

### 2.4 Environment Variables setzen

1. Gehe zu "Variables"
2. Füge folgende Variablen hinzu:

```
NODE_ENV=production
JWT_SECRET=GENERIERE-HIER-EINEN-SICHEREN-RANDOM-STRING
UPLOAD_PATH=/app/uploads
```

**Wichtig**: Für `JWT_SECRET` verwende einen sicheren, zufälligen String. Du kannst einen generieren mit:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2.5 Datenbank initialisieren

1. Gehe zu "Deployments"
2. Warte bis das erste Deployment abgeschlossen ist
3. Klicke auf das neueste Deployment
4. Öffne die "Logs" und prüfe ob alles funktioniert
5. Gehe zu "Settings" → "Metrics"
6. Unter "Environment" findest du die `DATABASE_URL`

7. Verbinde dich zur Datenbank und initialisiere sie:
   - Gehe zu deinem PostgreSQL Service
   - Klicke auf "Connect"
   - Kopiere die Connection Details

8. Auf deinem lokalen Computer:

```bash
cd backend
export DATABASE_URL="postgresql://..."  # Die URL von Railway
npm run init-postgres
```

Alternative: Nutze Railway CLI:

```bash
# Railway CLI installieren
npm install -g @railway/cli

# Einloggen
railway login

# Mit Projekt verbinden
railway link

# Datenbank initialisieren
railway run npm run init-postgres
```

### 2.6 Backend URL notieren

1. Gehe zu deinem Backend-Service in Railway
2. Klicke auf "Settings" → "Networking"
3. Klicke auf "Generate Domain"
4. Notiere die URL (z.B. `https://subway-taskmanager-production.up.railway.app`)

## Schritt 3: Frontend auf Vercel deployen

### 3.1 Vercel Projekt erstellen

1. Gehe zu https://vercel.com und logge dich ein
2. Klicke auf "Add New..." → "Project"
3. Importiere dein GitHub Repository `subway-taskmanager`
4. Vercel erkennt automatisch das React Projekt

### 3.2 Build-Konfiguration

1. **Root Directory**: `frontend`
2. **Framework Preset**: Create React App
3. **Build Command**: `npm run build`
4. **Output Directory**: `build`

### 3.3 Environment Variables setzen

Unter "Environment Variables" füge hinzu:

```
REACT_APP_API_URL=https://DEINE-RAILWAY-URL/api
```

**Wichtig**: Ersetze `DEINE-RAILWAY-URL` mit der URL aus Schritt 2.6 (ohne trailing slash nach `/api`)

Beispiel:
```
REACT_APP_API_URL=https://subway-taskmanager-production.up.railway.app/api
```

### 3.4 Deployen

1. Klicke auf "Deploy"
2. Vercel baut und deployt deine App
3. Nach ca. 2-3 Minuten ist deine App fertig
4. Notiere die URL (z.B. `https://subway-taskmanager.vercel.app`)

## Schritt 4: CORS konfigurieren

1. Gehe zurück zu Railway
2. Öffne dein Backend-Service
3. Gehe zu "Variables"
4. Füge hinzu:

```
CORS_ORIGIN=https://DEINE-VERCEL-URL
```

Beispiel:
```
CORS_ORIGIN=https://subway-taskmanager.vercel.app
```

5. Das Backend wird automatisch neu deployed

## Schritt 5: Testen

1. Öffne deine Vercel URL im Browser
2. Logge dich ein mit:
   - Username: `admin`
   - Passwort: `admin123`

3. Teste alle Funktionen:
   - Dashboard
   - Aufgaben erstellen
   - Aufgaben als erledigt markieren
   - Foto hochladen
   - Reports exportieren

## Wichtige URLs nach dem Deployment

- **Frontend**: https://subway-taskmanager.vercel.app
- **Backend API**: https://subway-taskmanager-production.up.railway.app
- **Health Check**: https://subway-taskmanager-production.up.railway.app/health

## Standard-Zugangsdaten

**WICHTIG**: Ändere diese Passwörter sofort nach dem ersten Login!

- **Admin**:
  - Username: `admin`
  - Passwort: `admin123`

- **Manager**:
  - Username: `manager1`
  - Passwort: `manager123`

- **Mitarbeiter**:
  - Username: `mitarbeiter1`
  - Passwort: `mitarbeiter123`

## Passwörter ändern

1. Logge dich als Admin ein
2. Gehe zu "Mitarbeiter"
3. Wähle einen Benutzer aus
4. Ändere das Passwort

Oder direkt in der Datenbank via Railway:

```bash
railway connect postgres
# Im PostgreSQL Prompt:
UPDATE users SET password = '$2a$10$NEUER_HASH' WHERE username = 'admin';
```

## Automatische Updates

### Bei Code-Änderungen:

1. **Backend**: Jeder Push zu GitHub löst automatisch ein neues Deployment auf Railway aus
2. **Frontend**: Jeder Push zu GitHub löst automatisch ein neues Deployment auf Vercel aus

```bash
git add .
git commit -m "Update: Beschreibung der Änderungen"
git push
```

## Kosten

### Railway (Backend + PostgreSQL)
- **Free Tier**: $5 Guthaben pro Monat (ausreichend für kleinere Projekte)
- **Starter Plan**: $5/Monat für mehr Ressourcen
- **Empfehlung**: Starte mit Free Tier, upgrade bei Bedarf

### Vercel (Frontend)
- **Hobby Plan**: Kostenlos
- **Pro Plan**: $20/Monat (nur bei sehr hohem Traffic nötig)
- **Empfehlung**: Hobby Plan ist ausreichend

## Monitoring & Logs

### Railway Backend Logs:
1. Gehe zu Railway Dashboard
2. Wähle dein Backend-Service
3. Klicke auf "Deployments"
4. Klicke auf aktuelles Deployment
5. Siehe "Logs"

### Vercel Frontend Logs:
1. Gehe zu Vercel Dashboard
2. Wähle dein Projekt
3. Klicke auf "Deployments"
4. Wähle Deployment
5. Siehe "Function Logs"

## Datensicherung

### PostgreSQL Backup auf Railway:

Railway macht automatische Backups, aber manuelle Backups sind empfohlen:

```bash
# Mit Railway CLI
railway connect postgres

# Dann im Terminal:
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### Regelmäßige Backups einrichten:

Erstelle einen Cron-Job auf deinem Server oder nutze einen Service wie:
- Railway Cron (in Beta)
- GitHub Actions für automatische Backups
- Externes Backup-Service

## Troubleshooting

### Backend startet nicht:
1. Prüfe Railway Logs
2. Prüfe Environment Variables (besonders `DATABASE_URL`, `JWT_SECRET`)
3. Prüfe ob PostgreSQL läuft

### Frontend kann Backend nicht erreichen:
1. Prüfe `REACT_APP_API_URL` in Vercel
2. Prüfe `CORS_ORIGIN` in Railway
3. Prüfe ob Backend Health Check funktioniert: `https://dein-backend.railway.app/health`

### Datenbank-Verbindungsfehler:
1. Prüfe ob PostgreSQL Service läuft
2. Prüfe DATABASE_URL in Railway
3. Versuche manuelle Verbindung mit `railway connect postgres`

### Uploads funktionieren nicht:
1. Prüfe `UPLOAD_PATH` Environment Variable
2. Railway verwendet ephemere Storage - für Production Uploads nutze:
   - AWS S3
   - Cloudinary
   - Vercel Blob Storage

## Production-Best-Practices

### Sicherheit:

1. **Ändere alle Standard-Passwörter**
2. **Setze starken JWT_SECRET**
3. **Aktiviere HTTPS** (automatisch bei Railway/Vercel)
4. **Rate Limiting** hinzufügen (z.B. express-rate-limit)
5. **Helmet.js** für Security Headers

### Performance:

1. **CDN nutzen** (Vercel macht das automatisch)
2. **Bilder optimieren** vor Upload
3. **Datenbank-Indizes** prüfen
4. **Caching aktivieren** für häufige Queries

### Wartung:

1. **Regelmäßige Backups**
2. **Monitoring einrichten** (z.B. Sentry)
3. **Update-Strategie** für Dependencies
4. **Log-Rotation** konfigurieren

## Support

Bei Problemen:
1. Prüfe Railway/Vercel Logs
2. Prüfe Health Check Endpoint
3. Teste Backend API direkt mit Postman/Insomnia
4. Prüfe Browser Console für Frontend-Fehler

## Nächste Schritte

Nach erfolgreichem Deployment:

1. ✅ Passwörter ändern
2. ✅ Weitere Mitarbeiter anlegen
3. ✅ Stores konfigurieren (Namen, Adressen)
4. ✅ Aufgabenvorlagen anpassen
5. ✅ Schulung der Mitarbeiter
6. ✅ Backup-Strategie implementieren
7. ✅ Monitoring einrichten

---

**Fertig!** Dein Subway Taskmanager ist jetzt als professionelle Webapp live und einsatzbereit! 🎉
