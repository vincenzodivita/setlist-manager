# 🎵 Setlist Manager - PWA con Metronomo

Una Progressive Web App completa per gestire setlist musicali con metronomo integrato.

## ✨ Funzionalità Principali

### 📝 Gestione Brani
- **Modalità Semplice**: Nome, BPM e unità di tempo
- **Modalità Avanzata**: Aggiungi sezioni personalizzate (Intro, Strofa, Ritornello, ecc.)
- **Modifica e Eliminazione**: Modifica i brani in qualsiasi momento
- **Database Locale**: Tutti i brani salvati in localStorage

### 📋 Gestione Setlist
- **Crea Setlist Multiple**: Organizza i tuoi brani in diverse setlist
- **Drag & Drop**: Riordina facilmente i brani all'interno di ogni setlist
- **Aggiungi/Rimuovi**: Gestisci dinamicamente i brani nelle setlist
- **Descrizioni**: Aggiungi note e descrizioni alle setlist

### 🎼 Metronomo Integrato
- **Range BPM**: Da 30 a 300 BPM
- **Unità di Tempo**: 2/4, 3/4, 4/4, 5/4, 6/8, 7/8
- **Controlli Intuitivi**: Slider, pulsanti +/- e input diretto
- **Feedback Visivo e Audio**: Animazioni e suoni sincronizzati
- **Accento sul Primo Battito**: Distingue visivamente il battito forte
- **Integrazione con Setlist**: Carica automaticamente i parametri del brano

### 📱 Progressive Web App (PWA)
- **Installabile**: Installa l'app sul dispositivo
- **Offline Ready**: Funziona anche senza connessione internet
- **Responsive**: Ottimizzata per desktop, tablet e smartphone
- **Icone Personalizzate**: Con manifest.json completo

## 🚀 Come Utilizzare

### Avvio Rapido
1. Apri `index.html` in un browser moderno
2. L'app è pronta all'uso!

### Aggiungere un Brano

#### Modalità Semplice
1. Vai alla sezione "Brani"
2. Clicca su "+ Aggiungi Brano"
3. Inserisci:
   - Nome del brano
   - BPM (es: 120)
   - Unità di tempo (es: 4/4)
4. Clicca "Salva"

#### Modalità Avanzata
1. Segui i passi sopra
2. Attiva "Modalità Avanzata"
3. Aggiungi sezioni:
   - Intro
   - Strofa 1
   - Ritornello
   - Bridge
   - Solo
   - Outro
   - ecc.
4. Clicca "Salva"

### Creare una Setlist
1. Vai alla sezione "Setlist"
2. Clicca su "+ Nuova Setlist"
3. Inserisci nome e descrizione
4. Clicca su una setlist per aprirla
5. Usa "+ Aggiungi Brano" per selezionare i brani
6. Riordina con drag & drop

### Suonare con il Metronomo
1. Dalla setlist, clicca "▶ Avvia Setlist"
2. Il metronomo caricherà il primo brano
3. Usa i controlli per:
   - Start/Stop
   - Regolare BPM
   - Cambiare tempo
4. Se il brano ha sezioni, verranno mostrate sotto il metronomo

## 🎨 Caratteristiche del Design

- **Dark Theme**: Tema scuro ottimizzato per ambienti con poca luce
- **Animazioni Fluide**: Transizioni smooth per un'esperienza premium
- **Cards Interactive**: Hover effects e feedback visivi
- **Colori Distintivi**: 
  - Primario (Blu): Azioni principali
  - Successo (Verde): Conferme e riproduzioni
  - Pericolo (Rosso): Eliminazioni
  - Accento (Viola): Elementi secondari

## 🛠️ Tecnologie Utilizzate

- **HTML5**: Struttura semantica
- **CSS3**: Custom properties, Grid, Flexbox, Animations
- **Vanilla JavaScript**: Nessuna dipendenza esterna
- **Web Audio API**: Suoni del metronomo generati in tempo reale
- **LocalStorage API**: Persistenza dei dati
- **Service Worker**: Funzionalità offline
- **Drag and Drop API**: Riordinamento intuitivo

## 📦 Struttura dei File

```
setlist-manager/
├── index.html          # Struttura HTML principale
├── styles.css          # Tutti gli stili CSS
├── app.js             # Logica JavaScript
├── sw.js              # Service Worker per PWA
├── manifest.json      # Manifest PWA
└── README.md          # Questa documentazione
```

## 💾 Dati e Persistenza

I dati sono salvati localmente nel browser usando LocalStorage:

```javascript
// Struttura Brano
{
  id: "timestamp",
  name: "Nome Canzone",
  bpm: 120,
  timeSignature: 4,
  sections: ["Intro", "Strofa", "Ritornello"] // Opzionale
}

// Struttura Setlist
{
  id: "timestamp",
  name: "Nome Setlist",
  description: "Descrizione",
  songs: ["id1", "id2", "id3"] // Array di ID brani
}
```

## 🎯 Funzionalità Future (Idee)

- [ ] Export/Import setlist in JSON
- [ ] Condivisione setlist via link
- [ ] Timer per durata totale setlist
- [ ] Cambio automatico brano al termine
- [ ] Modalità full screen per performance live
- [ ] Statistiche e cronologia sessioni
- [ ] Temi personalizzabili
- [ ] Shortcuts da tastiera
- [ ] Backup su cloud (opzionale)

## 🔧 Personalizzazione

### Modificare i Colori
Modifica le variabili CSS in `styles.css`:

```css
:root {
    --primary-color: #6366f1;      /* Colore primario */
    --bg-primary: #1a1a2e;         /* Sfondo principale */
    --text-primary: #ffffff;        /* Testo principale */
    /* ... */
}
```

### Aggiungere Unità di Tempo
Modifica i selettori `timeSignature` in `index.html`:

```html
<option value="9">9/8</option>
<option value="12">12/8</option>
```

## 🌐 Compatibilità Browser

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Opera 76+

## 📱 Installazione come App

### Desktop (Chrome)
1. Clicca sull'icona di installazione nella barra degli indirizzi
2. Conferma l'installazione
3. L'app apparirà come applicazione standalone

### Mobile (Android/iOS)
1. Apri il menu del browser (⋮)
2. Seleziona "Aggiungi a schermata Home"
3. L'app apparirà come icona nella home

## 🐛 Risoluzione Problemi

### Il metronomo non produce suono
- Verifica che l'audio del browser non sia disattivato
- Alcuni browser richiedono interazione utente prima di riprodurre audio
- Prova a cliccare Start una seconda volta

### I dati non vengono salvati
- Controlla che il browser permetta l'uso di localStorage
- Verifica di non essere in modalità navigazione privata
- Controlla la console del browser per errori

### L'app non funziona offline
- Assicurati di aver visitato l'app almeno una volta online
- Verifica che il Service Worker sia registrato (DevTools → Application → Service Workers)

## 📄 Licenza

Questo progetto è open source e disponibile per uso personale e commerciale.

## 🤝 Contributi

Sentiti libero di fork, modificare e migliorare questa applicazione!

---

**Sviluppato con ❤️ per musicisti**

Buone performance! 🎸🥁🎹🎤
