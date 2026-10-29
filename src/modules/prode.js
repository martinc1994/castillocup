import { sound } from "./audio.js";
import { ROUND_TEAMS } from "../data/rules.js";
import { saveRemoteProdeSubmission, fetchAllProdeSubmissions } from "../services/supabase.js";
import { computeMatchOutcome } from "./storage.js";
import confetti from "canvas-confetti";

const MARTIN_WHATSAPP = "5493816232650";

export class ProdeManager {
  constructor(tournamentState) {
    this.state = tournamentState;
    this.currentView = "form"; // "form" | "leaderboard"
    this.cachedSubmissions = [];
    this.isLoadingLeaderboard = false;
  }

  // Comprobar si el usuario actual ya cargó su jugada en este dispositivo
  getLocalSubmission() {
    try {
      const raw = localStorage.getItem("castillo_cup_my_prode");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  render(containerEl) {
    if (!containerEl) return;

    const r16Matches = this.state.rounds.r16 || [];
    const isDrawn = this.state.isDrawn && r16Matches[0]?.player1 && r16Matches[0]?.player2;
    const localSub = this.getLocalSubmission();

    let html = `
      <div class="prode-section-wrapper">
        <!-- Hero Prode Banner -->
        <div class="prode-hero-card">
          <div class="prode-badges-row">
            <span class="prode-badge-pill">🔥 PRODE OFICIAL • CASTILLO CUP 2026</span>
            <span class="prode-official-tag">🏆 Pozo: $20.000 ARS</span>
            <span class="prode-free-tag">Inscripción: $0</span>
          </div>
          
          <h2 class="prode-title">Pronóstico de Resultados (16-avos de Final)</h2>
          <p class="prode-subtitle">
            Cargá tu marcador exacto para cada uno de los 16 cruces. 
            Ambos jugadores disputarán sus partidos con <strong>Manchester United</strong> (Ida y Vuelta).
          </p>

          <!-- Sistema de Puntos Oficial -->
          <div class="prode-scoring-rules-banner">
            <div class="score-rule-badge exact">
              <span class="pts">🎯 +3 PUNTOS</span>
              <span class="desc">Acierto Marcador Exacto Global</span>
            </div>
            <div class="score-rule-badge winner">
              <span class="pts">⚽ +1 PUNTO</span>
              <span class="desc">Acierto Ganador o Empate</span>
            </div>
            <div class="score-rule-badge prize">
              <span class="pts">🏆 $20.000 ARS</span>
              <span class="desc">Premio en Efectivo al Mayor Puntaje</span>
            </div>
          </div>

          <!-- Selector de Vista: Pronóstico vs Tabla de Posiciones -->
          <div class="prode-view-toggle-bar">
            <button type="button" class="prode-tab-btn ${this.currentView === 'form' ? 'active' : ''}" id="btnTabProdeForm">
              <span>📝 ${localSub ? 'Mi Pronóstico Registrado' : 'Cargar Pronóstico'}</span>
            </button>
            <button type="button" class="prode-tab-btn ${this.currentView === 'leaderboard' ? 'active' : ''}" id="btnTabProdeLeaderboard">
              <span>🏆 Tabla de Posiciones en Vivo</span>
            </button>
          </div>
        </div>
    `;

    if (this.currentView === "leaderboard") {
      html += `
        <div id="prodeLeaderboardContainer" class="prode-leaderboard-container">
          <div class="leaderboard-loading">
            <span class="live-pulse"></span>
            <p>Cargando posiciones en tiempo real...</p>
          </div>
        </div>
      `;
    } else if (!isDrawn) {
      html += `
        <div class="prode-waiting-box">
          <div class="waiting-icon">⏳</div>
          <h3>Esperando el Sorteo Oficial de los 16-avos</h3>
          <p>
            Los cruces de 16-avos aún no han sido definidos por la organización. Apenas se realice el sorteo oficial, se habilitará el formulario de pronósticos para todos los participantes.
          </p>
        </div>
      `;
    } else if (localSub) {
      // Calcular rendimiento y puntos acumulados del usuario
      let totalEarnedPts = 0;
      let exactHits = 0;
      let outcomeHits = 0;
      let finishedMatchesCount = 0;

      r16Matches.forEach(m => {
        const outcome = computeMatchOutcome(m);
        if (outcome.isFinished) {
          finishedMatchesCount++;
          const pred = localSub.predictions ? localSub.predictions[m.id] : null;
          if (pred && pred.s1 !== null && pred.s2 !== null) {
            if (pred.s1 === outcome.global1 && pred.s2 === outcome.global2) {
              totalEarnedPts += 3;
              exactHits++;
            } else if (Math.sign(pred.s1 - pred.s2) === Math.sign(outcome.global1 - outcome.global2)) {
              totalEarnedPts += 1;
              outcomeHits++;
            }
          }
        }
      });

      // El usuario ya tiene su pronóstico registrado
      html += `
        <div class="prode-already-registered-card">
          <div class="reg-card-header">
            <div class="reg-status-pill">
              <span class="live-pulse"></span>
              <span>✅ Tu Pronóstico Oficial está Registrado</span>
            </div>
            <button type="button" class="btn btn-whatsapp btn-sm" id="btnResendWhatsApp">
              <span>📲 Reenviar a Martín (+54 9 381 623-2650)</span>
            </button>
          </div>

          <div class="reg-user-info-row">
            <div>
              <span class="info-lbl">Participante:</span>
              <strong class="info-val">${localSub.name}</strong>
            </div>
            <div>
              <span class="info-lbl">WhatsApp:</span>
              <strong class="info-val">+${localSub.phone}</strong>
            </div>
          </div>

          <!-- Barra de Rendimiento y Puntos en Vivo -->
          <div class="prode-user-score-dashboard">
            <div class="user-score-tile main">
              <span class="score-tile-label">Tus Puntos Acumulados</span>
              <span class="score-tile-value gold">${totalEarnedPts} <small>pts</small></span>
            </div>
            <div class="user-score-tile">
              <span class="score-tile-label">🎯 Plenos (+3)</span>
              <span class="score-tile-value">${exactHits}</span>
            </div>
            <div class="user-score-tile">
              <span class="score-tile-label">⚽ Aciertos (+1)</span>
              <span class="score-tile-value">${outcomeHits}</span>
            </div>
            <div class="user-score-tile">
              <span class="score-tile-label">🏁 Cruces Disputados</span>
              <span class="score-tile-value">${finishedMatchesCount} / 16</span>
            </div>
          </div>

          <div class="reg-matches-summary">
            <div class="reg-matches-header-wrap">
              <h4>Seguimiento en Vivo: Tus 16 Pronósticos vs. Resultados Reales</h4>
              <small>Los puntos se actualizan automáticamente cuando el organizador carga los resultados.</small>
            </div>
            <div class="reg-matches-cards-grid">
      `;

      r16Matches.forEach((m, idx) => {
        const pred = localSub.predictions ? localSub.predictions[m.id] : null;
        const outcome = computeMatchOutcome(m);
        const p1Name = m.player1?.name || "Por Definir";
        const p2Name = m.player2?.name || "Por Definir";
        const hasIda = m.score1_ida !== null && m.score2_ida !== null && m.score1_ida !== "" && m.score2_ida !== "";

        let statusClass = "pending";
        let evalBadge = "⏳ Por Jugar";
        let ptsText = "+0 pts (Por Jugar)";
        let realScoreText = "Pendiente de disputa";

        if (outcome.isFinished) {
          realScoreText = `Global: ${outcome.global1} - ${outcome.global2} (Ida: ${m.score1_ida}-${m.score2_ida} • Vuelta: ${m.score1_vuelta}-${m.score2_vuelta})`;
          if (pred && pred.s1 !== null && pred.s2 !== null) {
            if (pred.s1 === outcome.global1 && pred.s2 === outcome.global2) {
              statusClass = "exact";
              evalBadge = "🎯 ¡PLENO EXACTO! (+3)";
              ptsText = "+3 Puntos Ganados";
            } else if (Math.sign(pred.s1 - pred.s2) === Math.sign(outcome.global1 - outcome.global2)) {
              statusClass = "winner";
              evalBadge = "⚽ Acierto Ganador (+1)";
              ptsText = "+1 Punto Ganado";
            } else {
              statusClass = "miss";
              evalBadge = "❌ Sin Acierto (0)";
              ptsText = "0 Puntos";
            }
          } else {
            statusClass = "miss";
            evalBadge = "⚠️ Sin Pronóstico";
            ptsText = "0 Puntos";
          }
        } else if (hasIda) {
          statusClass = "live";
          evalBadge = "⚡ En Juego (Ida disputada)";
          realScoreText = `Parcial Ida: ${m.score1_ida} - ${m.score2_ida} (Falta Vuelta)`;
          ptsText = "Pendiente de Vuelta";
        }

        html += `
          <div class="prode-eval-match-card ${statusClass}">
            <div class="eval-card-header">
              <span class="eval-match-num">Llave #${idx + 1}</span>
              <span class="eval-status-tag ${statusClass}">${evalBadge}</span>
            </div>

            <div class="eval-card-teams">
              <span class="eval-team-p1" title="${p1Name}">${p1Name}</span>
              <span class="eval-team-vs">vs</span>
              <span class="eval-team-p2" title="${p2Name}">${p2Name}</span>
            </div>

            <div class="eval-scores-box">
              <div class="eval-score-row pred">
                <span class="eval-label">Tu Pronóstico:</span>
                <span class="eval-val">${pred ? `[ ${pred.s1} - ${pred.s2} ]` : 'Sin cargar'}</span>
              </div>
              <div class="eval-score-row real">
                <span class="eval-label">Resultado Real:</span>
                <span class="eval-val ${outcome.isFinished ? 'finished' : 'pending'}">${realScoreText}</span>
              </div>
            </div>

            <div class="eval-card-footer">
              <span class="eval-pts-pill ${statusClass}">${ptsText}</span>
            </div>
          </div>
        `;
      });

      html += `
            </div>
          </div>

          <div class="reg-footer-note">
            <p>🛡️ Tu jugada quedó registrada. Para evitar duplicaciones, cada número de WhatsApp tiene una única jugada oficial.</p>
          </div>
        </div>
      `;
    } else {
      // Formulario de inscripción y carga
      html += `
        <form id="prodeForm" class="prode-form-container">
          <!-- Datos del Participante -->
          <div class="prode-user-info-card">
            <div class="user-card-header">
              <div>
                <h3>Tus Datos de Participante</h3>
                <p>Ingresá tu nombre y celular para identificar tus pronósticos y poder reclamar el premio de $20.000 ARS.</p>
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label for="prodeUserName">Nombre / Apodo *</label>
                <input type="text" id="prodeUserName" required placeholder="Ej: Martin, Valen, Mati, etc." class="form-input">
              </div>
              <div class="form-group">
                <label for="prodeUserPhone">WhatsApp / Celular (Sin 0 ni 15) *</label>
                <input type="tel" id="prodeUserPhone" required placeholder="Ej: 3816232650 o 1155443322" class="form-input">
              </div>
            </div>
          </div>

          <!-- Pronósticos de los 16 partidos con marcadores exactos -->
          <div class="prode-matches-grid">
            <div class="prode-grid-header">
              <div class="header-left">
                <h3 class="prode-matches-title">Pronosticá los Marcadores Globales (16 Llaves):</h3>
                <span class="prode-progress-badge" id="prodeProgressBadge">0 / 16 cruces completados</span>
              </div>
              <div class="round-fixed-team-chip">
                <span>🔴 Todos United • Ida y Vuelta</span>
              </div>
            </div>
      `;

      r16Matches.forEach((m, idx) => {
        const p1Name = m.player1?.name || "Jugador 1";
        const p2Name = m.player2?.name || "Jugador 2";

        html += `
          <div class="prode-match-score-card" data-prode-match="${m.id}">
            <div class="prode-match-card-top">
              <span class="prode-match-num">Llave #${idx + 1}</span>
              <span class="prode-match-sub">Ida y Vuelta Global</span>
            </div>

            <div class="prode-inputs-row">
              <div class="prode-team-col left">
                <span class="player-dot active"></span>
                <span class="prode-player-name" title="${p1Name}">${p1Name}</span>
              </div>

              <div class="prode-score-inputs-pair">
                <input type="number" min="0" max="99" required class="prode-score-field" 
                       id="prode_${m.id}_s1" name="prode_${m.id}_s1" placeholder="0">
                <span class="prode-dash">-</span>
                <input type="number" min="0" max="99" required class="prode-score-field" 
                       id="prode_${m.id}_s2" name="prode_${m.id}_s2" placeholder="0">
              </div>

              <div class="prode-team-col right">
                <span class="prode-player-name" title="${p2Name}">${p2Name}</span>
                <span class="player-dot active"></span>
              </div>
            </div>
          </div>
        `;
      });

      html += `
          </div>

          <!-- Barra de Acciones -->
          <div class="prode-actions-bar">
            <button type="submit" class="btn btn-gold btn-large" id="btnSubmitOfficialProde">
              <span>💾 Enviar Pronóstico Oficial y Confirmar por WhatsApp</span>
            </button>
          </div>
        </form>
      `;
    }

    html += `</div>`;

    containerEl.innerHTML = html;

    // Listeners de alternar vista
    containerEl.querySelector("#btnTabProdeForm")?.addEventListener("click", () => {
      this.currentView = "form";
      sound.playClick();
      this.render(containerEl);
    });

    containerEl.querySelector("#btnTabProdeLeaderboard")?.addEventListener("click", () => {
      this.currentView = "leaderboard";
      sound.playClick();
      this.render(containerEl);
      this.loadAndRenderLeaderboard(containerEl);
    });

    // Listener para reenviar WhatsApp
    containerEl.querySelector("#btnResendWhatsApp")?.addEventListener("click", () => {
      if (localSub) {
        this.openWhatsAppConfirmation(localSub.name, localSub.phone, localSub.predictions);
      }
    });

    // Listeners del Formulario
    const form = containerEl.querySelector("#prodeForm");
    if (form) {
      const updateProgress = () => {
        const data = this.collectFormData(form);
        const count = Object.keys(data.predictions).length;
        const total = r16Matches.length;
        const badge = containerEl.querySelector("#prodeProgressBadge");
        if (badge) {
          badge.textContent = `${count} / ${total} cruces completados`;
          if (count === total) {
            badge.classList.add("completed");
          } else {
            badge.classList.remove("completed");
          }
        }
      };

      form.querySelectorAll(".prode-score-field").forEach(inp => {
        inp.addEventListener("input", updateProgress);
      });

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleSubmitOfficial(form, containerEl);
      });
    }

    if (this.currentView === "leaderboard") {
      this.loadAndRenderLeaderboard(containerEl);
    }
  }

  // Carga y renderizado de la tabla de posiciones
  async loadAndRenderLeaderboard(containerEl) {
    const lbContainer = containerEl.querySelector("#prodeLeaderboardContainer");
    if (!lbContainer) return;

    const submissions = await fetchAllProdeSubmissions();
    const r16Matches = this.state.rounds?.r16 || [];

    // Calcular puntos para cada participante
    const rankedPlayers = submissions.map(sub => {
      let totalPts = 0;
      let exactHits = 0;
      let outcomeHits = 0;

      r16Matches.forEach(m => {
        // Verificar si el cruce terminó
        const s1_ida = m.score1_ida;
        const s2_ida = m.score2_ida;
        const s1_vta = m.score1_vuelta;
        const s2_vta = m.score2_vuelta;

        if (s1_ida !== null && s2_ida !== null && s1_vta !== null && s2_vta !== null) {
          const realGlob1 = s1_ida + s1_vta;
          const realGlob2 = s2_ida + s2_vta;

          const pred = sub.predictions ? sub.predictions[m.id] : null;
          if (pred && pred.s1 !== null && pred.s2 !== null) {
            // Acierto exacto: +3 pts
            if (pred.s1 === realGlob1 && pred.s2 === realGlob2) {
              totalPts += 3;
              exactHits++;
            } else {
              // Acierto ganador o empate: +1 pt
              const realSign = Math.sign(realGlob1 - realGlob2);
              const predSign = Math.sign(pred.s1 - pred.s2);
              if (realSign === predSign) {
                totalPts += 1;
                outcomeHits++;
              }
            }
          }
        }
      });

      return {
        id: sub.id,
        name: sub.user_name,
        phone: sub.user_phone,
        totalPts,
        exactHits,
        outcomeHits
      };
    });

    // Ordenar por puntos (descendente), luego por exactos, luego por nombre
    rankedPlayers.sort((a, b) => {
      if (b.totalPts !== a.totalPts) return b.totalPts - a.totalPts;
      if (b.exactHits !== a.exactHits) return b.exactHits - a.exactHits;
      return a.name.localeCompare(b.name);
    });

    if (rankedPlayers.length === 0) {
      lbContainer.innerHTML = `
        <div class="prode-leaderboard-empty">
          <div class="empty-icon">🎯</div>
          <h3>Aún no hay participantes en la tabla</h3>
          <p>Completá tu pronóstico en la pestaña anterior para ser el primero en aparecer.</p>
        </div>
      `;
      return;
    }

    let lbHtml = `
      <div class="leaderboard-header-row">
        <h3>Tabla Oficial de Pronósticos (${rankedPlayers.length} Participantes)</h3>
        <span class="prize-reminder-pill">Pozo al 1° Puesto: $20.000 ARS</span>
      </div>

      <div class="prode-leaderboard-table-card">
        <table class="leaderboard-table">
          <thead>
            <tr>
              <th class="th-pos">Pos.</th>
              <th class="th-name">Participante</th>
              <th class="th-exact">Plenos (+3)</th>
              <th class="th-winner">Aciertos (+1)</th>
              <th class="th-pts">Puntos</th>
            </tr>
          </thead>
          <tbody>
    `;

    rankedPlayers.forEach((p, idx) => {
      const pos = idx + 1;
      let posBadge = `${pos}°`;
      if (pos === 1) posBadge = "🥇 1°";
      else if (pos === 2) posBadge = "🥈 2°";
      else if (pos === 3) posBadge = "🥉 3°";

      lbHtml += `
        <tr class="${pos === 1 ? 'top-leader-row' : ''}">
          <td class="td-pos"><span class="pos-badge pos-${pos}">${posBadge}</span></td>
          <td class="td-name"><strong>${p.name}</strong></td>
          <td class="td-exact">${p.exactHits}</td>
          <td class="td-winner">${p.outcomeHits}</td>
          <td class="td-pts"><span class="pts-number">${p.totalPts}</span> <small>pts</small></td>
        </tr>
      `;
    });

    lbHtml += `
          </tbody>
        </table>
      </div>
    `;

    lbContainer.innerHTML = lbHtml;
  }

  collectFormData(form) {
    const name = form.querySelector("#prodeUserName")?.value.trim() || "";
    const phone = form.querySelector("#prodeUserPhone")?.value.trim() || "";

    const predictions = {};
    form.querySelectorAll(".prode-match-score-card").forEach(card => {
      const matchId = card.getAttribute("data-prode-match");
      const inp1 = card.querySelector(`input[name="prode_${matchId}_s1"]`);
      const inp2 = card.querySelector(`input[name="prode_${matchId}_s2"]`);

      if (inp1 && inp2 && inp1.value !== "" && inp2.value !== "") {
        predictions[matchId] = {
          s1: parseInt(inp1.value, 10),
          s2: parseInt(inp2.value, 10)
        };
      }
    });

    return { name, phone, predictions };
  }

  async handleSubmitOfficial(form, containerEl) {
    const data = this.collectFormData(form);
    const r16Matches = this.state.rounds.r16 || [];

    if (!data.name) {
      alert("Por favor, ingresá tu nombre o apodo.");
      return;
    }
    if (!data.phone || data.phone.length < 8) {
      alert("Por favor, ingresá un número de WhatsApp válido.");
      return;
    }

    if (Object.keys(data.predictions).length < r16Matches.length) {
      alert(`Completá los pronósticos de los ${r16Matches.length} partidos de 16-avos antes de enviar.`);
      return;
    }

    const submitBtn = form.querySelector("#btnSubmitOfficialProde");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>⏳ Registrando tu jugada...</span>`;
    }

    const res = await saveRemoteProdeSubmission(data);

    if (!res.success) {
      sound.playMiss();
      alert(`⚠️ ${res.error || "No se pudo registrar la jugada."}`);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>💾 Enviar Pronóstico Oficial y Confirmar por WhatsApp</span>`;
      }
      return;
    }

    sound.playGoal();
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

    // Abrir WhatsApp con Martín (+54 9 381 623-2650)
    this.openWhatsAppConfirmation(data.name, data.phone, data.predictions);

    alert(`¡Felicitaciones ${data.name}! Tu jugada oficial ha sido registrada con éxito. Ahora se abrirá WhatsApp para que le envíes la confirmación a Martín.`);

    // Re-renderizar la vista
    this.render(containerEl);
  }

  openWhatsAppConfirmation(name, phone, predictions) {
    const r16Matches = this.state.rounds.r16 || [];
    const lines = [
      "🏆 *CONFIRMACIÓN PRODE - CASTILLO CUP (PES 6)* 🏆",
      `👤 *Participante:* ${name}`,
      `📱 *WhatsApp:* ${phone}`,
      "🎯 *Premio en juego:* $20.000 ARS",
      "",
      "*MIS 16 PRONÓSTICOS OFICIALES:*",
    ];

    r16Matches.forEach((m, idx) => {
      const pred = predictions ? predictions[m.id] : null;
      const p1 = m.player1?.name || "P1";
      const p2 = m.player2?.name || "P2";
      const scoreStr = pred ? `${pred.s1} - ${pred.s2}` : "0 - 0";
      lines.push(`Llave #${idx + 1}: ${p1} [ *${scoreStr}* ] ${p2}`);
    });

    lines.push("");
    lines.push("🔒 _Jugada registrada en la plataforma web oficial de la Castillo Cup._");

    const fullMessage = lines.join("\n");
    const url = `https://wa.me/${MARTIN_WHATSAPP}?text=${encodeURIComponent(fullMessage)}`;
    window.open(url, "_blank");
  }
}
