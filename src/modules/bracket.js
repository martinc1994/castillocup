// Módulo de renderizado de Fixture y Bracket Eliminatorio
import { computeMatchOutcome } from "./storage.js";
import { ROUND_TEAMS } from "../data/rules.js";

export function renderBracketTree(containerEl, state, onMatchClick) {
  if (!containerEl) return;

  const roundsConfig = [
    { key: "r16", title: "16-avos de Final", count: 16 },
    { key: "r8", title: "Octavos de Final", count: 8 },
    { key: "r4", title: "Cuartos de Final", count: 4 },
    { key: "r2", title: "Semifinales", count: 2 },
    { key: "r1", title: "Gran Final", count: 1 }
  ];

  let html = `
    <div class="bracket-tree-wrapper">
      <div class="bracket-tree-container">
  `;

  roundsConfig.forEach((round, roundIdx) => {
    const matches = state.rounds[round.key] || [];
    const teamConfig = ROUND_TEAMS[round.key];
    const teamLogoSrc = `/${teamConfig.badgeFile}`;

    html += `
      <div class="bracket-column round-col-${round.key}" data-round="${round.key}">
        <!-- Único escudo arriba de todo con el nombre de la regla por ronda -->
        <div class="bracket-col-header">
          <div class="round-team-tag" title="Equipo fijado para esta ronda: ${teamConfig.teamName}">
            <img src="${teamLogoSrc}" alt="${teamConfig.teamName}" class="round-team-crest" onerror="this.style.display='none'">
            <span>${teamConfig.ruleLabel}</span>
          </div>
          <h3 class="round-title">${round.title}</h3>
          <span class="round-count">${matches.length} ${matches.length === 1 ? 'Partido' : 'Partidos'} • Ida y Vuelta</span>
        </div>

        <div class="bracket-matches-list">
    `;

    matches.forEach((m, matchIdx) => {
      const outcome = computeMatchOutcome(m);
      const p1Name = m.player1 ? m.player1.name : "Por Definir";
      const p2Name = m.player2 ? m.player2.name : "Por Definir";
      const isP1Winner = outcome.winner && m.player1 && outcome.winner.id === m.player1.id;
      const isP2Winner = outcome.winner && m.player2 && outcome.winner.id === m.player2.id;

      const hasScores = m.score1_ida !== null || m.score1_vuelta !== null;

      let scoreBadge = "";
      if (outcome.isFinished) {
        if (outcome.needsExtra) {
          scoreBadge = `<span class="badge-tag extra">Global ${outcome.global1}-${outcome.global2} (3º P: ${m.score1_extra}-${m.score2_extra}${m.penalties1 !== null ? ` Pen: ${m.penalties1}-${m.penalties2}` : ''})</span>`;
        } else {
          scoreBadge = `<span class="badge-tag finished">Global: ${outcome.global1} - ${outcome.global2}</span>`;
        }
      } else if (hasScores) {
        scoreBadge = `<span class="badge-tag live">En Curso</span>`;
      } else {
        scoreBadge = `<span class="badge-tag pending">Ida y Vuelta</span>`;
      }

      html += `
        <div class="tree-match-card ${outcome.isFinished ? 'is-finished' : ''} ${!m.player1 || !m.player2 ? 'is-empty' : ''}" 
             data-match-id="${m.id}" 
             title="Click para ver detalle del cruce">
          <div class="tree-match-header">
            <span class="match-num">#${matchIdx + 1}</span>
            ${scoreBadge}
          </div>

          <!-- Jugador 1 (Espacioso, sin escudo repetido) -->
          <div class="tree-participant ${isP1Winner ? 'winner' : ''} ${!m.player1 ? 'tbd' : ''}">
            <div class="participant-info">
              <span class="player-dot ${m.player1 ? 'active' : ''}"></span>
              <span class="participant-name" title="${p1Name}">${p1Name}</span>
              ${isP1Winner ? '<span class="winner-icon">🏆</span>' : ''}
            </div>
            <div class="scores-group">
              <span class="score-pill ida" title="Ida">${m.score1_ida !== null ? m.score1_ida : '-'}</span>
              <span class="score-pill vuelta" title="Vuelta">${m.score1_vuelta !== null ? m.score1_vuelta : '-'}</span>
              ${outcome.isFinished ? `<span class="score-pill total" title="Global">${outcome.global1}</span>` : ''}
            </div>
          </div>

          <div class="tree-divider"></div>

          <!-- Jugador 2 (Espacioso, sin escudo repetido) -->
          <div class="tree-participant ${isP2Winner ? 'winner' : ''} ${!m.player2 ? 'tbd' : ''}">
            <div class="participant-info">
              <span class="player-dot ${m.player2 ? 'active' : ''}"></span>
              <span class="participant-name" title="${p2Name}">${p2Name}</span>
              ${isP2Winner ? '<span class="winner-icon">🏆</span>' : ''}
            </div>
            <div class="scores-group">
              <span class="score-pill ida" title="Ida">${m.score2_ida !== null ? m.score2_ida : '-'}</span>
              <span class="score-pill vuelta" title="Vuelta">${m.score2_vuelta !== null ? m.score2_vuelta : '-'}</span>
              ${outcome.isFinished ? `<span class="score-pill total" title="Global">${outcome.global2}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  // Columna de Trofeo y Campeón
  if (state.champion) {
    const finalTeam = ROUND_TEAMS.r1;
    html += `
      <div class="bracket-column champion-col">
        <div class="bracket-col-header">
          <div class="round-team-tag gold">
            <img src="/${finalTeam.badgeFile}" alt="Brasil" class="round-team-crest">
            <span>Brasil Campeón</span>
          </div>
          <h3 class="round-title gold">Campeón</h3>
        </div>
        <div class="champion-card-trophy">
          <div class="trophy-glow-icon">🏆</div>
          <span class="champion-label">CAMPEÓN CASTILLO CUP</span>
          <h2 class="champion-name">${state.champion.name}</h2>
          <span class="champion-prize-badge">Premio: $50.000 ARS</span>
          <div class="champion-team-showcase">
            <img src="/${finalTeam.badgeFile}" alt="Brasil" class="champion-badge-img">
            <span>Rey de PES 6 con Brasil</span>
          </div>
        </div>
      </div>
    `;
  }

  html += `
      </div>
    </div>
  `;

  containerEl.innerHTML = html;

  // Add click listeners to all match cards
  containerEl.querySelectorAll(".tree-match-card").forEach(el => {
    el.addEventListener("click", () => {
      const matchId = el.getAttribute("data-match-id");
      if (onMatchClick) onMatchClick(matchId);
    });
  });
}

// Vista Mobile por Rondas (Tabs)
export function renderRoundsView(containerEl, state, activeRoundKey, onMatchClick, onRoundChange) {
  if (!containerEl) return;

  const roundsConfig = [
    { key: "r16", label: "16-avos", title: "16-avos de Final (32 Jugadores)", count: 16 },
    { key: "r8", label: "Octavos", title: "Octavos de Final (16 Jugadores)", count: 8 },
    { key: "r4", label: "Cuartos", title: "Cuartos de Final (8 Jugadores)", count: 4 },
    { key: "r2", label: "Semis", title: "Semifinales (4 Jugadores)", count: 2 },
    { key: "r1", label: "Final", title: "Gran Final (2 Jugadores)", count: 1 }
  ];

  const currentRound = roundsConfig.find(r => r.key === activeRoundKey) || roundsConfig[0];
  const teamConfig = ROUND_TEAMS[currentRound.key];
  const matches = state.rounds[currentRound.key] || [];

  let html = `
    <div class="rounds-view-container">
      <!-- Selector de Rondas con Escudos -->
      <div class="rounds-tabs-bar">
        ${roundsConfig.map(r => {
          const tConf = ROUND_TEAMS[r.key];
          return `
            <button class="round-tab-btn ${r.key === activeRoundKey ? 'active' : ''}" data-round-tab="${r.key}">
              <img src="/${tConf.badgeFile}" alt="${tConf.shortName}" class="tab-team-crest">
              <span>${r.label}</span>
              <span class="tab-count">${r.count}</span>
            </button>
          `;
        }).join('')}
      </div>

      <div class="round-view-info">
        <div class="round-headline-group">
          <h4>${currentRound.title}</h4>
          <div class="fixed-team-banner">
            <img src="/${teamConfig.badgeFile}" alt="${teamConfig.teamName}" class="banner-team-crest">
            <span>Equipo Fijo: <strong>${teamConfig.teamName}</strong> (${teamConfig.ruleLabel})</span>
          </div>
        </div>
        <span class="round-note">Ida y Vuelta • Marcador Global • 3er Partido en Empate</span>
      </div>

      <!-- Lista de Partidos de la Ronda -->
      <div class="round-matches-grid">
  `;

  matches.forEach((m, idx) => {
    const outcome = computeMatchOutcome(m);
    const p1 = m.player1;
    const p2 = m.player2;
    const p1Name = p1 ? p1.name : "Por definir";
    const p2Name = p2 ? p2.name : "Por definir";

    const isP1Win = outcome.winner && p1 && outcome.winner.id === p1.id;
    const isP2Win = outcome.winner && p2 && outcome.winner.id === p2.id;

    html += `
      <div class="round-match-card ${outcome.isFinished ? 'card-finished' : ''}" data-match-id="${m.id}">
        <div class="match-card-top">
          <span class="match-badge">Cruce #${idx + 1}</span>
          ${outcome.isFinished 
            ? `<span class="status-pill finished">Finalizado • Global ${outcome.global1}-${outcome.global2}</span>`
            : (m.score1_ida !== null || m.score1_vuelta !== null) 
              ? `<span class="status-pill live">En juego</span>`
              : `<span class="status-pill pending">Pendiente</span>`}
        </div>

        <div class="match-card-teams">
          <div class="match-team-row ${isP1Win ? 'is-winner' : ''}">
            <div class="team-meta">
              <span class="player-dot ${p1 ? 'active' : ''}"></span>
              <div class="team-names">
                <span class="player-main-name">${p1Name}</span>
                ${p1?.note ? `<span class="player-badge-warn">⚠️ ${p1.note}</span>` : ''}
              </div>
            </div>
            <div class="team-scores">
              <span class="score-box" title="Ida">${m.score1_ida !== null ? m.score1_ida : '-'}</span>
              <span class="score-separator">:</span>
              <span class="score-box" title="Vuelta">${m.score1_vuelta !== null ? m.score1_vuelta : '-'}</span>
              ${outcome.isFinished ? `<span class="global-total" title="Total Global">${outcome.global1}</span>` : ''}
            </div>
          </div>

          <div class="match-versus-divider">
            <span class="vs-text">VS</span>
          </div>

          <div class="match-team-row ${isP2Win ? 'is-winner' : ''}">
            <div class="team-meta">
              <span class="player-dot ${p2 ? 'active' : ''}"></span>
              <div class="team-names">
                <span class="player-main-name">${p2Name}</span>
                ${p2?.note ? `<span class="player-badge-warn">⚠️ ${p2.note}</span>` : ''}
              </div>
            </div>
            <div class="team-scores">
              <span class="score-box" title="Ida">${m.score2_ida !== null ? m.score2_ida : '-'}</span>
              <span class="score-separator">:</span>
              <span class="score-box" title="Vuelta">${m.score2_vuelta !== null ? m.score2_vuelta : '-'}</span>
              ${outcome.isFinished ? `<span class="global-total" title="Total Global">${outcome.global2}</span>` : ''}
            </div>
          </div>
        </div>

        ${outcome.needsExtra ? `
          <div class="match-extra-summary">
            <span>⚡ Desempate 3er Partido: <strong>${m.score1_extra} - ${m.score2_extra}</strong></span>
            ${m.penalties1 !== null ? `<span>(Penales: ${m.penalties1} - ${m.penalties2})</span>` : ''}
          </div>
        ` : ''}

        <div class="match-card-actions">
          <button class="btn-card-detail" data-match-id="${m.id}">
            <span>Ver Detalle & Cargar Marcador</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  containerEl.innerHTML = html;

  // Listeners para cambiar pestañas de ronda
  containerEl.querySelectorAll("[data-round-tab]").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetRound = btn.getAttribute("data-round-tab");
      if (onRoundChange) onRoundChange(targetRound);
    });
  });

  // Listeners para abrir detalle de partido
  containerEl.querySelectorAll("[data-match-id]").forEach(card => {
    card.addEventListener("click", () => {
      const matchId = card.getAttribute("data-match-id");
      if (onMatchClick) onMatchClick(matchId);
    });
  });
}
