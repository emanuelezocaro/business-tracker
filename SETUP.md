# Business Tracker — Setup

## 1. Crea il progetto Firebase (5 minuti)

1. Vai su https://console.firebase.google.com
2. Clicca **"Crea progetto"** → dai un nome (es. `business-tracker`)
3. Disabilita Google Analytics (non serve) → **Crea progetto**
4. Nel menu laterale: **Firestore Database** → **Crea database**
   - Seleziona **"Inizia in modalità test"** (valida 30 giorni, poi imposta le regole)
   - Scegli la regione più vicina (es. `eur3`)
5. Nel menu laterale: **Impostazioni progetto** (icona ⚙️) → **Le tue app** → icona `</>`
6. Dai un nome all'app → **Registra app**
7. Copia l'oggetto `firebaseConfig` che appare — ti servirà nel passo successivo

## 2. Configura le variabili d'ambiente

Copia il file di esempio e riempilo con i tuoi dati Firebase:

```bash
cp .env.example .env
```

Apri `.env` e incolla i valori dall'oggetto `firebaseConfig`:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=tuo-progetto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tuo-progetto
VITE_FIREBASE_STORAGE_BUCKET=tuo-progetto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

## 3. Avvia in locale (per testare)

```bash
npm install
npm run dev
```

Apri http://localhost:5173

## 4. Deploy su Vercel (accesso da ovunque)

1. Installa Vercel CLI: `npm install -g vercel`
2. Dalla cartella del progetto: `vercel`
3. Segui le istruzioni (login con GitHub/email)
4. Nella dashboard Vercel → il tuo progetto → **Settings → Environment Variables**
   - Aggiungi tutte le variabili `VITE_*` dal tuo `.env`
5. Rideploya: `vercel --prod`

Vercel genera un URL tipo `https://business-tracker-xxx.vercel.app`
→ salvalo come segnalibro sul telefono e su PC.

## 5. Sicurezza Firestore (dopo i 30 giorni di test)

Nel pannello Firebase → Firestore → **Regole**, sostituisci con:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /entries/{document} {
      allow read, write: if true; // per uso personale va bene
    }
  }
}
```

> Per un uso davvero sicuro aggiungi Firebase Authentication.

## Struttura del progetto

```
src/
  components/
    Dashboard.jsx    ← KPI + grafico mensile
    AddEntry.jsx     ← Form aggiunta voce
    EntryList.jsx    ← Lista voci filtrabili
    Analysis.jsx     ← Breakdown per categoria
  hooks/
    useEntries.js    ← Logica Firestore (sync real-time)
  constants.js       ← Tipi e categorie
  firebase.js        ← Inizializzazione Firebase
```
