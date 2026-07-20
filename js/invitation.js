/**
 * invitation.js - Logique de la vue invité
 * Gère la personnalisation via URL, les animations de l'enveloppe, la musique, le compte à rebours et le RSVP.
 */

// Chansons libres de droits disponibles
const AUDIO_TRACKS = [
    { name: "Piano Rêverie", url: "https://assets.mixkit.co/music/preview/mixkit-beautiful-dream-lullaby-piano-970.mp3" },
    { name: "Marche Nuptiale Solo", url: "https://assets.mixkit.co/music/preview/mixkit-wedding-march-piano-solo-1111.mp3" },
    { name: "Guitare Romantique", url: "https://assets.mixkit.co/music/preview/mixkit-romantic-forest-guitar-solo-1112.mp3" }
];

let audio = null;
let isPlaying = false;
let weddingDateObj = new Date("2026-08-22T16:00:00"); // Date par défaut

document.addEventListener("DOMContentLoaded", () => {
    // 1. Lire les paramètres de configuration
    const config = getInvitationConfig();
    applyConfigToDOM(config);

    // 2. Initialiser le lecteur audio
    setupAudio(config.mu);

    // 3. Lancer le compte à rebours
    initCountdown();

    // 4. Configurer les écouteurs d'événements
    setupEventListeners();

    // 5. Effet spécial thème Nuit Étoilée
    if (config.th === 'starry') {
        createStars();
    }

    // 5b. Tentative d'auto-play de la musique
    playMusic();

    // 6. Retrait de la classe preload après le chargement de la page pour activer les transitions
    if (document.readyState === 'complete') {
        setTimeout(() => document.body.classList.remove("preload"), 100);
    } else {
        window.addEventListener("load", () => {
            setTimeout(() => {
                document.body.classList.remove("preload");
            }, 100);
        });
    }

    // Réinitialiser l’état visuel de la carte au chargement pour éviter qu’un état d’ouverture précédent ne la masque.
    const invitationCard = document.getElementById("invitationCard");
    const envelopeWrapper = document.getElementById("envelopeWrapper");
    if (invitationCard) {
        invitationCard.style.opacity = '1';
        invitationCard.style.visibility = 'visible';
        invitationCard.style.transform = 'none';
    }
    if (envelopeWrapper) {
        envelopeWrapper.classList.remove('open');
        envelopeWrapper.classList.remove('card-focused');
    }
});

/**
 * Lit les paramètres passés dans l'URL (encodés ou en clair).
 */
function getInvitationConfig() {
    const params = new URLSearchParams(window.location.search);
    
    // Décodage de la clé "data" si elle existe (Base64) pour des URL plus propres
    let data = {};
    const encodedData = params.get("d1");
    if (encodedData) {
        try {
            data = JSON.parse(decodeURIComponent(escape(atob(encodedData))));
        } catch (e) {
            console.error("Erreur de décodage des paramètres URL Base64", e);
        }
    }

    return {
        g: data.g || params.get("g") || "Pathé Gueye",
        b: data.b || params.get("b") || "Mame Diarra Niasse",
        d: data.d || params.get("d") || "2026-08-22",
        t: data.t || params.get("t") || "16:00",
        c: data.c || params.get("c") || "Grande Mosquée de Dakar",
        r: data.r || params.get("r") || "Salle Prestige",
        m: data.m || params.get("m") || "Deux cœurs s'unissent pour la vie. Nous sommes ravis de vous inviter à célébrer notre union sacrée devant Dieu et nos proches.",
        th: data.th || params.get("th") || "luxury",
        mu: parseInt(data.mu !== undefined ? data.mu : params.get("mu")) || 0
    };
}

/**
 * Applique la configuration aux éléments HTML.
 */
function applyConfigToDOM(config) {
    // Injecter les thèmes
    document.body.className = `theme-${config.th}`;

    // Remplacer les textes
    document.getElementById("brideName").textContent = config.b;
    document.getElementById("groomName").textContent = config.g;
    document.getElementById("customMessage").textContent = config.m;
    
    // Afficher les deux lieux séparement
    const ceremonyEl = document.getElementById("ceremonyText");
    const receptionEl = document.getElementById("receptionText");
    if (ceremonyEl) ceremonyEl.textContent = config.c;
    if (receptionEl) receptionEl.textContent = config.r;

    // Formater la date en français (ex: Samedi 22 Août 2026)
    const dateStr = config.d;
    const timeStr = config.t;
    if (dateStr) {
        const fullDateStr = `${dateStr}T${timeStr || '00:00'}`;
        const tempDate = new Date(fullDateStr);
        
        if (!isNaN(tempDate.getTime())) {
            weddingDateObj = tempDate;
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const formatter = new Intl.DateTimeFormat('fr-FR', options);
            let dateFormatted = formatter.format(weddingDateObj);
            // Capitaliser la première lettre
            dateFormatted = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);
            
            document.getElementById("dateText").textContent = `${dateFormatted} à ${timeStr.replace(':', 'h')}`;
        }
    }

    // Configurer le lien de la carte/GPS (utiliser le lieu de la réception pour la localisation)
    const mapButton = document.getElementById("btnMap");
    if (mapButton) {
        mapButton.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.r)}`;
    }
}

/**
 * Initialise l'audio avec le morceau sélectionné.
 */
function setupAudio(trackIndex) {
    const track = AUDIO_TRACKS[trackIndex] || AUDIO_TRACKS[0];
    audio = new Audio(track.url);
    audio.loop = true;
}

/**
 * Démarre le compte à rebours.
 */
function initCountdown() {
    const daysEl = document.getElementById("cdDays");
    const hoursEl = document.getElementById("cdHours");
    const minsEl = document.getElementById("cdMins");
    const secsEl = document.getElementById("cdSecs");

    function update() {
        const now = new Date();
        const diff = weddingDateObj - now;

        if (diff <= 0) {
            document.getElementById("countdown").innerHTML = "<div style='font-size: 18px; color: var(--card-color-primary); letter-spacing: 2px; font-weight: 600;'>C'EST LE GRAND JOUR ! 🎉</div>";
            return;
        }

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const s = Math.floor((diff / 1000) % 60);

        if (daysEl) daysEl.textContent = d.toString().padStart(2, '0');
        if (hoursEl) hoursEl.textContent = h.toString().padStart(2, '0');
        if (minsEl) minsEl.textContent = m.toString().padStart(2, '0');
        if (secsEl) secsEl.textContent = s.toString().padStart(2, '0');
    }

    update();
    setInterval(update, 1000);
}

/**
 * Écouteurs d'événements interactifs (Ouvrir l'enveloppe, musique, RSVP).
 */
function setupEventListeners() {
    const envelopeWrapper = document.getElementById("envelopeWrapper");
    const waxSeal = document.getElementById("waxSeal");
    const musicBtn = document.getElementById("btnMusicToggle");
    const rsvpBtn = document.getElementById("btnRSVP");
    const closeModalBtn = document.getElementById("btnCloseModal");
    const modalOverlay = document.getElementById("modalOverlay");
    const rsvpForm = document.getElementById("rsvpForm");
    const btnCalendar = document.getElementById("btnCalendar");

    // Action d'ouverture d'enveloppe
    function openEnvelope() {
        if (envelopeWrapper.classList.contains("open")) return;

        // Étape 1 : ouvrir le rabat et faire glisser la carte vers le haut
        envelopeWrapper.classList.add("open");

        // Jouer la musique au premier geste d'interaction (requis par les navigateurs)
        playMusic();

        // Créer des étoiles animées lors de l'ouverture
        createAnimatingStars();

        // Étape 2 : après l'animation (900ms), faire disparaître l'enveloppe et fixer la carte
        setTimeout(() => {
            envelopeWrapper.classList.add("card-focused");
        }, 950);
    }

    if (waxSeal) waxSeal.addEventListener("click", (e) => {
        e.stopPropagation();
        openEnvelope();
    });

    if (envelopeWrapper) envelopeWrapper.addEventListener("click", () => {
        if (!envelopeWrapper.classList.contains("open")) {
            openEnvelope();
        }
    });

    // Bouton de musique toggle
    if (musicBtn) {
        musicBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (isPlaying) {
                pauseMusic();
            } else {
                playMusic();
            }
        });
    }

    // Gestion du Modal RSVP
    if (rsvpBtn) {
        rsvpBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            modalOverlay.classList.add("active");
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", () => {
            modalOverlay.classList.remove("active");
        });
    }

    if (modalOverlay) {
        modalOverlay.addEventListener("click", (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove("active");
            }
        });
    }

    // Soumission du RSVP
    if (rsvpForm) {
        rsvpForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const rsvpData = {
                name: document.getElementById("rsvpName").value,
                attending: document.getElementById("rsvpAttending").value,
                guests: document.getElementById("rsvpGuests").value || 0,
                notes: document.getElementById("rsvpNotes").value || ''
            };

            // Enregistrer localement dans le stockage local
            if (window.weddingDb) {
                window.weddingDb.addRSVP(rsvpData);
            }

            // Notification visuelle de succès
            alert(`Merci ${rsvpData.name} ! Votre réponse a été enregistrée avec succès.`);
            modalOverlay.classList.remove("active");
            rsvpForm.reset();
        });
    }

    // Ajouter au Calendrier
    if (btnCalendar) {
        btnCalendar.addEventListener("click", (e) => {
            e.preventDefault();
            const config = getInvitationConfig();
            
            const title = `Mariage de ${config.g} et ${config.b}`;
            const details = config.m;
            const location = config.v;
            
            // Format de date requis par Google Calendar (YYYYMMDDTHHMMSSZ)
            const startDate = weddingDateObj.toISOString().replace(/-|:|\.\d\d\d/g, "");
            // Fin estimée + 4h
            const endDateObj = new Date(weddingDateObj.getTime() + 4 * 60 * 60 * 1000);
            const endDate = endDateObj.toISOString().replace(/-|:|\.\d\d\d/g, "");

            const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
            window.open(googleUrl, '_blank');
        });
    }
}

/**
 * Lance la lecture de la musique et met à jour l'icône.
 */
function playMusic() {
    if (!audio) return;
    audio.play().then(() => {
        isPlaying = true;
        const musicBtn = document.getElementById("btnMusicToggle");
        if (musicBtn) {
            musicBtn.classList.add("playing");
            musicBtn.innerHTML = "🎵";
        }
    }).catch(err => {
        console.log("Lecture automatique bloquée par le navigateur.");
    });
}

/**
 * Arrête la musique et met à jour l'icône.
 */
function pauseMusic() {
    if (!audio) return;
    audio.pause();
    isPlaying = false;
    const musicBtn = document.getElementById("btnMusicToggle");
    if (musicBtn) {
        musicBtn.classList.remove("playing");
        musicBtn.innerHTML = "🔇";
    }
}

/**
 * Génère des étoiles scintillantes pour le thème Starry Night.
 */
function createStars() {
    const container = document.getElementById("starsContainer");
    if (!container) return;

    const starCount = 60;
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement("div");
        star.classList.add("star");
        
        // Taille aléatoire
        const size = Math.random() * 2 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        
        // Position aléatoire
        star.style.top = `${Math.random() * 100}%`;
        star.style.left = `${Math.random() * 100}%`;
        
        // Délai d'animation aléatoire
        star.style.animationDelay = `${Math.random() * 3}s`;
        star.style.animationDuration = `${Math.random() * 2 + 2}s`;
        
        container.appendChild(star);
    }
}

/**
 * Crée des étoiles animées qui apparaissent lors de l'ouverture de la carte.
 */
function createAnimatingStars() {
    const container = document.getElementById("starsContainer");
    if (!container) return;

    const burstCount = 40; // Nombre d'étoiles à créer
    for (let i = 0; i < burstCount; i++) {
        const star = document.createElement("div");
        star.classList.add("star");
        
        // Taille aléatoire (plus petites)
        const size = Math.random() * 2.5 + 0.5;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        
        // Position centrée avec dispersion radiale
        const angle = (Math.random() * Math.PI * 2);
        const distance = Math.random() * 30 + 10;
        const x = 50 + Math.cos(angle) * distance;
        const y = 50 + Math.sin(angle) * distance;
        
        star.style.top = `${y}%`;
        star.style.left = `${x}%`;
        star.style.opacity = '0.8';
        
        // Animation rapide d'apparition/disparition
        star.style.animation = `starBurst 1.2s ease-out forwards`;
        star.style.animationDelay = `${Math.random() * 0.3}s`;
        
        container.appendChild(star);
        
        // Supprimer l'étoile après l'animation
        setTimeout(() => star.remove(), 1500 + Math.random() * 300);
    }
}
