# Quick Start - Subway Taskmanager Deployment

Schnellanleitung zum Deployment in 15 Minuten!

## 1. Code zu GitHub (2 Minuten)

```bash
cd subway-taskmanager
git init
git add .
git commit -m "Initial commit"
git branch -M main
# Erstelle zuerst auf GitHub ein neues Repository "subway-taskmanager"
git remote add origin https://github.com/DEIN-USERNAME/subway-taskmanager.git
git push -u origin main
```

## 2. Backend auf Railway (5 Minuten)

1. Gehe zu https://railway.app
2. "New Project" → "Deploy from GitHub repo"
3. Wähle `subway-taskmanager`
4. "+ New" → "Database" → "Add PostgreSQL"
5. Klicke auf Backend-Service → "Settings":
   - Root Directory: `backend`
   - Start Command: `npm start`
6. "Variables" → Füge hinzu:
   ```
   NODE_ENV=production
   JWT_SECRET=[Generiere mit: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"]
   UPLOAD_PATH=/app/uploads
   ```
7. "Settings" → "Networking" → "Generate Domain"
8. **Notiere die URL!** (z.B. `https://xyz.railway.app`)

### Datenbank initialisieren:

```bash
cd backend
npm install -g @railway/cli
railway login
railway link  # Wähle dein Projekt
railway run npm run init-postgres
```

## 3. Frontend auf Vercel (5 Minuten)

1. Gehe zu https://vercel.com
2. "Add New" → "Project"
3. Importiere `subway-taskmanager` von GitHub
4. **Konfiguration**:
   - Root Directory: `frontend`
   - Framework: Create React App
   - Build Command: `npm run build`
   - Output: `build`
5. **Environment Variable**:
   ```
   REACT_APP_API_URL=https://DEINE-RAILWAY-URL/api
   ```
   (Ersetze mit URL aus Schritt 2.8)
6. "Deploy" klicken
7. **Notiere die URL!** (z.B. `https://xyz.vercel.app`)

## 4. CORS aktivieren (2 Minuten)

1. Zurück zu Railway
2. Backend-Service → "Variables"
3. Neue Variable:
   ```
   CORS_ORIGIN=https://DEINE-VERCEL-URL
   ```
   (Ersetze mit URL aus Schritt 3.7)

## 5. Fertig! Testen (1 Minute)

Öffne deine Vercel-URL im Browser:

**Login**:
- Username: `admin`
- Passwort: `admin123`

**WICHTIG**: Ändere sofort alle Passwörter!

---

## Deine URLs:

- **App**: https://______.vercel.app
- **API**: https://______.railway.app
- **Health Check**: https://______.railway.app/health

## Standard-Logins:

- Admin: `admin` / `admin123`
- Manager: `manager1` / `manager123`
- Mitarbeiter: `mitarbeiter1` / `mitarbeiter123`

---

Für detaillierte Anleitung siehe [DEPLOYMENT.md](DEPLOYMENT.md)
