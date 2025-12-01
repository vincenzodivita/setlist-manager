// Data Store
let songs = [];
let setlists = [];
let currentSetlist = null;
let currentSongIndex = 0;
let editingSongId = null;
let editingSetlistId = null;

// Metronome (standalone)
let metronomeInterval = null;
let isPlaying = false;
let currentBeat = 1;
let audioContext = null;

// Live Mode
let liveMetronomeInterval = null;
let liveIsPlaying = false;
let liveCurrentBeat = 1;
let liveCurrentBar = 1;
let liveCurrentSectionIndex = 0;
let livePrecountBars = 0;
let liveIsPrecount = false;
let liveAudioContext = null;

// PWA Install
let deferredPrompt;

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();
    setupEventListeners();
    setupPWA();
});

// Initialize Audio Context
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Load Data from API
async function loadData() {
    try {
        songs = await api.getSongs();
        setlists = await api.getSetlists();
    } catch (error) {
        console.error('Error loading data:', error);
        if (!api.isAuthenticated()) {
            window.location.href = 'login.html';
        }
    }
}

// Initialize App
async function initializeApp() {
    // Check authentication
    if (!api.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Load data from API
    await loadData();
    renderSongs();
    renderSetlists();
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => switchView(tab.dataset.view));
    });

    // Songs
    document.getElementById('addSongBtn').addEventListener('click', () => openSongModal());

    // Setlists
    document.getElementById('addSetlistBtn').addEventListener('click', () => openSetlistModal());

    // Metronome
    document.getElementById('metronomeToggle').addEventListener('click', toggleMetronome);
    document.getElementById('bpmUp').addEventListener('click', () => adjustBPM(1));
    document.getElementById('bpmDown').addEventListener('click', () => adjustBPM(-1));
    document.getElementById('bpmInput').addEventListener('input', (e) => updateBPM(e.target.value));
    document.getElementById('bpmSlider').addEventListener('input', (e) => updateBPM(e.target.value));
    document.getElementById('timeSignature').addEventListener('change', (e) => {
        if (isPlaying) {
            stopMetronome();
            startMetronome();
        }
    });

    // Live Mode
    document.getElementById('livePlayBtn').addEventListener('click', toggleLiveMetronome);
    document.getElementById('liveStopBtn').addEventListener('click', liveStop);
    document.getElementById('livePrevBtn').addEventListener('click', livePrevSong);
    document.getElementById('liveNextBtn').addEventListener('click', liveNextSong);
    document.getElementById('progressSlider').addEventListener('input', handleProgressChange);
    document.getElementById('progressSlider').addEventListener('mousedown', () => {
        if (liveIsPlaying) {
            document.getElementById('progressSlider').dataset.wasPlaying = 'true';
            stopLiveMetronome();
        }
    });
    document.getElementById('progressSlider').addEventListener('mouseup', () => {
        if (document.getElementById('progressSlider').dataset.wasPlaying === 'true') {
            document.getElementById('progressSlider').dataset.wasPlaying = 'false';
            startLiveMetronome();
        }
    });

    // Modals
    setupModalListeners('songModal', 'songForm');
    setupModalListeners('setlistModal', 'setlistForm');
    setupModalListeners('setlistDetailModal');
    setupModalListeners('addToSetlistModal');

    // Forms
    document.getElementById('songForm').addEventListener('submit', handleSongSubmit);
    document.getElementById('setlistForm').addEventListener('submit', handleSetlistSubmit);
    document.getElementById('advancedMode').addEventListener('change', toggleAdvancedMode);
    document.getElementById('addSectionBtn').addEventListener('click', addSectionInput);
}

// Setup Modal Listeners
function setupModalListeners(modalId, formId) {
    const modal = document.getElementById(modalId);
    const closeBtn = modal.querySelector('.close-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');

    closeBtn?.addEventListener('click', () => closeModal(modalId));
    cancelBtn?.addEventListener('click', () => closeModal(modalId));
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modalId);
    });
}

// Switch View
function switchView(view) {
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    
    document.querySelector(`[data-view="${view}"]`).classList.add('active');
    document.getElementById(`${view}View`).classList.add('active');
}

// === SONGS ===

// Render Songs
function renderSongs() {
    const container = document.getElementById('songsList');
    
    if (songs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎵</div>
                <p>Nessun brano ancora. Inizia ad aggiungerne uno!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = songs.map(song => `
        <div class="song-card" data-id="${song.id}">
            <div class="song-card-header">
                <div>
                    <h3>${song.name}</h3>
                </div>
                <div class="song-card-actions">
                    <button class="icon-btn" onclick="editSong('${song.id}')" title="Modifica">✏️</button>
                    <button class="icon-btn" onclick="deleteSong('${song.id}')" title="Elimina">🗑️</button>
                </div>
            </div>
            <div class="song-info">
                <span class="info-badge">⏱️ ${song.bpm} BPM</span>
                <span class="info-badge">🎵 ${song.timeSignature}/4</span>
            </div>
            ${song.sections && song.sections.length > 0 ? `
                <div class="sections-preview">
                    ${song.sections.map(section => `
                        <span class="section-tag">${section.name} (${section.bars} batt.)</span>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Open Song Modal
function openSongModal(songId = null) {
    editingSongId = songId;
    const modal = document.getElementById('songModal');
    const form = document.getElementById('songForm');
    const title = document.getElementById('songModalTitle');
    
    form.reset();
    document.getElementById('sectionsContainer').style.display = 'none';
    document.getElementById('advancedMode').checked = false;
    document.getElementById('sectionsList').innerHTML = '';
    
    if (songId) {
        const song = songs.find(s => s.id === songId);
        title.textContent = 'Modifica Brano';
        document.getElementById('songName').value = song.name;
        document.getElementById('songBpm').value = song.bpm;
        document.getElementById('songTimeSignature').value = song.timeSignature;
        
        if (song.sections && song.sections.length > 0) {
            document.getElementById('advancedMode').checked = true;
            toggleAdvancedMode({ target: { checked: true } });
            song.sections.forEach(section => addSectionInput(section.name, section.bars));
        }
    } else {
        title.textContent = 'Aggiungi Brano';
    }
    
    modal.classList.add('active');
}

// Toggle Advanced Mode
function toggleAdvancedMode(e) {
    const container = document.getElementById('sectionsContainer');
    container.style.display = e.target.checked ? 'block' : 'none';
    
    if (e.target.checked && document.getElementById('sectionsList').children.length === 0) {
        addSectionInput();
    }
}

// Add Section Input
function addSectionInput(name = '', bars = 4) {
    const container = document.getElementById('sectionsList');
    const div = document.createElement('div');
    div.className = 'section-item-form';
    div.innerHTML = `
        <input type="text" class="section-name" placeholder="Nome sezione (es: Intro, Strofa 1...)" value="${name}">
        <input type="number" class="section-bars" placeholder="Battute" min="1" max="999" value="${bars}">
        <button type="button" onclick="this.parentElement.remove()">✕</button>
    `;
    container.appendChild(div);
}

// Handle Song Submit
async function handleSongSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('songName').value;
    const bpm = parseInt(document.getElementById('songBpm').value);
    const timeSignature = parseInt(document.getElementById('songTimeSignature').value);
    const advancedMode = document.getElementById('advancedMode').checked;
    
    let sections = [];
    if (advancedMode) {
        const sectionItems = document.querySelectorAll('.section-item-form');
        sections = Array.from(sectionItems)
            .map(item => {
                const name = item.querySelector('.section-name').value.trim();
                const bars = parseInt(item.querySelector('.section-bars').value) || 4;
                return name ? { name, bars } : null;
            })
            .filter(section => section !== null);
    }
    
    const songData = {
        name,
        bpm,
        timeSignature,
        sections
    };
    
    try {
        if (editingSongId) {
            const updatedSong = await api.updateSong(editingSongId, songData);
            const index = songs.findIndex(s => s.id === editingSongId);
            songs[index] = updatedSong;
        } else {
            const newSong = await api.createSong(songData);
            songs.push(newSong);
        }
        
        renderSongs();
        closeModal('songModal');
    } catch (error) {
        alert('Errore nel salvare il brano: ' + error.message);
    }
}

// Edit Song
function editSong(id) {
    openSongModal(id);
}

// Delete Song
async function deleteSong(id) {
    if (!confirm('Sei sicuro di voler eliminare questo brano?')) return;
    
    try {
        await api.deleteSong(id);
        songs = songs.filter(s => s.id !== id);
        
        // Remove from all setlists
        for (const setlist of setlists) {
            if (setlist.songs.includes(id)) {
                const updatedSongs = setlist.songs.filter(songId => songId !== id);
                await api.updateSetlist(setlist.id, { songs: updatedSongs });
                setlist.songs = updatedSongs;
            }
        }
        
        renderSongs();
        renderSetlists();
    } catch (error) {
        alert('Errore nell\'eliminare il brano: ' + error.message);
    }
}

// === SETLISTS ===

// Render Setlists
function renderSetlists() {
    const container = document.getElementById('setlistsList');
    
    if (setlists.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <p>Nessuna setlist ancora. Creane una!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = setlists.map(setlist => `
        <div class="setlist-card" onclick="openSetlistDetail('${setlist.id}')">
            <div class="setlist-card-header">
                <div>
                    <h3>${setlist.name}</h3>
                    ${setlist.description ? `<p>${setlist.description}</p>` : ''}
                    <span class="setlist-song-count">${setlist.songs.length} brani</span>
                </div>
                <div class="setlist-card-actions" onclick="event.stopPropagation()">
                    <button class="icon-btn" onclick="editSetlist('${setlist.id}')" title="Modifica">✏️</button>
                    <button class="icon-btn" onclick="deleteSetlist('${setlist.id}')" title="Elimina">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Open Setlist Modal
function openSetlistModal(setlistId = null) {
    editingSetlistId = setlistId;
    const modal = document.getElementById('setlistModal');
    const form = document.getElementById('setlistForm');
    const title = document.getElementById('setlistModalTitle');
    
    form.reset();
    
    if (setlistId) {
        const setlist = setlists.find(s => s.id === setlistId);
        title.textContent = 'Modifica Setlist';
        document.getElementById('setlistName').value = setlist.name;
        document.getElementById('setlistDescription').value = setlist.description || '';
    } else {
        title.textContent = 'Nuova Setlist';
    }
    
    modal.classList.add('active');
}

// Handle Setlist Submit
async function handleSetlistSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('setlistName').value;
    const description = document.getElementById('setlistDescription').value;
    
    const setlistData = {
        name,
        description
    };
    
    try {
        if (editingSetlistId) {
            const updatedSetlist = await api.updateSetlist(editingSetlistId, setlistData);
            const index = setlists.findIndex(s => s.id === editingSetlistId);
            setlists[index] = { ...setlists[index], ...updatedSetlist };
        } else {
            const newSetlist = await api.createSetlist(setlistData);
            setlists.push(newSetlist);
        }
        
        renderSetlists();
        closeModal('setlistModal');
    } catch (error) {
        alert('Errore nel salvare la setlist: ' + error.message);
    }
}

// Edit Setlist
function editSetlist(id) {
    openSetlistModal(id);
}

// Delete Setlist
async function deleteSetlist(id) {
    if (!confirm('Sei sicuro di voler eliminare questa setlist?')) return;
    
    try {
        await api.deleteSetlist(id);
        setlists = setlists.filter(s => s.id !== id);
        renderSetlists();
    } catch (error) {
        alert('Errore nell\'eliminare la setlist: ' + error.message);
    }
}

// Open Setlist Detail
function openSetlistDetail(id) {
    const setlist = setlists.find(s => s.id === id);
    if (!setlist) return;
    
    currentSetlist = setlist;
    
    const modal = document.getElementById('setlistDetailModal');
    document.getElementById('setlistDetailTitle').textContent = setlist.name;
    
    renderSetlistDetail();
    
    modal.classList.add('active');
    
    // Setup event listeners for this setlist
    document.getElementById('addSongToSetlistBtn').onclick = () => openAddToSetlistModal();
    document.getElementById('playSetlistBtn').onclick = () => playSetlist();
}

// Render Setlist Detail
function renderSetlistDetail() {
    const container = document.getElementById('setlistDetailSongs');
    
    if (!currentSetlist || currentSetlist.songs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Nessun brano in questa setlist</p>
            </div>
        `;
        return;
    }

    container.innerHTML = currentSetlist.songs.map((songId, index) => {
        const song = songs.find(s => s.id === songId);
        if (!song) return '';
        
        const totalBars = song.sections && song.sections.length > 0 
            ? song.sections.reduce((sum, s) => sum + s.bars, 0) 
            : 0;
        
        return `
            <div class="setlist-song-item" draggable="true" data-song-id="${songId}" data-index="${index}">
                <span class="setlist-song-number">${index + 1}</span>
                <div class="setlist-song-info">
                    <h4>${song.name}</h4>
                    <div class="info-badges">
                        <span class="info-badge">⏱️ ${song.bpm} BPM</span>
                        <span class="info-badge">🎵 ${song.timeSignature}/4</span>
                        ${song.sections && song.sections.length > 0 ? `
                            <span class="info-badge">📝 ${song.sections.length} sezioni (${totalBars} batt.)</span>
                        ` : ''}
                    </div>
                </div>
                <div class="setlist-song-actions">
                    <button class="icon-btn" onclick="removeSongFromSetlist(${index})" title="Rimuovi">✕</button>
                    <button class="icon-btn" style="cursor: move;" title="Trascina">☰</button>
                </div>
            </div>
        `;
    }).join('');
    
    setupDragAndDrop();
}

// Setup Drag and Drop
function setupDragAndDrop() {
    const items = document.querySelectorAll('.setlist-song-item');
    let draggedItem = null;
    
    items.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            draggedItem = item;
            item.classList.add('dragging');
        });
        
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            draggedItem = null;
        });
        
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(e.clientY);
            const container = document.getElementById('setlistDetailSongs');
            
            if (afterElement == null) {
                container.appendChild(draggedItem);
            } else {
                container.insertBefore(draggedItem, afterElement);
            }
        });
        
        item.addEventListener('drop', () => {
            updateSetlistOrder();
        });
    });
}

function getDragAfterElement(y) {
    const draggableElements = [...document.querySelectorAll('.setlist-song-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

async function updateSetlistOrder() {
    const items = document.querySelectorAll('.setlist-song-item');
    const newOrder = Array.from(items).map(item => item.dataset.songId);
    
    try {
        await api.reorderSetlist(currentSetlist.id, newOrder);
        currentSetlist.songs = newOrder;
        
        const index = setlists.findIndex(s => s.id === currentSetlist.id);
        setlists[index] = currentSetlist;
        
        renderSetlistDetail();
    } catch (error) {
        alert('Errore nel riordinare i brani: ' + error.message);
    }
}

// Open Add to Setlist Modal
function openAddToSetlistModal() {
    const modal = document.getElementById('addToSetlistModal');
    const container = document.getElementById('availableSongsList');
    
    const availableSongs = songs.filter(song => !currentSetlist.songs.includes(song.id));
    
    if (availableSongs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Tutti i brani sono già nella setlist</p>
            </div>
        `;
    } else {
        container.innerHTML = availableSongs.map(song => `
            <div class="available-song-item" onclick="addSongToSetlist('${song.id}')">
                <h4>${song.name}</h4>
                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                    <span class="info-badge">⏱️ ${song.bpm} BPM</span>
                    <span class="info-badge">🎵 ${song.timeSignature}/4</span>
                </div>
            </div>
        `).join('');
    }
    
    modal.classList.add('active');
}

// Add Song to Setlist
async function addSongToSetlist(songId) {
    try {
        await api.addSongToSetlist(currentSetlist.id, songId);
        currentSetlist.songs.push(songId);
        
        const index = setlists.findIndex(s => s.id === currentSetlist.id);
        setlists[index] = currentSetlist;
        
        renderSetlistDetail();
        closeModal('addToSetlistModal');
    } catch (error) {
        alert('Errore nell\'aggiungere il brano: ' + error.message);
    }
}

// Remove Song from Setlist
async function removeSongFromSetlist(index) {
    if (!confirm('Rimuovere questo brano dalla setlist?')) return;
    
    const songId = currentSetlist.songs[index];
    
    try {
        await api.removeSongFromSetlist(currentSetlist.id, songId);
        currentSetlist.songs.splice(index, 1);
        
        const setlistIndex = setlists.findIndex(s => s.id === currentSetlist.id);
        setlists[setlistIndex] = currentSetlist;
        
        renderSetlistDetail();
    } catch (error) {
        alert('Errore nel rimuovere il brano: ' + error.message);
    }
}

// Play Setlist
function playSetlist() {
    if (currentSetlist.songs.length === 0) {
        alert('La setlist è vuota!');
        return;
    }
    
    currentSongIndex = 0;
    loadSongToLive();
    renderLiveTrackList();
    switchView('live');
    closeModal('setlistDetailModal');
}

// === METRONOME (STANDALONE) ===

function adjustBPM(delta) {
    const input = document.getElementById('bpmInput');
    let value = parseInt(input.value) + delta;
    value = Math.max(30, Math.min(300, value));
    updateBPM(value);
}

function updateBPM(value) {
    value = parseInt(value);
    if (isNaN(value) || value < 30 || value > 300) return;
    
    document.getElementById('bpmInput').value = value;
    document.getElementById('bpmSlider').value = value;
    
    if (isPlaying) {
        stopMetronome();
        startMetronome();
    }
}

function toggleMetronome() {
    if (isPlaying) {
        stopMetronome();
    } else {
        startMetronome();
    }
}

function startMetronome() {
    initAudioContext();
    
    const bpm = parseInt(document.getElementById('bpmInput').value);
    const timeSignature = parseInt(document.getElementById('timeSignature').value);
    const interval = (60 / bpm) * 1000;
    
    isPlaying = true;
    currentBeat = 1;
    
    // Create beat indicators
    createBeatIndicators('metronomeBeatsContainer', timeSignature);
    
    document.getElementById('metronomeToggle').innerHTML = '⏸ Stop';
    document.getElementById('metronomeToggle').classList.remove('btn-primary');
    document.getElementById('metronomeToggle').classList.add('btn-danger');
    
    playMetronomeBeat(true);
    
    metronomeInterval = setInterval(() => {
        currentBeat++;
        if (currentBeat > timeSignature) {
            currentBeat = 1;
        }
        playMetronomeBeat(currentBeat === 1);
    }, interval);
}

function stopMetronome() {
    isPlaying = false;
    
    if (metronomeInterval) {
        clearInterval(metronomeInterval);
        metronomeInterval = null;
    }
    
    document.getElementById('metronomeToggle').innerHTML = '▶ Start';
    document.getElementById('metronomeToggle').classList.remove('btn-danger');
    document.getElementById('metronomeToggle').classList.add('btn-primary');
    
    // Clear beat indicators
    const container = document.getElementById('metronomeBeatsContainer');
    if (container) {
        container.querySelectorAll('.beat-visual').forEach(beat => {
            beat.classList.remove('active', 'accent');
        });
    }
}

function playMetronomeBeat(isAccent) {
    const container = document.getElementById('metronomeBeatsContainer');
    if (!container) return;
    
    const beatVisuals = container.querySelectorAll('.beat-visual');
    
    beatVisuals.forEach((visual, index) => {
        visual.classList.remove('active', 'accent');
        if (index === currentBeat - 1) {
            visual.classList.add('active');
            if (isAccent) {
                visual.classList.add('accent');
            }
        }
    });
    
    playClick(isAccent, audioContext);
}

function createBeatIndicators(containerId, beats) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    for (let i = 1; i <= beats; i++) {
        const beatDiv = document.createElement('div');
        beatDiv.className = 'beat-visual';
        beatDiv.innerHTML = `<span class="beat-number">${i}</span>`;
        container.appendChild(beatDiv);
    }
}

// === LIVE MODE ===

function loadSongToLive() {
    if (!currentSetlist || currentSongIndex >= currentSetlist.songs.length) return;
    
    const songId = currentSetlist.songs[currentSongIndex];
    const song = songs.find(s => s.id === songId);
    if (!song) return;
    
    // Update song info
    document.getElementById('liveCurrentSongName').textContent = song.name;
    
    const infoContainer = document.getElementById('liveSongInfo');
    infoContainer.innerHTML = `
        <span class="info-badge">⏱️ ${song.bpm} BPM</span>
        <span class="info-badge">🎵 ${song.timeSignature}/4</span>
        ${song.sections && song.sections.length > 0 ? `
            <span class="info-badge">📝 ${song.sections.length} sezioni</span>
        ` : ''}
    `;
    
    // Update setlist info
    document.getElementById('liveSetlistInfo').innerHTML = `
        <div class="live-setlist-name">${currentSetlist.name}</div>
        <div class="live-setlist-progress">Brano ${currentSongIndex + 1} di ${currentSetlist.songs.length}</div>
    `;
    
    // Calculate total bars
    let totalBars = 0;
    if (song.sections && song.sections.length > 0) {
        totalBars = song.sections.reduce((sum, section) => sum + section.bars, 0);
    }
    
    // Update sections
    const sectionsContainer = document.getElementById('liveSections');
    if (song.sections && song.sections.length > 0) {
        sectionsContainer.innerHTML = song.sections.map((section, index) => `
            <div class="section-item ${index === 0 ? 'active' : ''}" data-index="${index}" onclick="jumpToSection(${index})">
                <div class="section-name">${section.name}</div>
                <div class="section-bars">${section.bars} battute</div>
                <div class="section-progress">${index === 0 ? '1' : '0'}/${section.bars}</div>
            </div>
        `).join('');
        sectionsContainer.style.display = 'flex';
        
        // Show progress bar
        document.querySelector('.progress-container').style.display = 'block';
        
        // Update progress bar (starting at bar 1, which means 0 bars completed)
        document.getElementById('totalBarsDisplay').textContent = `/ ${totalBars}`;
        document.getElementById('currentBarDisplay').textContent = 'Battuta: 1';
        document.getElementById('progressSlider').max = totalBars;
        document.getElementById('progressSlider').value = 0;
        document.getElementById('progressBar').style.width = '0%';
    } else {
        sectionsContainer.style.display = 'none';
        // Hide progress bar when no sections
        document.querySelector('.progress-container').style.display = 'none';
    }
    
    liveCurrentSectionIndex = 0;
    liveCurrentBar = 0; // Start at 0, will become 1 after first complete bar
}

function renderLiveTrackList() {
    if (!currentSetlist) return;
    
    const container = document.getElementById('liveTrackList');
    container.innerHTML = currentSetlist.songs.map((songId, index) => {
        const song = songs.find(s => s.id === songId);
        if (!song) return '';
        
        return `
            <div class="live-track-item ${index === currentSongIndex ? 'active' : ''}" onclick="selectLiveSong(${index})">
                <span class="track-number">${index + 1}</span>
                <div class="track-info">
                    <div class="track-name">${song.name}</div>
                    <div class="track-details">${song.bpm} BPM • ${song.timeSignature}/4</div>
                </div>
            </div>
        `;
    }).join('');
}

function selectLiveSong(index) {
    if (liveIsPlaying) {
        stopLiveMetronome();
    }
    currentSongIndex = index;
    loadSongToLive();
    renderLiveTrackList();
}

function livePrevSong() {
    if (currentSongIndex > 0) {
        selectLiveSong(currentSongIndex - 1);
    }
}

function liveNextSong() {
    if (currentSongIndex < currentSetlist.songs.length - 1) {
        selectLiveSong(currentSongIndex + 1);
    }
}

function liveStop() {
    stopLiveMetronome();
    
    // Reset to beginning (bar 0 = 0 completed bars, we're IN bar 1)
    liveCurrentBar = 0;
    liveCurrentSectionIndex = 0;
    liveCurrentBeat = 1;
    
    // Reset progress
    updateProgressBar();
    
    // Reset sections display
    const songId = currentSetlist.songs[currentSongIndex];
    const song = songs.find(s => s.id === songId);
    if (song && song.sections && song.sections.length > 0) {
        const sectionItems = document.querySelectorAll('#liveSections .section-item');
        sectionItems.forEach((item, index) => {
            item.classList.remove('active');
            if (index === 0) {
                item.classList.add('active');
            }
            const progressEl = item.querySelector('.section-progress');
            if (progressEl) {
                // First section shows 1/N, others show 0/N
                progressEl.textContent = index === 0 ? `1/${song.sections[index].bars}` : `0/${song.sections[index].bars}`;
            }
        });
    }
}

function toggleLiveMetronome() {
    if (liveIsPlaying) {
        stopLiveMetronome();
    } else {
        startLiveMetronome();
    }
}

function handleProgressChange(e) {
    const completedBars = parseInt(e.target.value);
    
    const songId = currentSetlist.songs[currentSongIndex];
    const song = songs.find(s => s.id === songId);
    if (!song || !song.sections || song.sections.length === 0) return;
    
    // Find which section this corresponds to
    let accumulatedBars = 0;
    let targetSection = 0;
    
    for (let i = 0; i < song.sections.length; i++) {
        if (completedBars < accumulatedBars + song.sections[i].bars) {
            targetSection = i;
            break;
        }
        accumulatedBars += song.sections[i].bars;
        targetSection = i;
    }
    
    liveCurrentBar = completedBars;
    liveCurrentSectionIndex = targetSection;
    liveCurrentBeat = 1;
    
    updateProgressBar();
    updateLiveSectionProgress(song);
}

function startLiveMetronome() {
    if (!currentSetlist || currentSongIndex >= currentSetlist.songs.length) {
        alert('Seleziona un brano dalla setlist!');
        return;
    }
    
    const songId = currentSetlist.songs[currentSongIndex];
    const song = songs.find(s => s.id === songId);
    if (!song) return;
    
    if (!liveAudioContext) {
        liveAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const bpm = song.bpm;
    const timeSignature = song.timeSignature;
    const interval = (60 / bpm) * 1000;
    const precountEnabled = document.getElementById('precountToggle').checked;
    
    liveIsPlaying = true;
    liveCurrentBeat = 1;
    
    // Set precount before actual starting position
    if (precountEnabled) {
        liveIsPrecount = true;
        livePrecountBars = 2; // 2 measures
    } else {
        liveIsPrecount = false;
        livePrecountBars = 0;
    }
    
    // Disable section clicks during playback
    document.querySelectorAll('#liveSections .section-item').forEach(item => {
        item.style.pointerEvents = 'none';
        item.style.opacity = '0.9';
    });
    
    // Disable progress slider during playback
    document.getElementById('progressSlider').disabled = true;
    
    // Create beat indicators
    createBeatIndicators('liveMetronomeBeatsContainer', timeSignature);
    
    document.getElementById('livePlayBtn').innerHTML = '⏸ Pause';
    document.getElementById('livePlayBtn').classList.remove('btn-primary');
    document.getElementById('livePlayBtn').classList.add('btn-danger');
    
    playLiveBeat(true, song);
    
    liveMetronomeInterval = setInterval(() => {
        liveCurrentBeat++;
        
        if (liveCurrentBeat > timeSignature) {
            liveCurrentBeat = 1;
            
            if (liveIsPrecount) {
                livePrecountBars--;
                if (livePrecountBars <= 0) {
                    liveIsPrecount = false;
                    // Now the actual song starts
                }
            } else {
                // Only increment bar when not in precount
                liveCurrentBar++;
                updateLiveSectionProgress(song);
                updateProgressBar();
            }
        }
        
        playLiveBeat(liveCurrentBeat === 1, song);
    }, interval);
}

function stopLiveMetronome() {
    liveIsPlaying = false;
    
    if (liveMetronomeInterval) {
        clearInterval(liveMetronomeInterval);
        liveMetronomeInterval = null;
    }
    
    // Re-enable section clicks
    document.querySelectorAll('#liveSections .section-item').forEach(item => {
        item.style.pointerEvents = 'auto';
        item.style.opacity = '1';
    });
    
    // Re-enable progress slider
    document.getElementById('progressSlider').disabled = false;
    
    document.getElementById('livePlayBtn').innerHTML = '▶ Play';
    document.getElementById('livePlayBtn').classList.remove('btn-danger');
    document.getElementById('livePlayBtn').classList.add('btn-primary');
    
    // Clear beat indicators
    const container = document.getElementById('liveMetronomeBeatsContainer');
    if (container) {
        container.querySelectorAll('.beat-visual').forEach(beat => {
            beat.classList.remove('active', 'accent', 'precount');
        });
    }
}

function playLiveBeat(isAccent, song) {
    const container = document.getElementById('liveMetronomeBeatsContainer');
    if (!container) return;
    
    const beatVisuals = container.querySelectorAll('.beat-visual');
    
    beatVisuals.forEach((visual, index) => {
        visual.classList.remove('active', 'accent', 'precount');
        if (index === liveCurrentBeat - 1) {
            visual.classList.add('active');
            if (liveIsPrecount) {
                visual.classList.add('precount');
            } else if (isAccent) {
                visual.classList.add('accent');
            }
        }
    });
    
    playClick(isAccent, liveAudioContext);
}

function jumpToSection(sectionIndex) {
    if (liveIsPlaying) {
        return; // Can't jump while playing
    }
    
    const songId = currentSetlist.songs[currentSongIndex];
    const song = songs.find(s => s.id === songId);
    if (!song || !song.sections || sectionIndex >= song.sections.length) return;
    
    // Calculate the FIRST bar of the selected section
    let targetBar = 0; // Start from 0 because we'll be AT the beginning of the section
    for (let i = 0; i < sectionIndex; i++) {
        targetBar += song.sections[i].bars;
    }
    
    liveCurrentBar = targetBar;
    liveCurrentSectionIndex = sectionIndex;
    liveCurrentBeat = 1;
    
    updateProgressBar();
    updateLiveSectionProgress(song);
}

function updateProgressBar() {
    const songId = currentSetlist?.songs[currentSongIndex];
    if (!songId) return;
    
    const song = songs.find(s => s.id === songId);
    if (!song || !song.sections || song.sections.length === 0) return;
    
    let totalBars = song.sections.reduce((sum, section) => sum + section.bars, 0);
    
    // Progress bar shows completed bars (0-based)
    const completedBars = liveIsPrecount ? 0 : liveCurrentBar;
    const percentage = totalBars > 0 ? (completedBars / totalBars) * 100 : 0;
    
    // Display shows current bar number (1-based, the bar we're IN)
    const currentBarNumber = liveIsPrecount ? 0 : completedBars + 1;
    
    document.getElementById('currentBarDisplay').textContent = liveIsPrecount ? 'PRE' : `Battuta: ${currentBarNumber}`;
    document.getElementById('progressBar').style.width = `${percentage}%`;
    
    if (!liveIsPlaying) {
        document.getElementById('progressSlider').value = completedBars;
    }
}

function updateLiveSectionProgress(song) {
    if (!song.sections || song.sections.length === 0) return;
    
    const sections = song.sections;
    const sectionItems = document.querySelectorAll('#liveSections .section-item');
    
    // Calculate which section we're in based on completed bars (liveCurrentBar)
    let accumulatedBars = 0;
    let targetSection = 0;
    
    for (let i = 0; i < sections.length; i++) {
        if (liveCurrentBar < accumulatedBars + sections[i].bars) {
            targetSection = i;
            break;
        }
        accumulatedBars += sections[i].bars;
        targetSection = i; // If we complete all bars, stay on last section
    }
    
    // If we've completed all sections, loop back
    const totalBars = sections.reduce((sum, s) => sum + s.bars, 0);
    if (liveCurrentBar >= totalBars) {
        liveCurrentBar = 0;
        liveCurrentSectionIndex = 0;
        targetSection = 0;
        accumulatedBars = 0;
    }
    
    liveCurrentSectionIndex = targetSection;
    
    // Calculate bars completed within current section
    let barsCompletedInSection = liveCurrentBar - accumulatedBars;
    
    // Current bar number is completed bars + 1 (we're IN the next bar)
    let currentBarInSection = barsCompletedInSection + 1;
    
    // Update visual display
    sectionItems.forEach((item, index) => {
        item.classList.remove('active');
        const progressEl = item.querySelector('.section-progress');
        
        if (index === liveCurrentSectionIndex) {
            item.classList.add('active');
            if (progressEl) {
                // Show current bar number (1-indexed)
                progressEl.textContent = `${currentBarInSection}/${sections[index].bars}`;
            }
        } else if (index < liveCurrentSectionIndex) {
            // Completed sections
            if (progressEl) {
                progressEl.textContent = `${sections[index].bars}/${sections[index].bars}`;
            }
        } else {
            // Future sections
            if (progressEl) {
                progressEl.textContent = `0/${sections[index].bars}`;
            }
        }
    });
}

function playClick(isAccent, context) {
    if (!context) return;
    
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.frequency.value = isAccent ? 1200 : 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.1);
}

// === MODAL ===

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// === LOGOUT ===

function handleLogout() {
    if (confirm('Sei sicuro di voler uscire?')) {
        api.logout();
    }
}

// === PWA ===

function setupPWA() {
    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed'));
    }
    
    // Install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        document.getElementById('installBtn').style.display = 'block';
    });
    
    document.getElementById('installBtn').addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            deferredPrompt = null;
            document.getElementById('installBtn').style.display = 'none';
        }
    });
}

// Make functions globally accessible
window.editSong = editSong;
window.deleteSong = deleteSong;
window.editSetlist = editSetlist;
window.deleteSetlist = deleteSetlist;
window.openSetlistDetail = openSetlistDetail;
window.addSongToSetlist = addSongToSetlist;
window.removeSongFromSetlist = removeSongFromSetlist;
window.selectLiveSong = selectLiveSong;
window.jumpToSection = jumpToSection;
window.handleLogout = handleLogout;
