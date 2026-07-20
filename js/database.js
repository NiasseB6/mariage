/**
 * database.js - Gestionnaire de base de données locale (localStorage)
 * Gère le stockage et la récupération des inscriptions RSVP des invités.
 */

const STORAGE_KEY = 'wedding_invitation_rsvps';

// Données initiales de démonstration (pour peupler le tableau de bord au premier lancement)
const DEFAULT_RSVPS = [
    {
        id: '1',
        name: 'Moussa Gueye',
        attending: 'yes',
        guests: 2,
        notes: 'Félicitations mon frère ! Présent avec ma femme.',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString() // Il y a 1 jour
    },
    {
        id: '2',
        name: 'Fatou Niasse',
        attending: 'yes',
        guests: 1,
        notes: 'Tellement hâte de célébrer ce beau mariage !',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString() // Il y a 5 heures
    },
    {
        id: '3',
        name: 'Amadou Diop',
        attending: 'no',
        guests: 0,
        notes: 'Malheureusement je serai à l\'étranger, toutes mes félicitations.',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString() // Il y a 12 heures
    }
];

const database = {
    /**
     * Récupère la liste complète des RSVPs enregistrées.
     * @returns {Array} Liste des RSVPs
     */
    getRSVPs() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            // S'il n'y a rien, on initialise avec les données par défaut
            localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_RSVPS));
            return DEFAULT_RSVPS;
        }
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Erreur lors de la lecture des RSVPs', e);
            return [];
        }
    },

    /**
     * Enregistre un nouveau RSVP.
     * @param {Object} rsvp Objet RSVP à enregistrer (nom, presence, accompagnateurs, notes)
     * @returns {Array} Liste mise à jour
     */
    addRSVP(rsvp) {
        const rsvps = this.getRSVPs();
        const newRsvp = {
            id: Date.now().toString(),
            name: rsvp.name || 'Invité anonyme',
            attending: rsvp.attending || 'yes',
            guests: parseInt(rsvp.guests) || 0,
            notes: rsvp.notes || '',
            timestamp: new Date().toISOString()
        };
        rsvps.unshift(newRsvp); // Ajouter au début
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rsvps));
        
        // Déclencher un événement personnalisé pour notifier l'éditeur s'il est ouvert (y compris la fenêtre parente de l'iframe)
        const event = new CustomEvent('rsvpUpdated', { detail: newRsvp });
        window.dispatchEvent(event);
        if (window.parent && window.parent !== window) {
            window.parent.dispatchEvent(event);
        }
        return rsvps;
    },

    /**
     * Supprime toutes les RSVPs.
     */
    clearRSVPs() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        
        const event = new CustomEvent('rsvpUpdated');
        window.dispatchEvent(event);
        if (window.parent && window.parent !== window) {
            window.parent.dispatchEvent(event);
        }
    }
};

// Exposer le gestionnaire
window.weddingDb = database;
