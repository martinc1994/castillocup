import { findMatchById, computeMatchOutcome, updateMatchAndPropagate } from "../modules/storage.js";
import { sound } from "../modules/audio.js";
import { ROUND_TEAMS } from "../data/rules.js";
import confetti from "canvas-confetti";

export class MatchModal {
  constructor(tournamentState, onMatchUpdated) {
    this.state = tournamentState;
    this.onMatchUpdated = onMatchUpdated;
    this.currentMatchId = null;
    this.modalEl = null;
    this.createDom();
  }

  createDom() {
    let existing = document.getElementById("matchDetailModal");
    if (existing) existing.remove();

    const div = document.createElement("div");
    div.id = "matchDetailModal";
    div.className = "modal-overlay hidden";
    div.innerHTML = `
      <div class="modal-dialog match-modal-dialog">
        <div class="modal-header">
          <div class="modal-badge-group">
            <span class="modal-badge-round" id="modalRoundTitle">Ronda</span>
            <span class="modal-badge-status" id="modalStatusBadge">Estado</span>
          </div>
          <button class="modal-close-btn" id="modalCloseBtn" aria-label="Cerrar">&times;</button>
        </div>

        <div class="modal-body" id="modalBody">
          <!-- Dynamic Content -->
        </div>
      </div>
    `;
    document.body.appendChild(div);
    this.modalEl = div;

    div.querySelector("#modalCloseBtn").addEventListener("click", () => this.close());
    div.addEventListener("click", (e) => {
      if (e.target === div) this.close();
    });
  }

  open(matchId, isAdmin = true) {
    this.currentMatchId = matchId;
    const found = findMatchById(this.state, matchId);
    if (!found) return;

    sound.playClick();
    this.renderMatchDetails(found.match, isAdmin);
    this.modalEl.classList.remove("hidden");
  }

  close() {
    this.modalEl.classList.add("hidden");
    this.currentMatchId = null;
  }

  renderMatchDetails(match, isAdmin) {
    const outcome = computeMatchOutcome(match);
    const p1 = match.player1;
    const p2 = match.player2;

    const p1Name = p1 ? p1.name : "Por Definir";
    const p2Name = p2 ? p2.name : "Por Definir";

    const titleEl = this.modalEl.querySelector("#modalRoundTitle");
    const statusEl = this.modalEl.querySelector("#modalStatusBadge");
    const bodyEl = this.modalEl.querySelector("#modalBody");

    const teamConfig = ROUND_TEAMS[match.round] || {
      teamName: "Equipo Oficial",
      shortName: "PES 6",
      badgeFile: "united.png",
      ruleLabel: "Regla de Ronda"
    };
    const teamLogoSrc = `/${teamConfig.badgeFile}`;

    titleEl.textContent = `${match.roundTitle} • Cruce #${match.matchNumber}`;

    if (outcome.isFinished) {
      statusEl.className = "modal-badge-status finished";
      statusEl.textContent = "Finalizado";
    } else if (match.score1_ida !== null || match.score1_vuelta !== null) {
      statusEl.className = "modal-badge-status live";
      statusEl.textContent = "En Juego";
    } else {
      statusEl.className = "modal-badge-status pending";
      statusEl.textContent = "Pendiente";
    }

    const hasBothPlayers = p1 && p2;

    let html = `
      <!-- Banner del Equipo Fijo de la Ronda -->
      <div class="modal-fixed-team-banner">
        <img src="${teamLogoSrc}" alt="${teamConfig.teamName}" class="modal-team-crest">
        <div>
          <span class="banner-sub">CONFIGURACIÓN OBLIGATORIA DE LA RONDA</span>
          <h4 class="banner-title">${teamConfig.teamName} (${teamConfig.ruleLabel})</h4>
        </div>
      </div>

      <div class="match-duel-header">
        <div class="duel-team ${outcome.winner?.id === p1?.id ? 'winner' : ''}">
          <div class="duel-avatar-wrapper">
            <img src="${teamLogoSrc}" alt="${teamConfig.shortName}" class="duel-crest-img">
          </div>
          <h4>${p1Name}</h4>
          <span class="duel-team-sub">${teamConfig.teamName}</span>
          ${p1?.note ? `<small class="note-warn">⚠️ ${p1.note}</small>` : ''}
          ${outcome.winner?.id === p1?.id ? '<span class="crown">👑 CLASIFICADO</span>' : ''}
        </div>

        <div class="duel-global-box">
          <span class="label">RESULTADO GLOBAL</span>
          <div class="global-score-big">
            <span>${outcome.global1 !== null ? outcome.global1 : '-'}</span>
            <span class="sep">:</span>
            <span>${outcome.global2 !== null ? outcome.global2 : '-'}</span>
          </div>
          <small class="rules-hint">Ida + Vuelta</small>
        </div>

        <div class="duel-team ${outcome.winner?.id === p2?.id ? 'winner' : ''}">
          <div class="duel-avatar-wrapper">
            <img src="${teamLogoSrc}" alt="${teamConfig.shortName}" class="duel-crest-img">
          </div>
          <h4>${p2Name}</h4>
          <span class="duel-team-sub">${teamConfig.teamName}</span>
          ${p2?.note ? `<small class="note-warn">⚠️ ${p2.note}</small>` : ''}
          ${outcome.winner?.id === p2?.id ? '<span class="crown">👑 CLASIFICADO</span>' : ''}
        </div>
      </div>
    `;

    if (!hasBothPlayers) {
      html += `
        <div class="match-notice info">
          <p>⚠️ Este cruce aún no tiene ambos jugadores definidos. Los cruces se completan mediante el sorteo de 16-avos o conforme avancen los ganadores de rondas previas.</p>
        </div>
      `;
    } else {
      // Score Form
      html += `
        <form id="matchScoreForm" class="match-score-form">
          <div class="form-section-title">
            <span>⚽ Partido de IDA</span>
            <small>Primer encuentro (${teamConfig.ruleLabel})</small>
          </div>

          <div class="score-input-row">
            <div class="team-label-side">${p1Name}</div>
            <div class="inputs-pair">
              <input type="number" min="0" max="99" id="score1_ida" class="score-num-input" value="${match.score1_ida !== null ? match.score1_ida : ''}" placeholder="0">
              <span class="vs-dash">-</span>
              <input type="number" min="0" max="99" id="score2_ida" class="score-num-input" value="${match.score2_ida !== null ? match.score2_ida : ''}" placeholder="0">
            </div>
            <div class="team-label-side">${p2Name}</div>
          </div>

          <div class="form-section-title">
            <span>⚽ Partido de VUELTA</span>
            <small>Segundo encuentro (${teamConfig.ruleLabel})</small>
          </div>

          <div class="score-input-row">
            <div class="team-label-side">${p1Name}</div>
            <div class="inputs-pair">
              <input type="number" min="0" max="99" id="score1_vuelta" class="score-num-input" value="${match.score1_vuelta !== null ? match.score1_vuelta : ''}" placeholder="0">
              <span class="vs-dash">-</span>
              <input type="number" min="0" max="99" id="score2_vuelta" class="score-num-input" value="${match.score2_vuelta !== null ? match.score2_vuelta : ''}" placeholder="0">
            </div>
            <div class="team-label-side">${p2Name}</div>
          </div>

          <!-- Sección de Desempate (3er Partido) si hay empate global -->
          <div id="extraMatchSection" class="extra-match-box ${outcome.isTied ? '' : 'hidden'}">
            <div class="extra-header">
              <span class="extra-alert-icon">⚡</span>
              <div>
                <strong>Desempate: Tercer Partido (Tiempo Extra y Penales)</strong>
                <p>Marcador global empatado. Se disputa el 3er partido con <strong>${teamConfig.teamName}</strong>.</p>
              </div>
            </div>

            <div class="score-input-row">
              <div class="team-label-side">${p1Name}</div>
              <div class="inputs-pair">
                <input type="number" min="0" max="99" id="score1_extra" class="score-num-input" value="${match.score1_extra !== null ? match.score1_extra : ''}" placeholder="0">
                <span class="vs-dash">-</span>
                <input type="number" min="0" max="99" id="score2_extra" class="score-num-input" value="${match.score2_extra !== null ? match.score2_extra : ''}" placeholder="0">
              </div>
              <div class="team-label-side">${p2Name}</div>
            </div>

            <div class="penalties-row" id="penaltiesRow">
              <small class="pen-label">¿Empataron el 3er partido? Definición por Penales:</small>
              <div class="inputs-pair">
                <input type="number" min="0" max="99" id="penalties1" class="score-num-input pen" value="${match.penalties1 !== null ? match.penalties1 : ''}" placeholder="Pen P1">
                <span class="vs-dash">-</span>
                <input type="number" min="0" max="99" id="penalties2" class="score-num-input pen" value="${match.penalties2 !== null ? match.penalties2 : ''}" placeholder="Pen P2">
              </div>
            </div>
          </div>

          <!-- Nota Prototipo -->
          <div class="modal-proto-hint">
            <span>🧪</span>
            <small><strong>Modo Prototipo:</strong> Podés cargar marcadores de prueba para simular el avance de llaves en tu sesión.</small>
          </div>

          <!-- Botones de Acción -->
          <div class="modal-form-actions">
            <button type="submit" class="btn btn-primary btn-save-score">
              <span>💾 Guardar Marcador y Avanzar Ganador</span>
            </button>
            <button type="button" id="btnResetMatchScores" class="btn btn-outline-danger">
              <span>Borrar Marcador</span>
            </button>
          </div>
        </form>
      `;
    }

    bodyEl.innerHTML = html;

    if (hasBothPlayers) {
      this.attachFormListeners(match);
    }
  }

  attachFormListeners(match) {
    const form = this.modalEl.querySelector("#matchScoreForm");
    const extraSection = this.modalEl.querySelector("#extraMatchSection");

    const s1_ida = form.querySelector("#score1_ida");
    const s2_ida = form.querySelector("#score2_ida");
    const s1_vuelta = form.querySelector("#score1_vuelta");
    const s2_vuelta = form.querySelector("#score2_vuelta");

    const checkTie = () => {
      const v1 = parseInt(s1_ida.value, 10);
      const v2 = parseInt(s2_ida.value, 10);
      const v3 = parseInt(s1_vuelta.value, 10);
      const v4 = parseInt(s2_vuelta.value, 10);

      if (!isNaN(v1) && !isNaN(v2) && !isNaN(v3) && !isNaN(v4)) {
        const glob1 = v1 + v3;
        const glob2 = v2 + v4;
        if (glob1 === glob2) {
          extraSection.classList.remove("hidden");
        } else {
          extraSection.classList.add("hidden");
        }
      }
    };

    [s1_ida, s2_ida, s1_vuelta, s2_vuelta].forEach(inp => {
      inp.addEventListener("input", checkTie);
    });

    // Guardar formulario
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const parseVal = (input) => {
        const val = input.value.trim();
        return val === "" ? null : parseInt(val, 10);
      };

      const matchData = {
        score1_ida: parseVal(s1_ida),
        score2_ida: parseVal(s2_ida),
        score1_vuelta: parseVal(s1_vuelta),
        score2_vuelta: parseVal(s2_vuelta),
        score1_extra: parseVal(form.querySelector("#score1_extra")),
        score2_extra: parseVal(form.querySelector("#score2_extra")),
        penalties1: parseVal(form.querySelector("#penalties1")),
        penalties2: parseVal(form.querySelector("#penalties2"))
      };

      const success = updateMatchAndPropagate(this.state, match.id, matchData);
      if (success) {
        sound.playGoal();
        const outcome = computeMatchOutcome(match);
        if (outcome.winner) {
          confetti({ particleCount: 60, spread: 55 });
        }
        if (this.onMatchUpdated) this.onMatchUpdated(match.id);
        this.close();
      }
    });

    // Resetear marcador
    const resetBtn = form.querySelector("#btnResetMatchScores");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        if (confirm("¿Deseas reiniciar los resultados de este partido?")) {
          const matchData = {
            score1_ida: null,
            score2_ida: null,
            score1_vuelta: null,
            score2_vuelta: null,
            score1_extra: null,
            score2_extra: null,
            penalties1: null,
            penalties2: null
          };
          updateMatchAndPropagate(this.state, match.id, matchData);
          sound.playClick();
          if (this.onMatchUpdated) this.onMatchUpdated(match.id);
          this.close();
        }
      });
    }
  }
}
