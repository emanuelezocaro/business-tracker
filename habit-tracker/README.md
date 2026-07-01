# Weekly — Habit Tracker

App per tracciare ogni giorno le tue attività ricorrenti (leggere, sport, inglese, LinkedIn, ecc.) e vedere un report settimanale/mensile.

- 4 sezioni: **Oggi** (spunta le attività di oggi/giorni passati), **Settimana** (griglia attività × giorni), **Report** (% completamento, streak), **Attività** (aggiungi/modifica/elimina).
- Dati salvati solo sul telefono (`localStorage`), nessun account, nessun server.
- Installabile come app (PWA): icona sulla home, schermo intero, funziona offline.

## Sviluppo locale

```bash
cd habit-tracker
npm install
npm run dev
```

Apri http://localhost:5173

## Deploy e installazione su iPhone

1. Deploy su Vercel (dalla cartella `habit-tracker`):
   ```bash
   npm install -g vercel
   vercel
   vercel --prod
   ```
2. Apri l'URL generato con **Safari** sull'iPhone (non Chrome: "Aggiungi a Home" richiede Safari).
3. Tocca l'icona **Condividi** → **Aggiungi a Home**.
4. L'app compare come icona sulla home, si apre a schermo intero e funziona anche offline.
