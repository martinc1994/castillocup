import { sound } from "./audio.js";
import { ROUND_TEAMS } from "../data/rules.js";
import confetti from "canvas-confetti";

export class ProdeManager {
  constructor(tournamentState) {
    this.state = tournamentState;
  }

  render(containerEl) {
    if (!containerEl) return;

    const r16Matches = this.state.rounds.r16 || [];
    const isDrawn = this.state.isDrawn && r16Matches[0]?.player1 && r16Matches[0]?.player2;
    const team16 = ROUND_TEAMS.r16;

    let html = `
      <div class="prode-section-wrapper">
        <!-- Hero Prode Banner -->
        <div class="prode-hero-card">
          <div class="prode-badges-row">
            <span class="prode-badge-pill">🔥 PRODE OFICIAL • 16-AVOS DE FINAL</span>
            <span class="prode-proto-tag">🧪 MODO PROTOTIPO</span>
            <span class="prode-free-tag">Inscripción: $0</span>
          </div>
          
          <h2 class="prode-title">Pronóstico de Resultados (16-avos)</h2>
          <p class="prode-subtitle">
            Probá el formulario cargando tu marcador exacto para cada uno de los 16 cruces. 
            Ambos jugadores disputarán sus partidos con <strong>Manchester United</strong> (Ida y Vuelta).
          </p>

          <!-- Aviso de Prototipo -->
          <div class="prode-proto-notice-box">
            <span class="proto-notice-icon">🧪</span>
            <div>
              <strong>Formato oficial del torneo:</strong>
              <p>Este es el formato a usar. Los resultados cargados son únicamente de prueba.</p>
            </div>
          </div>

          <!-- Sistema de Puntos Oficial -->
          <div class="prode-scoring-rules-banner">
            <div class="score-rule-badge exact">
              <span class="pts">🎯 +3 PUNTOS</span>
              <span class="desc">Acierto de Resultado Exacto</span>
            </div>
            <div class="score-rule-badge winner">
              <span class="pts">⚽ +1 PUNTO</span>
              <span class="desc">Acierto de Ganador o Empate</span>
            </div>
            <div class="score-rule-badge prize">
              <span class="pts">🏆 $20.000 ARS</span>
              <span class="desc">Pozo para el Mayor Puntaje</span>
            </div>
          </div>
        </div>
    `;

    if (!isDrawn) {
      html += `
        <div class="prode-waiting-box">
          <div class="waiting-icon">⏳</div>
          <h3>Esperando el Sorteo Definitivo de los 16-avos</h3>
          <p>
            Los cruces de 16-avos aún no han sido definidos en este dispositivo. Realizá tu sorteo único en la pestaña <strong>"Sorteo en Vivo"</strong> para habilitar las llaves y poder completar este formulario de pronósticos.
          </p>
          <button class="btn btn-primary" id="btnGoToDrawFromProde">
            <span>🎲 Ir al Sorteo en Vivo</span>
          </button>
        </div>
      `;
    } else {
      html += `
        <form id="prodeForm" class="prode-form-container">
          <!-- Datos del Participante -->
          <div class="prode-user-info-card">
            <div class="user-card-header">
              <div>
                <h3>Tus Datos de Participante</h3>
                <p>Completá tu nombre y teléfono para identificar tu jugada de prueba (Inscripción: $0).</p>
              </div>
              <button type="button" id="btnProdeQuickFill" class="btn btn-outline btn-sm" title="Rellenar marcadores con goles aleatorios para probar rápido">
                <span>⚡ Autocompletar Marcadores Demo</span>
              </button>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label for="prodeUserName">Tu Nombre / Apodo *</label>
                <input type="text" id="prodeUserName" required placeholder="Ej: Martin, Valen, Mati, etc." class="form-input">
              </div>
              <div class="form-group">
                <label for="prodeUserPhone">WhatsApp / Celular *</label>
                <input type="tel" id="prodeUserPhone" required placeholder="Ej: +54 9 11 1234-5678" class="form-input">
              </div>
              <div class="form-group">
                <label for="prodeUserAlias">Alias o CBU (Para recibir los $20.000)</label>
                <input type="text" id="prodeUserAlias" placeholder="Ej: martin.pes6.mp" class="form-input">
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
            <button type="submit" class="btn btn-gold btn-large">
              <span>🧪 Validar y Probar Pronóstico</span>
            </button>
            <button type="button" id="btnShareWhatsAppProde" class="btn btn-whatsapp btn-large">
              <span>📲 Enviar Pronóstico por WhatsApp</span>
            </button>
          </div>
        </form>
      `;
    }

    // Nota informativa de Prototipo (sin guardado)
    html += `
      <div class="prode-proto-info-banner">
        <div class="proto-info-header">
          <span class="proto-icon">💡</span>
          <div>
            <h4>Modo Prototipo</h4>
            <p>
              Esta plataforma web está pensada para ser compartida con todos los jugadores y testear el diseño, fixture, reglamento y jugabilidad.
              Podés completar el formulario libremente las veces que quieras. No se guardan registros en servidor; para hacer llegar tus pronósticos de prueba podés utilizar el botón de <strong>WhatsApp</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>`;

    containerEl.innerHTML = html;

    // Attach listeners
    const drawBtn = containerEl.querySelector("#btnGoToDrawFromProde");
    if (drawBtn) {
      drawBtn.addEventListener("click", () => {
        document.querySelector('[data-tab-target="draw"]')?.click();
      });
    }

    const form = containerEl.querySelector("#prodeForm");
    if (form) {
      // Progress tracker
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

      // Quick autofill demo button
      const quickBtn = containerEl.querySelector("#btnProdeQuickFill");
      if (quickBtn) {
        quickBtn.addEventListener("click", () => {
          sound.playClick();
          r16Matches.forEach(m => {
            const inp1 = form.querySelector(`#prode_${m.id}_s1`);
            const inp2 = form.querySelector(`#prode_${m.id}_s2`);
            if (inp1 && inp2) {
              // Goles realistas PES 6
              inp1.value = Math.floor(Math.random() * 4);
              inp2.value = Math.floor(Math.random() * 4);
            }
          });
          const nameInput = form.querySelector("#prodeUserName");
          if (nameInput && !nameInput.value) {
            nameInput.value = "Jugador de Prueba";
          }
          const phoneInput = form.querySelector("#prodeUserPhone");
          if (phoneInput && !phoneInput.value) {
            phoneInput.value = "+54 9 11 0000-0000";
          }
          updateProgress();
        });
      }

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleValidateSubmission(form);
      });

      const btnWa = containerEl.querySelector("#btnShareWhatsAppProde");
      if (btnWa) {
        btnWa.addEventListener("click", () => {
          this.handleWhatsAppShare(form);
        });
      }
    }
  }

  collectFormData(form) {
    const name = form.querySelector("#prodeUserName")?.value.trim() || "";
    const phone = form.querySelector("#prodeUserPhone")?.value.trim() || "";
    const alias = form.querySelector("#prodeUserAlias")?.value.trim() || "";

    const predictions = {};
    const r16Matches = this.state.rounds.r16 || [];
    r16Matches.forEach(m => {
      const inp1 = form.querySelector(`#prode_${m.id}_s1`);
      const inp2 = form.querySelector(`#prode_${m.id}_s2`);
      if (inp1 && inp2 && inp1.value !== "" && inp2.value !== "") {
        predictions[m.id] = {
          s1: parseInt(inp1.value, 10),
          s2: parseInt(inp2.value, 10)
        };
      }
    });

    return { name, phone, alias, predictions };
  }

  handleValidateSubmission(form) {
    const data = this.collectFormData(form);
    if (!data.name || !data.phone) {
      alert("Por favor completá tu nombre y número de WhatsApp para validar tu jugada.");
      return;
    }

    const totalMatches = (this.state.rounds.r16 || []).length;
    const completedCount = Object.keys(data.predictions).length;
    if (completedCount < totalMatches) {
      alert(`Te faltan completar algunos partidos (${completedCount} de ${totalMatches}). ¡Pronosticá los 16 cruces para probar la boleta completa!`);
      return;
    }

    sound.playGoal();
    try {
      confetti({ particleCount: 110, spread: 75, origin: { y: 0.6 } });
    } catch {
      //
    }

    this.showProdeValidationModal(data, form);
  }

  showProdeValidationModal(data, form) {
    let existing = document.getElementById("prodeValidationModal");
    if (existing) existing.remove();

    const div = document.createElement("div");
    div.id = "prodeValidationModal";
    div.className = "modal-overlay";
    div.innerHTML = `
      <div class="modal-dialog prode-dialog-modal">
        <div class="modal-header">
          <div class="modal-badge-group">
            <span class="modal-badge-round gold">🧪 PRONÓSTICO VALIDADO</span>
            <span class="modal-badge-status live">Modo Prototipo</span>
          </div>
          <button class="modal-close-btn" id="prodeModalCloseBtn">&times;</button>
        </div>

        <div class="modal-body">
          <div class="prode-modal-celebration">
            <div class="check-icon">🎯</div>
            <h3>¡Boleta de Pronósticos Completa!</h3>
            <p class="user-greeting">Participante: <strong>${data.name}</strong> • 16 Marcadores Globales cargados.</p>
          </div>

          <div class="prode-proto-explanation">
            <div class="proto-tag">MODO PROTOTIPO</div>
            <p>Tus 16 pronósticos fueron completados bajo el formato oficial. Los resultados cargados son de prueba.</p>
          </div>

          <div class="prode-modal-actions">
            <button type="button" id="btnModalShareWhatsApp" class="btn btn-whatsapp btn-large btn-block">
              <span>📲 Compartir Mis Pronósticos por WhatsApp</span>
            </button>
            <button type="button" id="btnModalCloseProde" class="btn btn-outline btn-block">
              <span>Entendido / Cerrar</span>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(div);

    const close = () => {
      sound.playClick();
      div.remove();
    };

    div.querySelector("#prodeModalCloseBtn").addEventListener("click", close);
    div.querySelector("#btnModalCloseProde").addEventListener("click", close);
    div.addEventListener("click", (e) => {
      if (e.target === div) close();
    });

    div.querySelector("#btnModalShareWhatsApp").addEventListener("click", () => {
      close();
      this.handleWhatsAppShare(form);
    });
  }

  handleWhatsAppShare(form) {
    const data = this.collectFormData(form);
    if (!data.name) {
      alert("Completá tu nombre antes de generar el mensaje de WhatsApp.");
      return;
    }

    const r16Matches = this.state.rounds.r16 || [];
    let text = `🏆 *PRODE CASTILLO CUP - PES 6 ONLINE* 🏆%0A`;
    text += `👤 *Participante:* ${encodeURIComponent(data.name)}%0A`;
    if (data.phone) text += `📱 *Contacto:* ${encodeURIComponent(data.phone)}%0A`;
    if (data.alias) text += `💳 *Alias:* ${encodeURIComponent(data.alias)}%0A`;
    text += `🎯 *Premio Oficial:* $20.000 ARS (Exacto: +3 pts | Ganador: +1 pt)%0A`;
    text += `🎁 *Inscripción:* $0 %0A%0A`;
    text += `*MIS PRONÓSTICOS DE RESULTADO (16-AVOS):*%0A`;

    r16Matches.forEach((m, idx) => {
      const pred = data.predictions[m.id];
      const p1 = m.player1?.name || "P1";
      const p2 = m.player2?.name || "P2";
      const scoreStr = pred ? `${pred.s1} - ${pred.s2}` : "Sin cargar";
      text += `Llave ${idx + 1}: ${p1} [ *${scoreStr}* ] ${p2}%0A`;
    });

    text += `%0A🧪 _Jugada enviada desde el prototipo oficial de testeo de la Castillo Cup._`;

    const url = `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
  }
}
