/**
 * builder.js - Logique de l'Éditeur d'Invitation
 * Permet de modifier l'invitation en temps réel, de générer des liens et de suivre les RSVPs.
 */

document.addEventListener("DOMContentLoaded", () => {
    initBuilder();
    setupTabs();
    setupMobileSidebar();
    loadRSVPDashboard();

    // Recharger le tableau de bord si des RSVPs sont soumises dans l'iframe
    window.addEventListener('rsvpUpdated', () => {
        loadRSVPDashboard();
    });
});

/**
 * Initialise l'éditeur, lie les inputs du formulaire à la prévisualisation dans l'iframe.
 */
function initBuilder() {
    const iframe = document.getElementById("previewIframe");
    const form = document.getElementById("builderForm");

    // Inputs
    const inputGroom = document.getElementById("inputGroom");
    const inputBride = document.getElementById("inputBride");
    const inputDate = document.getElementById("inputDate");
    const inputTime = document.getElementById("inputTime");
    const inputCeremony = document.getElementById("inputCeremony");
    const inputReception = document.getElementById("inputReception");
    const inputMessage = document.getElementById("inputMessage");
    const selectMusic = document.getElementById("selectMusic");
    
    const themeOptions = document.querySelectorAll(".theme-option");
    let activeTheme = "luxury";

    // Fonction de mise à jour en direct de l'iframe
    function updatePreview() {
        if (!iframe.contentWindow || !iframe.contentDocument) return;

        const doc = iframe.contentWindow.document;

        // Mettre à jour les textes en direct si les éléments existent dans l'iframe
        const brideEl = doc.getElementById("brideName");
        const groomEl = doc.getElementById("groomName");
        const msgEl = doc.getElementById("customMessage");
        const ceremonyEl = doc.getElementById("ceremonyText");
        const receptionEl = doc.getElementById("receptionText");
        const dateEl = doc.getElementById("dateText");
        const mapBtn = doc.getElementById("btnMap");

        if (brideEl) brideEl.textContent = inputBride.value;
        if (groomEl) groomEl.textContent = inputGroom.value;
        if (msgEl) msgEl.textContent = inputMessage.value;
        if (ceremonyEl) ceremonyEl.textContent = inputCeremony.value;
        if (receptionEl) receptionEl.textContent = inputReception.value;

        // Mise à jour de la date
        if (dateEl && inputDate.value) {
            const dateObj = new Date(`${inputDate.value}T${inputTime.value || '00:00'}`);
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const formatter = new Intl.DateTimeFormat('fr-FR', options);
            let formatted = formatter.format(dateObj);
            formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
            dateEl.textContent = `${formatted} à ${(inputTime.value || '00:00').replace(':', 'h')}`;

            // Mettre à jour aussi l'objet date dans l'iframe pour le compte à rebours
            if (iframe.contentWindow.weddingDateObj) {
                iframe.contentWindow.weddingDateObj = dateObj;
            }
        }

        // Mettre à jour la classe du thème
        doc.body.className = `theme-${activeTheme}`;

        // Mettre à jour l'audio si l'index a changé
        if (iframe.contentWindow.setupAudio) {
            iframe.contentWindow.setupAudio(parseInt(selectMusic.value));
        }

        // Mettre à jour le lien GPS (utiliser le lieu de la réception)
        if (mapBtn) {
            mapBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(inputReception.value)}`;
        }
    }

    // Écouter les frappes et modifications du formulaire
    form.addEventListener("input", updatePreview);

    // Initialiser la sélection de thème
    themeOptions.forEach(opt => {
        opt.addEventListener("click", () => {
            themeOptions.forEach(o => o.classList.remove("active"));
            opt.classList.add("active");
            activeTheme = opt.dataset.theme;
            updatePreview();
        });
    });

    // Lors du chargement complet de l'iframe, appliquer les valeurs actuelles du formulaire
    iframe.addEventListener("load", () => {
        // Un court délai pour s'assurer que le script de l'iframe est prêt
        setTimeout(updatePreview, 300);
    });

    // Génération et copie du lien de partage
    const btnCopyLink = document.getElementById("btnCopyLink");
    if (btnCopyLink) {
        btnCopyLink.addEventListener("click", () => {
            const link = generateShareableLink();
            
            // Copier dans le presse-papiers
            navigator.clipboard.writeText(link).then(() => {
                alert("Lien d'invitation copié dans le presse-papiers ! Vous pouvez maintenant l'envoyer à vos invités.");
            }).catch(err => {
                // Alternative si la copie échoue
                prompt("Copiez ce lien pour le partager :", link);
            });
        });
    }

    // Récupérer le lien pour prévisualisation externe
    const btnViewExternal = document.getElementById("btnViewExternal");
    if (btnViewExternal) {
        btnViewExternal.addEventListener("click", () => {
            const link = generateShareableLink();
            window.open(link, '_blank');
        });
    }

    /**
     * Génère l'URL complète avec les paramètres encodés en Base64.
     */
    function generateShareableLink() {
        const config = {
            g: inputGroom.value,
            b: inputBride.value,
            d: inputDate.value,
            t: inputTime.value,
            c: inputCeremony.value,
            r: inputReception.value,
            m: inputMessage.value,
            th: activeTheme,
            mu: parseInt(selectMusic.value)
        };

        // Encodage en Base64 pour éviter les caractères spéciaux dans l'URL
        const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(config))));
        
        // Construire l'URL vers invitation.html
        const currentUrl = window.location.href;
        const baseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/'));
        return `${baseUrl}/invitation.html?d1=${encoded}`;
    }
}

/**
 * Gère le système d'onglets de la barre latérale.
 */
function setupTabs() {
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabPanels = document.querySelectorAll(".tab-panel");

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const target = btn.dataset.tab;

            tabButtons.forEach(b => b.classList.remove("active"));
            tabPanels.forEach(p => p.classList.add("hidden"));

            btn.classList.add("active");
            document.getElementById(`tab-${target}`).classList.remove("hidden");
        });
    });
}

/**
 * Charge les statistiques et la liste RSVP sur le tableau de bord.
 */
function loadRSVPDashboard() {
    if (!window.weddingDb) return;

    const rsvps = window.weddingDb.getRSVPs();
    
    // Éléments du DOM
    const statTotalEl = document.getElementById("statTotal");
    const statYesEl = document.getElementById("statYes");
    const statGuestsEl = document.getElementById("statGuests");
    const tableBody = document.getElementById("rsvpTableBody");

    // Calculs statistiques
    const yesCount = rsvps.filter(r => r.attending === 'yes').length;
    const totalGuests = rsvps.reduce((acc, curr) => acc + (curr.attending === 'yes' ? (curr.guests + 1) : 0), 0);

    if (statTotalEl) statTotalEl.textContent = rsvps.length;
    if (statYesEl) statYesEl.textContent = yesCount;
    if (statGuestsEl) statGuestsEl.textContent = totalGuests;

    // Remplir le tableau
    if (tableBody) {
        tableBody.innerHTML = "";
        
        if (rsvps.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #a1a1aa; padding: 20px;">Aucune réponse pour le moment.</td></tr>`;
            return;
        }

        rsvps.forEach(rsvp => {
            const tr = document.createElement("tr");

            // Statut badge
            const isYes = rsvp.attending === 'yes';
            const badgeClass = isYes ? 'badge-rsvp yes' : 'badge-rsvp no';
            const badgeText = isYes ? 'Oui' : 'Non';

            // Date de réponse
            const responseDate = new Date(rsvp.timestamp).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });

            tr.innerHTML = `
                <td>
                    <strong>${escapeHTML(rsvp.name)}</strong>
                    ${rsvp.notes ? `<div style="font-size: 10px; color: #a1a1aa; margin-top: 4px; font-style: italic;">"${escapeHTML(rsvp.notes)}"</div>` : ''}
                </td>
                <td><span class="${badgeClass}">${badgeText}</span></td>
                <td style="text-align: center;">${isYes ? rsvp.guests + 1 : 0}</td>
                <td style="color: #71717a; font-size: 10px;">${responseDate}</td>
            `;

            tableBody.appendChild(tr);
        });

    }

    // Gérer le bouton d'effacement
    const btnClearRSVPs = document.getElementById("btnClearRSVPs");
    if (btnClearRSVPs && !btnClearRSVPs.onclick) {
        btnClearRSVPs.onclick = () => {
            if (confirm("Voulez-vous vraiment effacer tout l'historique des RSVPs des invités ?")) {
                window.weddingDb.clearRSVPs();
                loadRSVPDashboard();
            }
        };
    }
}

/**
 * Gestion du menu mobile (hamburger toggle).
 */
function setupMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const btnOpen = document.getElementById('btnMobileToggle');
    const btnClose = document.getElementById('btnSidebarClose');

    if (!sidebar || !btnOpen || !btnClose) return;

    // Créer l'overlay
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.id = 'sidebarOverlay';
    document.body.appendChild(overlay);

    function openSidebar() {
        sidebar.classList.add('is-open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        sidebar.classList.remove('is-open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    btnOpen.addEventListener('click', openSidebar);
    btnClose.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);

    // Fermer avec la touche Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSidebar();
    });
}

/**
 * Sécurise l'affichage de l'HTML pour éviter les failles XSS.
 */
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
