import { saveTournamentState, resetTournament, updateMatchAndPropagate, computeMatchOutcome, unlockDraw, isDrawLocked } from "./storage.js";
import { sound } from "./audio.js";
import confetti from "canvas-confetti";

export class AdminManager {
  constructor(tournamentState, onRefreshNeeded) {
    this.state = tournamentState;
    this.onRefresh = onRefreshNeeded;
    this.modalEl = null;
    this.createDom();
  }

  createDom() {
    let existing = document.getElementById("adminControlModal");
    if (existing) existing.remove();

    const div = document.createElement("div");
    div.id = "adminControlModal";
    div.className = "modal-overlay hidden";
    div.innerHTML = `
      <div class="modal-dialog admin-modal-dialog">
        <div class="modal-header">
          <div class="modal-badge-group">
            <span class="modal-badge-round gold">⚙️ PANEL DE ORGANIZACIÓN</span>
            <span class="modal-badge-status finished">Modo Administrador</span>
          </div>
          <button class="modal-close-btn" id="adminModalCloseBtn">&times;</button>
        </div>

        <div class="modal-body">
          <div class="admin-intro-box">
            <h3>Centro de Control del Torneo "Castillo Cup"</h3>
            <p>Herramientas para la organización: podés simular partidos de prueba, desbloquear el sorteo en tu dispositivo, reiniciar el torneo o copiar los cruces para WhatsApp.</p>
          </div>

          <div class="admin-actions-grid">
            <!-- Acción 1: Desbloquear Sorteo para este dispositivo -->
            <div class="admin-action-card">
              <div class="action-card-header">
                <span class="icon">🔓</span>
                <div>
                  <h4>Desbloquear Sorteo en este Dispositivo</h4>
                  <p>Permite reiniciar y realizar un nuevo sorteo en tu navegador para testear diferentes cruces.</p>
                </div>
              </div>
              <button id="btnUnlockDeviceDraw" class="btn btn-outline btn-block">
                <span>🔓 Desbloquear Sorteo de Prueba</span>
              </button>
            </div>

            <!-- Acción 2: Simulación Demo Completa -->
            <div class="admin-action-card">
              <div class="action-card-header">
                <span class="icon">⚡</span>
                <div>
                  <h4>Simular Torneo Completo (Demo)</h4>
                  <p>Asigna resultados realistas de Ida y Vuelta a todas las fases hasta coronar al Campeón de los $50.000 ARS.</p>
                </div>
              </div>
              <button id="btnSimulateFullTournament" class="btn btn-primary btn-block">
                <span>🚀 Ejecutar Simulación Completa</span>
              </button>
            </div>

            <!-- Acción 3: Reiniciar Torneo a Cero -->
            <div class="admin-action-card danger">
              <div class="action-card-header">
                <span class="icon">🔄</span>
                <div>
                  <h4>Reiniciar Torneo a Estado Cero</h4>
                  <p>Borra todos los marcadores y el sorteo, liberando el bloqueo de este dispositivo para volver a probar desde cero.</p>
                </div>
              </div>
              <button id="btnResetTournamentState" class="btn btn-outline-danger btn-block">
                <span>⚠️ Reiniciar Torneo y Desbloquear</span>
              </button>
            </div>

            <!-- Acción 4: Copiar Fixture para WhatsApp -->
            <div class="admin-action-card">
              <div class="action-card-header">
                <span class="icon">📋</span>
                <div>
                  <h4>Copiar Resumen para WhatsApp</h4>
                  <p>Copia el fixture actual y los resultados al portapapeles con formato listo para grupos.</p>
                </div>
              </div>
              <button id="btnCopyTournamentWhatsApp" class="btn btn-whatsapp btn-block">
                <span>📲 Copiar Texto para WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(div);
    this.modalEl = div;

    div.querySelector("#adminModalCloseBtn").addEventListener("click", () => this.close());
    div.addEventListener("click", (e) => {
      if (e.target === div) this.close();
    });

    this.attachEvents();
  }

  attachEvents() {
    // Desbloquear sorteo
    this.modalEl.querySelector("#btnUnlockDeviceDraw").addEventListener("click", () => {
      unlockDraw();
      sound.playClick();
      alert("🔓 Sorteo desbloqueado para este dispositivo. Ya podés realizar un nuevo sorteo desde la pestaña 'Sorteo en Vivo'.");
      if (this.onRefresh) this.onRefresh();
      this.close();
    });

    // Simular torneo completo
    this.modalEl.querySelector("#btnSimulateFullTournament").addEventListener("click", () => {
      this.simulateFullTournament();
    });

    // Reiniciar
    this.modalEl.querySelector("#btnResetTournamentState").addEventListener("click", () => {
      if (confirm("¿Estás seguro de reiniciar todo el torneo? Se borrarán todos los cruces, resultados y se desbloqueará el sorteo.")) {
        const fresh = resetTournament(true);
        Object.assign(this.state, fresh);
        sound.playClick();
        alert("Torneo reiniciado exitosamente a estado inicial.");
        if (this.onRefresh) this.onRefresh();
        this.close();
      }
    });

    // Copiar WhatsApp
    this.modalEl.querySelector("#btnCopyTournamentWhatsApp").addEventListener("click", () => {
      this.copyTournamentSummary();
    });
  }

  open() {
    sound.playClick();
    this.modalEl.classList.remove("hidden");
  }

  close() {
    this.modalEl.classList.add("hidden");
  }

  // Simulación de prueba para todo el torneo
  simulateFullTournament() {
    // 1. Asegurar sorteo de 16-avos
    if (!this.state.isDrawn || !this.state.rounds.r16[0]?.player1) {
      // Mezclar los 32 jugadores
      const shuffled = [...this.state.players].sort(() => Math.random() - 0.5);
      this.state.rounds.r16.forEach((m, idx) => {
        m.player1 = shuffled[idx * 2];
        m.player2 = shuffled[idx * 2 + 1];
      });
      this.state.isDrawn = true;
      this.state.drawDate = new Date().toISOString();
    }

    // Función auxiliar para generar goles realistas de PES 6
    const randomScore = () => Math.floor(Math.random() * 4); // 0 a 3 goles

    // Simular ronda por ronda secuencialmente
    const roundKeys = ["r16", "r8", "r4", "r2", "r1"];

    roundKeys.forEach(roundKey => {
      const matches = this.state.rounds[roundKey];
      matches.forEach(m => {
        if (!m.player1 || !m.player2) return;

        let s1_ida = randomScore();
        let s2_ida = randomScore();
        let s1_vuelta = randomScore();
        let s2_vuelta = randomScore();

        let s1_ex = null;
        let s2_ex = null;
        let pen1 = null;
        let pen2 = null;

        // Si empatan global, simular 3er partido
        if (s1_ida + s1_vuelta === s2_ida + s2_vuelta) {
          s1_ex = Math.floor(Math.random() * 3) + 1;
          s2_ex = Math.floor(Math.random() * 3);
          if (s1_ex === s2_ex) {
            pen1 = 4;
            pen2 = 3;
          }
        }

        updateMatchAndPropagate(this.state, m.id, {
          score1_ida: s1_ida,
          score2_ida: s2_ida,
          score1_vuelta: s1_vuelta,
          score2_vuelta: s2_vuelta,
          score1_extra: s1_ex,
          score2_extra: s2_ex,
          penalties1: pen1,
          penalties2: pen2
        });
      });
    });

    saveTournamentState(this.state);
    sound.playFanfare();

    try {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 }
      });
    } catch {
      //
    }

    alert(`¡Simulación completada! El nuevo Campeón de la Castillo Cup es ${this.state.champion?.name || 'definido'}. Podés ver todas las llaves avanzadas en el árbol.`);
    if (this.onRefresh) this.onRefresh();
    this.close();
  }

  copyTournamentSummary() {
    let text = `🏰 *CASTILLO CUP - PES 6 ONLINE* 🏆%0A`;
    text += `📅 Lanzamiento: Sábado 31 de Octubre - 11:00 hs%0A`;
    text += `💰 Pozo Campeón: $50.000 ARS | Prode: $20.000 ARS%0A`;
    text += `🎁 Inscripción: $0 (Gratuita)%0A%0A`;

    if (!this.state.isDrawn) {
      text += `⏳ *Estado:* Cruces a la espera del sorteo oficial.%0A`;
      text += `👥 Total de Jugadores inscriptos: 32.%0A`;
    } else {
      text += `⚔️ *CRUCES 16-AVOS (Ida y Vuelta):*%0A`;
      this.state.rounds.r16.forEach((m, idx) => {
        const p1 = m.player1?.name || "TBD";
        const p2 = m.player2?.name || "TBD";
        const outcome = computeMatchOutcome(m);
        let scoreStr = "Pendiente";
        if (outcome.isFinished) {
          scoreStr = `Global ${outcome.global1}-${outcome.global2}`;
        }
        text += `Llave ${idx + 1}: ${p1} vs ${p2} [${scoreStr}]%0A`;
      });
      if (this.state.champion) {
        text += `%0A👑 *CAMPEÓN ACTUAL:* ${this.state.champion.name} ($50.000 ARS)%0A`;
      }
    }

    // Copiar al portapapeles
    const cleanText = decodeURIComponent(text.replace(/%0A/g, "\n"));
    navigator.clipboard.writeText(cleanText).then(() => {
      sound.playClick();
      alert("¡Resumen del torneo copiado al portapapeles! Listo para pegar en WhatsApp.");
    }).catch(() => {
      alert("No se pudo copiar automáticamente. Podés compartir el enlace directamente.");
    });
  }
}
