// API Configuration
const API_CONFIG = {
    // Per sviluppo locale, usa localhost
    // Per produzione, usa l'URL di Cloud Run
    baseURL: window.location.hostname === 'localhost' 
        ? 'http://localhost:8080' 
        : 'https://your-cloud-run-url.run.app',
    
    endpoints: {
        // Auth
        register: '/auth/register',
        login: '/auth/login',
        profile: '/auth/profile',
        
        // Songs
        songs: '/songs',
        song: (id) => `/songs/${id}`,
        
        // Setlists
        setlists: '/setlists',
        setlist: (id) => `/setlists/${id}`,
        addSongToSetlist: (id) => `/setlists/${id}/songs`,
        removeSongFromSetlist: (id, songId) => `/setlists/${id}/songs/${songId}`,
        reorderSetlist: (id) => `/setlists/${id}/reorder`,
    }
};

// API Client
class ApiClient {
    constructor() {
        this.baseURL = API_CONFIG.baseURL;
        this.token = localStorage.getItem('access_token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('access_token', token);
        } else {
            localStorage.removeItem('access_token');
        }
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Token scaduto o invalido
                    this.setToken(null);
                    window.location.href = '/login.html';
                    throw new Error('Sessione scaduta. Effettua nuovamente il login.');
                }
                
                const error = await response.json().catch(() => ({ message: 'Errore sconosciuto' }));
                throw new Error(error.message || `HTTP Error ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth Methods
    async register(email, password, name) {
        const response = await this.request(API_CONFIG.endpoints.register, {
            method: 'POST',
            body: JSON.stringify({ email, password, name }),
        });
        
        if (response.access_token) {
            this.setToken(response.access_token);
        }
        
        return response;
    }

    async login(email, password) {
        const response = await this.request(API_CONFIG.endpoints.login, {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        
        if (response.access_token) {
            this.setToken(response.access_token);
        }
        
        return response;
    }

    async getProfile() {
        return await this.request(API_CONFIG.endpoints.profile);
    }

    logout() {
        this.setToken(null);
        window.location.href = '/login.html';
    }

    // Songs Methods
    async getSongs() {
        return await this.request(API_CONFIG.endpoints.songs);
    }

    async getSong(id) {
        return await this.request(API_CONFIG.endpoints.song(id));
    }

    async createSong(songData) {
        return await this.request(API_CONFIG.endpoints.songs, {
            method: 'POST',
            body: JSON.stringify(songData),
        });
    }

    async updateSong(id, songData) {
        return await this.request(API_CONFIG.endpoints.song(id), {
            method: 'PATCH',
            body: JSON.stringify(songData),
        });
    }

    async deleteSong(id) {
        return await this.request(API_CONFIG.endpoints.song(id), {
            method: 'DELETE',
        });
    }

    // Setlists Methods
    async getSetlists() {
        return await this.request(API_CONFIG.endpoints.setlists);
    }

    async getSetlist(id) {
        return await this.request(API_CONFIG.endpoints.setlist(id));
    }

    async createSetlist(setlistData) {
        return await this.request(API_CONFIG.endpoints.setlists, {
            method: 'POST',
            body: JSON.stringify(setlistData),
        });
    }

    async updateSetlist(id, setlistData) {
        return await this.request(API_CONFIG.endpoints.setlist(id), {
            method: 'PATCH',
            body: JSON.stringify(setlistData),
        });
    }

    async deleteSetlist(id) {
        return await this.request(API_CONFIG.endpoints.setlist(id), {
            method: 'DELETE',
        });
    }

    async addSongToSetlist(setlistId, songId) {
        return await this.request(API_CONFIG.endpoints.addSongToSetlist(setlistId), {
            method: 'POST',
            body: JSON.stringify({ songId }),
        });
    }

    async removeSongFromSetlist(setlistId, songId) {
        return await this.request(API_CONFIG.endpoints.removeSongFromSetlist(setlistId, songId), {
            method: 'DELETE',
        });
    }

    async reorderSetlist(setlistId, songIds) {
        return await this.request(API_CONFIG.endpoints.reorderSetlist(setlistId), {
            method: 'PATCH',
            body: JSON.stringify({ songIds }),
        });
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.token;
    }
}

// Create global instance
const api = new ApiClient();
