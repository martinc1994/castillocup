import './style.css';
import { loadTournamentState, saveTournamentState, isDrawLocked } from './modules/storage.js';
import { renderBracketTree, renderRoundsView } from './modules/bracket.js';
import { DrawManager } from './modules/draw.js';
import { ProdeManager } from './modules/prode.js';
import { MatchModal } from './components/MatchModal.js';
import { AdminManager, isAdminAuthenticated } from './modules/admin.js';
import { sound } from './modules/audio.js';
import { TOURNAMENT_INFO } from './data/rules.js';
import { fetchRemoteTournamentState, saveRemoteTournamentState, isSupabaseConfigured } from './services/supabase.js';

// Application State
let tournamentState = loadTournamentState();
let activeView = 'tree'; // 'tree' or 'rounds'
let activeRoundTab = 'r16'; // 'r16', 'r8', 'r4', 'r2', 'r1'
let currentZoom = 1;

// Managers & Modals
let drawManager = null;
let prodeManager = null;
let matchModal = null;
let adminManager = null;

// Initialize App
function initApp() {
  // Limpieza preventiva de pruebas locales para garantizar un inicio en blanco
  try {
    const obsoleteKeys = [
      "castillo_cup_tournament_state_v1",
      "castillo_cup_tournament_state_v2",
      "castillo_cup_prode_submissions_v1",
      "castillo_cup_draw_lock_v1",
      "castillo_cup_my_prode"
    ];
    obsoleteKeys.forEach(key => localStorage.removeItem(key));
  } catch (err) {
    //
  }

  // Setup Match and Admin Modals
  matchModal = new MatchModal(tournamentState, async (updatedMatchId) => {
    saveTournamentState(tournamentState);
    if (isAdminAuthenticated() && isSupabaseConfigured()) {
      await saveRemoteTournamentState(tournamentState);
    }
    refreshBracketViews();
    if (prodeManager) prodeManager.render(document.getElementById('prodeContainer'));
  });

  adminManager = new AdminManager(tournamentState, () => {
    refreshAllViews();
  });

  // Setup Prode Manager
  prodeManager = new ProdeManager(tournamentState);
  prodeManager.render(document.getElementById('prodeContainer'));

  // Setup Draw Manager
  drawManager = new DrawManager(tournamentState, handleDrawStepUpdate);

  // Setup Navigation Tabs
  setupNavigation();

  // Setup Header Actions (Sound & Admin)
  setupHeaderActions();

  // Setup Countdown
  startCountdown();

  // Setup Bracket Viewport & Controls
  setupBracketControls();

  // Setup Draw Section UI
  setupDrawSection();

  // Sincronizar automáticamente el fixture oficial desde Supabase al iniciar
  if (isSupabaseConfigured()) {
    fetchRemoteTournamentState().then(remoteState => {
      if (remoteState && remoteState.rounds && remoteState.isDrawn) {
        Object.assign(tournamentState, remoteState);
        saveTournamentState(tournamentState);
        refreshAllViews();
      } else if (!remoteState || !remoteState.isDrawn) {
        // Si en la base de datos oficial aún no se realizó el sorteo, mantener la grilla vacía
        tournamentState.isDrawn = false;
        tournamentState.drawDate = null;
        Object.keys(tournamentState.rounds).forEach(rk => {
          tournamentState.rounds[rk].forEach(m => {
            m.player1 = null;
            m.player2 = null;
            m.score1_ida = null;
            m.score2_ida = null;
            m.score1_vuelta = null;
            m.score2_vuelta = null;
            m.score1_extra = null;
            m.score2_extra = null;
            m.penalties1 = null;
            m.penalties2 = null;
            m.status = "pending";
            m.winner = null;
          });
        });
        tournamentState.champion = null;
        saveTournamentState(tournamentState);
        refreshAllViews();
      }
    });
  }

  // Setup Players Section
  setupPlayersSection();

  // Initial Bracket Render
  refreshBracketViews();

  // Check draw lock state
  checkAndApplyDrawLockState();
}

// -------------------------------------------------------------
// NAVIGATION
// -------------------------------------------------------------
function setupNavigation() {
  const navButtons = document.querySelectorAll('#mainNav .nav-btn');
  const panes = document.querySelectorAll('.tab-pane');
  const heroSection = document.getElementById('heroSection');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      sound.playClick();
      const target = btn.getAttribute('data-tab-target');

      navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

      panes.forEach(pane => {
        pane.classList.toggle('active', pane.id === `pane-${target}`);
      });

      // Solo la página "Fixture" muestra la carátula con cuenta regresiva
      if (heroSection) {
        if (target === 'bracket') {
          heroSection.classList.remove('hidden');
        } else {
          heroSection.classList.add('hidden');
        }
      }

      // Special re-renders when switching tabs
      if (target === 'bracket') {
        refreshBracketViews();
      } else if (target === 'draw') {
        renderDrawPoolAndPairs();
      } else if (target === 'prode') {
        prodeManager.render(document.getElementById('prodeContainer'));
      }
    });
  });
}

function setupHeaderActions() {
  const soundBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');
  const adminBtn = document.getElementById('adminFooterBtn') || document.getElementById('adminHeaderBtn');

  // Sound Toggle
  const updateSoundIcon = () => {
    soundIcon.textContent = sound.isMuted() ? '🔇' : '🔊';
  };
  updateSoundIcon();

  soundBtn.addEventListener('click', () => {
    const isMuted = sound.toggleMute();
    updateSoundIcon();
    if (!isMuted) sound.playClick();
  });

  // Admin Modal (botón discreto en footer)
  if (adminBtn && adminManager) {
    adminBtn.addEventListener('click', () => {
      adminManager.open();
    });
  }
}

// -------------------------------------------------------------
// COUNTDOWN TIMER (VIERNES 30/10 22:00 HS)
// -------------------------------------------------------------
function startCountdown() {
  const targetDate = new Date(TOURNAMENT_INFO.launchDate).getTime();
  const countdownBox = document.getElementById('countdownBox');

  const daysEl = document.getElementById('cdDays');
  const hoursEl = document.getElementById('cdHours');
  const minsEl = document.getElementById('cdMinutes');
  const secsEl = document.getElementById('cdSeconds');

  let timerInterval = null;

  const update = () => {
    const now = new Date().getTime();
    const diff = targetDate - now;

    if (diff <= 0) {
      if (countdownBox) {
        countdownBox.classList.add('tournament-started');
        countdownBox.innerHTML = `
          <div class="countdown-started">
            <span class="live-pulse"></span>
            <span class="countdown-started-text">La copa ya empezó</span>
          </div>
        `;
      }
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      return;
    }

    if (daysEl && hoursEl && minsEl && secsEl) {
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      daysEl.textContent = String(d).padStart(2, '0');
      hoursEl.textContent = String(h).padStart(2, '0');
      minsEl.textContent = String(m).padStart(2, '0');
      secsEl.textContent = String(s).padStart(2, '0');
    }
  };

  update();
  timerInterval = setInterval(update, 1000);
}

// -------------------------------------------------------------
// BRACKET CONTROLS & VIEWS
// -------------------------------------------------------------
function setupBracketControls() {
  const btnTree = document.getElementById('btnViewTree');
  const btnRounds = document.getElementById('btnViewRounds');
  const zoomControls = document.getElementById('treeZoomControls');

  btnTree.addEventListener('click', () => {
    sound.playClick();
    activeView = 'tree';
    btnTree.classList.add('active');
    btnRounds.classList.remove('active');
    zoomControls.style.display = 'flex';
    refreshBracketViews();
  });

  btnRounds.addEventListener('click', () => {
    sound.playClick();
    activeView = 'rounds';
    btnRounds.classList.add('active');
    btnTree.classList.remove('active');
    zoomControls.style.display = 'none';
    refreshBracketViews();
  });

  // Zoom
  const zoomIn = document.getElementById('btnZoomIn');
  const zoomOut = document.getElementById('btnZoomOut');
  const zoomReset = document.getElementById('btnZoomReset');
  const zoomText = document.getElementById('zoomLevelText');

  const applyZoom = () => {
    const wrapper = document.querySelector('.bracket-tree-wrapper');
    if (wrapper) {
      wrapper.style.transform = `scale(${currentZoom})`;
    }
    zoomText.textContent = `${Math.round(currentZoom * 100)}%`;
  };

  zoomIn.addEventListener('click', () => {
    if (currentZoom < 1.6) {
      currentZoom += 0.15;
      applyZoom();
    }
  });

  zoomOut.addEventListener('click', () => {
    if (currentZoom > 0.6) {
      currentZoom -= 0.15;
      applyZoom();
    }
  });

  zoomReset.addEventListener('click', () => {
    currentZoom = 1;
    applyZoom();
  });
}

function refreshBracketViews() {
  const container = document.getElementById('bracketRenderContainer');
  if (!container) return;

  if (activeView === 'tree') {
    renderBracketTree(container, tournamentState, (matchId) => {
      matchModal.open(matchId, isAdminAuthenticated());
    });
    // Reapply zoom if active
    const wrapper = container.querySelector('.bracket-tree-wrapper');
    if (wrapper) {
      wrapper.style.transform = `scale(${currentZoom})`;
    }
  } else {
    renderRoundsView(container, tournamentState, activeRoundTab, (matchId) => {
      matchModal.open(matchId, isAdminAuthenticated());
    }, (newRoundKey) => {
      activeRoundTab = newRoundKey;
      refreshBracketViews();
    });
  }
}

// -------------------------------------------------------------
// LIVE DRAW SYSTEM (EL GRAN SORTEO)
// -------------------------------------------------------------
function checkAndApplyDrawLockState() {
  const isAdmin = isAdminAuthenticated();
  const lockedBanner = document.getElementById('drawLockedBanner');
  const buttonsRow = document.getElementById('drawButtonsRow');
  const statusBadge = document.getElementById('drawStatusText');
  const statusPill = document.getElementById('drawStatusBadge');
  const lockedDeviceLabel = document.getElementById('lockedDeviceLabel');
  const announcePlayer = document.getElementById('announcementPlayer');
  const announceDest = document.getElementById('announcementDest');
  const announceSub = document.getElementById('announcementSub');

  const isDrawn = tournamentState.isDrawn && tournamentState.rounds.r16[0]?.player1 && tournamentState.rounds.r16[0]?.player2;

  if (isDrawn) {
    if (lockedBanner) {
      lockedBanner.classList.remove('hidden');
      const bannerTitle = lockedBanner.querySelector('h4');
      const bannerP = lockedBanner.querySelector('p');
      if (bannerTitle) bannerTitle.textContent = 'Sorteo Oficial Realizado';
      if (bannerP) bannerP.textContent = 'Los 16 cruces quedaron formalmente asignados. Podés explorar el Fixture y registrar tu jugada en el Prode.';
    }
    if (buttonsRow) buttonsRow.style.display = 'none';
    if (statusBadge) statusBadge.textContent = '🏆 Sorteo Oficial Completado';
    if (statusPill) statusPill.classList.add('locked');

    if (lockedDeviceLabel) {
      lockedDeviceLabel.textContent = 'Sorteo Oficial Registrado';
    }

    if (announceSub) announceSub.textContent = 'CRUCES OFICIALES DEFINIDOS';
    if (announcePlayer) announcePlayer.textContent = '16 Cruces de 16-avos';
    if (announceDest) announceDest.textContent = 'Explorá el Fixture o completá tu Prode';
  } else {
    if (lockedBanner) lockedBanner.classList.add('hidden');
    if (statusPill) statusPill.classList.remove('locked');

    if (isAdmin) {
      if (buttonsRow) buttonsRow.style.display = 'flex';
      const btnStart = document.getElementById('btnStartAutoDraw');
      if (btnStart) btnStart.innerHTML = '<span>▶️ Iniciar Sorteo Oficial</span>';
      if (statusBadge) statusBadge.textContent = '⚡ Modo Administrador: Listo para Sortear';
      if (announceSub) announceSub.textContent = 'BOLILLERO OFICIAL';
      if (announcePlayer) announcePlayer.textContent = 'Presioná el botón para iniciar el sorteo';
      if (announceDest) announceDest.textContent = '32 Jugadores en el bombo listos para sortear';
    } else {
      if (buttonsRow) buttonsRow.style.display = 'none';
      if (statusBadge) statusBadge.textContent = '⏳ A la espera del Sorteo Oficial';
      if (announceSub) announceSub.textContent = 'SORTEO EN VIVO';
      if (announcePlayer) announcePlayer.textContent = 'Aguardando el Sorteo Oficial';
      if (announceDest) announceDest.textContent = 'El organizador realizará el sorteo oficial. Las llaves se completarán en vivo.';
    }
  }
}

function setupDrawSection() {
  const btnStartAuto = document.getElementById('btnStartAutoDraw');
  const btnReset = document.getElementById('btnResetDraw');
  const btnToFixture = document.getElementById('btnGoToFixtureFromDraw');
  const btnToProde = document.getElementById('btnGoToProdeFromDraw');

  btnStartAuto?.addEventListener('click', () => {
    if (!isAdminAuthenticated()) {
      alert('Solo el organizador administrador puede realizar el sorteo oficial.');
      return;
    }
    if (tournamentState.isDrawn && tournamentState.rounds.r16[0]?.player1) {
      alert('🏆 El sorteo oficial ya fue realizado.');
      return;
    }

    sound.playClick();
    const ballSphere = document.getElementById('drawBallSphere');
    ballSphere?.classList.add('spin');
    // Animación pausada y emocionante (850ms)
    drawManager.startAutoDraw(850);
  });

  btnReset?.addEventListener('click', () => {
    if (!isAdminAuthenticated()) return;
    if (confirm('¿Deseas reiniciar el sorteo? Se vaciarán los cruces.')) {
      sound.playClick();
      drawManager.resetDraw();
    }
  });

  // Locked Banner Navigation CTAs
  btnToFixture?.addEventListener('click', () => {
    sound.playClick();
    document.querySelector('[data-tab-target="bracket"]')?.click();
  });

  btnToProde?.addEventListener('click', () => {
    sound.playClick();
    document.querySelector('[data-tab-target="prode"]')?.click();
  });

  checkAndApplyDrawLockState();
  renderDrawPoolAndPairs();
}

async function handleDrawStepUpdate(event) {
  const ballSphere = document.getElementById('drawBallSphere');
  const announcePlayer = document.getElementById('announcementPlayer');
  const announceDest = document.getElementById('announcementDest');
  const announceSub = document.getElementById('announcementSub');
  const statusBadge = document.getElementById('drawStatusText');

  if (event.isReset) {
    announcePlayer.textContent = 'Aguardando el Sorteo Oficial';
    announceDest.textContent = '32 Jugadores esperando en el bombo';
    announceSub.textContent = 'BOLILLERO LISTO';
    statusBadge.textContent = '⏳ A la espera del Sorteo Oficial';
    ballSphere?.classList.remove('spin');
    checkAndApplyDrawLockState();
    renderDrawPoolAndPairs();
    refreshBracketViews();
    return;
  }

  if (event.isComplete) {
    ballSphere?.classList.remove('spin');
    announceSub.textContent = '¡SORTEO OFICIAL COMPLETADO!';
    announcePlayer.textContent = '16 Cruces Oficiales Definidos';
    announceDest.textContent = '¡Ya podés cargar tu Prode y disputar la Castillo Cup!';
    statusBadge.textContent = '🏆 Sorteo Oficial Registrado';
    saveTournamentState(tournamentState);
    if (isAdminAuthenticated() && isSupabaseConfigured()) {
      await saveRemoteTournamentState(tournamentState);
    }
    checkAndApplyDrawLockState();
    renderDrawPoolAndPairs();
    refreshBracketViews();
    if (prodeManager) prodeManager.render(document.getElementById('prodeContainer'));
    return;
  }

  if (event.player) {
    announceSub.textContent = `BOLILLA #${event.totalDrawn} EXTRAÍDA`;
    announcePlayer.textContent = event.player.name;
    announceDest.textContent = `Asignado a: Llave #${event.matchIndex} (Lado ${event.slot})`;
    statusBadge.textContent = `Sorteando en vivo... (${event.totalDrawn}/32)`;
    renderDrawPoolAndPairs();
    refreshBracketViews();
  }
}

function renderDrawPoolAndPairs() {
  const poolContainer = document.getElementById('poolPlayersList');
  const poolRemainingEl = document.getElementById('poolRemainingCount');
  const pairsContainer = document.getElementById('drawPairsGrid');

  if (!poolContainer || !pairsContainer) return;

  // Render pool chips
  const assignedPlayerIds = new Set();
  tournamentState.rounds.r16.forEach(m => {
    if (m.player1) assignedPlayerIds.add(m.player1.id);
    if (m.player2) assignedPlayerIds.add(m.player2.id);
  });

  const remaining = tournamentState.players.filter(p => !assignedPlayerIds.has(p.id));
  if (poolRemainingEl) poolRemainingEl.textContent = remaining.length;

  poolContainer.innerHTML = tournamentState.players.map(p => {
    const isDrawn = assignedPlayerIds.has(p.id);
    return `
      <div class="pool-player-chip ${isDrawn ? 'drawn' : ''}">
        <span>#${p.id}</span>
        <strong>${p.name}</strong>
      </div>
    `;
  }).join('');

  // Render 16 pairs preview
  pairsContainer.innerHTML = tournamentState.rounds.r16.map((m, idx) => {
    const p1 = m.player1;
    const p2 = m.player2;
    return `
      <div class="draw-pair-card">
        <div class="pair-card-header">Llave #${idx + 1}</div>
        <div class="pair-slot ${p1 ? 'newly-drawn' : 'empty'}">
          <span>🔵</span>
          <strong>${p1 ? p1.name : 'Por sortear...'}</strong>
        </div>
        <div class="pair-slot ${p2 ? 'newly-drawn' : 'empty'}">
          <span>🔴</span>
          <strong>${p2 ? p2.name : 'Por sortear...'}</strong>
        </div>
      </div>
    `;
  }).join('');
}

// -------------------------------------------------------------
// PLAYERS DIRECTORY (32 INSCRIBED)
// -------------------------------------------------------------
function setupPlayersSection() {
  const container = document.getElementById('playersCardsGrid');
  const searchInput = document.getElementById('playerSearchInput');

  const render = (filter = '') => {
    const q = filter.toLowerCase().trim();
    const filtered = tournamentState.players.filter(p => 
      p.name.toLowerCase().includes(q)
    );

    container.innerHTML = filtered.map(p => {
      // Solo el jugador 0 (Darío C. 🐐) tiene el resaltado de estrella
      const isStar = p.id === 0 || p.name.includes("Darío C.");
      return `
        <div class="player-card ${isStar ? 'star-player-card' : ''} ${p.note ? 'has-warning' : ''}">
          <span class="player-index-badge ${isStar ? 'star-badge-num' : ''}">#${p.id}</span>
          <div class="player-avatar-large ${isStar ? 'star-avatar' : ''}">${isStar ? '🐐' : p.name.charAt(0)}</div>
          <div class="player-card-info">
            <div class="player-name-row">
              <h4 class="player-card-name ${isStar ? 'star-name-gold' : ''}">${p.name}</h4>
              ${isStar ? '<span class="star-badge-pill">⭐ FIGURA</span>' : ''}
            </div>
            ${p.note 
              ? `<span class="player-status-tag pending-note">⚠️ ${p.note}</span>` 
              : `<span class="player-status-tag ${isStar ? 'star-confirmed' : 'confirmed'}">✓ Confirmado</span>`}
          </div>
        </div>
      `;
    }).join('');
  };

  render();

  searchInput.addEventListener('input', (e) => {
    render(e.target.value);
  });
}

// Global View Refresher
function refreshAllViews() {
  refreshBracketViews();
  checkAndApplyDrawLockState();
  renderDrawPoolAndPairs();
  if (prodeManager) prodeManager.render(document.getElementById('prodeContainer'));
  setupPlayersSection();
}

// Run on DOM Ready
document.addEventListener('DOMContentLoaded', initApp);
