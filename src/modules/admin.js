import { saveTournamentState, resetTournament, updateMatchAndPropagate, computeMatchOutcome, unlockDraw } from "./storage.js";
import { sound } from "./audio.js";
import { saveRemoteTournamentState, fetchRemoteTournamentState, fetchAllProdeSubmissions, DEFAULT_ADMIN_PIN, isSupabaseConfigured } from "../services/supabase.js";
import confetti from "canvas-confetti";

export function isAdminAuthenticated() {
  try {
    return sessionStorage.getItem("castillo_admin_auth") === "true";
  } catch {
    return false;
  }
}

export function setAdminAuthenticated(val) {
  try {
    if (val) {
      sessionStorage.setItem("castillo_admin_auth", "true");
    } else {
      sessionStorage.removeItem("castillo_admin_auth");
    }
  } catch (e) {
    //
  }
}

export class AdminManager {
  constructor(tournamentState, onRefreshNeeded) {
    this.state = tournamentState;
    this.onRefresh = onRefreshNeeded;
    this.modalEl = null;
    this.loginModalEl = null;
    this.createDom();
    this.createLoginDom();
  }

  createLoginDom() {
    let existing = document.getElementById("adminLoginModal");
    if (existing) existing.remove();

    const div = document.createElement("div");
    div.id = "adminLoginModal";
    div.className = "modal-overlay hidden";
    div.innerHTML = `
      <div class="modal-dialog admin-login-dialog">
        <div class="modal-header">
          <div class="modal-badge-group">
            <span class="modal-badge-round gold">🔒 ACCESO RESTRINGIDO</span>
            <span class="modal-badge-status live">Organización</span>
          </div>
          <button class="modal-close-btn" id="adminLoginCloseBtn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="admin-login-box">
            <div class="login-icon">🛡️</div>
            <h3>Panel de Control Oficial</h3>
            <p>Ingresá la clave de organizador para administrar resultados del fixture, sorteo oficial y sincronización con Supabase.</p>
            <form id="adminLoginForm" class="admin-login-form">
              <div class="form-group">
                <label for="adminPinInput">PIN / Clave de Administrador:</label>
                <input type="password" id="adminPinInput" class="form-input" placeholder="Ingresá tu PIN..." required autocomplete="current-password">
              </div>
              <div id="adminLoginError" class="login-error-msg hidden">⚠️ PIN incorrecto. Verificá con el organizador.</div>
              <button type="submit" class="btn btn-gold btn-block">
                <span>🔓 Desbloquear Panel de Control</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(div);
    this.loginModalEl = div;

    div.querySelector("#adminLoginCloseBtn").addEventListener("click", () => this.closeLogin());
    div.addEventListener("click", (e) => {
      if (e.target === div) this.closeLogin();
    });

    const form = div.querySelector("#adminLoginForm");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const pin = div.querySelector("#adminPinInput").value.trim();
      const errorEl = div.querySelector("#adminLoginError");

      if (pin === DEFAULT_ADMIN_PIN) {
        sound.playGoal();
        setAdminAuthenticated(true);
        errorEl.classList.add("hidden");
        div.querySelector("#adminPinInput").value = "";
        this.closeLogin();
        this.open();
        if (this.onRefresh) this.onRefresh();
      } else {
        sound.playMiss();
        errorEl.classList.remove("hidden");
      }
    });
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
            <h3>Centro de Control - Castillo Cup (PES 6)</h3>
            <p>Panel exclusivo de organización. Solo vos podés publicar resultados en la nube, sincronizar las llaves del torneo y auditar las jugadas del Prode.</p>
            <div class="cloud-status-pill ${isSupabaseConfigured() ? 'connected' : 'warning'}">
              <span>${isSupabaseConfigured() ? '☁️ Supabase Conectado' : '⚠️ Supabase Pendiente de Configuración (.env)'}</span>
            </div>
          </div>

          <div class="admin-actions-grid">
            <!-- Acción 1: Publicar a la Nube (Supabase) -->
            <div class="admin-action-card highlight">
              <div class="action-card-header">
                <span class="icon">☁️</span>
                <div>
                  <h4>Publicar Torneo a la Nube (Supabase)</h4>
                  <p>Guarda el estado actual del fixture y los cruces para que todos los jugadores lo vean en vivo.</p>
                </div>
              </div>
              <button id="btnPublishToCloud" class="btn btn-gold btn-block">
                <span>🚀 Sincronizar y Publicar en Supabase</span>
              </button>
            </div>

            <!-- Acción 2: Cargar de la Nube -->
            <div class="admin-action-card">
              <div class="action-card-header">
                <span class="icon">📥</span>
                <div>
                  <h4>Cargar Torneo desde Supabase</h4>
                  <p>Descarga la última versión oficial guardada en la base de datos de la nube.</p>
                </div>
              </div>
              <button id="btnFetchFromCloud" class="btn btn-outline btn-block">
                <span>📥 Descargar Último Estado de la Nube</span>
              </button>
            </div>

            <!-- Acción 3: Auditar Jugadas del Prode -->
            <div class="admin-action-card">
              <div class="action-card-header">
                <span class="icon">📊</span>
                <div>
                  <h4>Auditar Pronósticos del Prode</h4>
                  <p>Consulta cuántos jugadores cargaron sus pronósticos oficiales en Supabase.</p>
                </div>
              </div>
              <button id="btnViewProdeSubmissions" class="btn btn-primary btn-block">
                <span>👥 Ver Jugadas Registradas</span>
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

            <!-- Acción 5: Desbloquear Sorteo -->
            <div class="admin-action-card">
              <div class="action-card-header">
                <span class="icon">🔓</span>
                <div>
                  <h4>Desbloquear Sorteo</h4>
                  <p>Habilita volver a mezclar o reiniciar el bolillero oficial si hiciera falta.</p>
                </div>
              </div>
              <button id="btnUnlockDeviceDraw" class="btn btn-outline btn-block">
                <span>🔓 Desbloquear Bolillero</span>
              </button>
            </div>

            <!-- Acción 6: Cerrar Sesión Admin -->
            <div class="admin-action-card danger">
              <div class="action-card-header">
                <span class="icon">🚪</span>
                <div>
                  <h4>Cerrar Sesión de Administrador</h4>
                  <p>Bloquea de nuevo el panel y las vistas de edición en este navegador.</p>
                </div>
              </div>
              <button id="btnLogoutAdmin" class="btn btn-outline-danger btn-block">
                <span>🔒 Salir del Modo Admin</span>
              </button>
            </div>
          </div>

          <!-- Contenedor dinámico de submissions de prode -->
          <div id="adminProdeListContainer" class="admin-prode-list hidden">
            <!-- Injected prode list -->
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
    // Publicar a Supabase
    this.modalEl.querySelector("#btnPublishToCloud").addEventListener("click", async () => {
      sound.playClick();
      const btn = this.modalEl.querySelector("#btnPublishToCloud");
      btn.disabled = true;
      btn.textContent = "Subiendo...";

      const res = await saveRemoteTournamentState(this.state);
      btn.disabled = false;
      btn.innerHTML = `<span>🚀 Sincronizar y Publicar en Supabase</span>`;

      if (res.success) {
        sound.playGoal();
        confetti({ particleCount: 70, spread: 60 });
        alert("✅ ¡Torneo publicado exitosamente en Supabase! Ahora cualquier jugador que ingrese verá el fixture actualizado.");
      } else {
        sound.playMiss();
        alert(`⚠️ No se pudo publicar: ${res.error}\n\nRevisá que las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY estén cargadas en tu archivo .env.`);
      }
    });

    // Descargar de Supabase
    this.modalEl.querySelector("#btnFetchFromCloud").addEventListener("click", async () => {
      sound.playClick();
      const remote = await fetchRemoteTournamentState();
      if (remote) {
        Object.assign(this.state, remote);
        saveTournamentState(this.state);
        alert("✅ Fixture sincronizado con la última versión de la nube.");
        if (this.onRefresh) this.onRefresh();
        this.close();
      } else {
        alert("ℹ️ No se encontró un estado previo guardado en Supabase o aún no está configurado.");
      }
    });

    // Ver Pronósticos del Prode
    this.modalEl.querySelector("#btnViewProdeSubmissions").addEventListener("click", async () => {
      sound.playClick();
      const container = this.modalEl.querySelector("#adminProdeListContainer");
      container.classList.remove("hidden");
      container.innerHTML = "<p>Cargando pronósticos desde Supabase...</p>";

      const submissions = await fetchAllProdeSubmissions();
      if (submissions.length === 0) {
        container.innerHTML = `
          <div class="prode-admin-empty">
            <p>Aún no hay pronósticos oficiales registrados en Supabase.</p>
          </div>
        `;
        return;
      }

      let html = `
        <div class="prode-admin-header">
          <h4>Jugadas Registradas (${submissions.length} Participantes)</h4>
          <button type="button" class="btn btn-outline btn-sm" id="btnCloseProdeAudit">Cerrar Lista</button>
        </div>
        <div class="prode-admin-table-wrap">
          <table class="prode-admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>WhatsApp</th>
                <th>Fecha</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
      `;

      submissions.forEach((s, idx) => {
        const dateStr = s.created_at ? new Date(s.created_at).toLocaleString("es-AR") : "Reciente";
        html += `
          <tr>
            <td><strong>#${idx + 1}</strong></td>
            <td><strong>${s.user_name}</strong></td>
            <td><a href="https://wa.me/${s.user_phone}" target="_blank" class="phone-link">+${s.user_phone}</a></td>
            <td><small>${dateStr}</small></td>
            <td>
              <button class="btn btn-outline btn-xs btn-view-pred" data-index="${idx}">Ver 16 Pronósticos</button>
            </td>
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
        </div>
      `;

      container.innerHTML = html;

      container.querySelector("#btnCloseProdeAudit")?.addEventListener("click", () => {
        container.classList.add("hidden");
      });

      container.querySelectorAll(".btn-view-pred").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const idx = parseInt(e.currentTarget.getAttribute("data-index"), 10);
          const sub = submissions[idx];
          if (!sub) return;

          let summary = `📋 PRONÓSTICOS DE ${sub.user_name} (+${sub.user_phone}):\n\n`;
          const r16 = this.state.rounds?.r16 || [];
          r16.forEach((m, mIdx) => {
            const pred = sub.predictions[m.id];
            const p1 = m.player1?.name || "P1";
            const p2 = m.player2?.name || "P2";
            const score = pred ? `${pred.s1} - ${pred.s2}` : "Sin cargar";
            summary += `Llave ${mIdx + 1}: ${p1} [ ${score} ] ${p2}\n`;
          });
          alert(summary);
        });
      });
    });

    // Desbloquear / Reiniciar sorteo oficial
    this.modalEl.querySelector("#btnUnlockDeviceDraw").addEventListener("click", async () => {
      if (confirm("¿Deseas reiniciar el sorteo oficial? Se vaciarán las 16 llaves del fixture y podrás volver a realizar el bolillero.")) {
        sound.playClick();
        unlockDraw();
        this.state.isDrawn = false;
        this.state.drawDate = null;
        Object.keys(this.state.rounds).forEach(roundKey => {
          this.state.rounds[roundKey].forEach(m => {
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
        this.state.champion = null;
        saveTournamentState(this.state);
        if (isSupabaseConfigured()) {
          await saveRemoteTournamentState(this.state);
        }
        alert("🔓 Sorteo oficial reiniciado. Podés realizar el sorteo nuevamente desde la pestaña 'Sorteo en Vivo'.");
        if (this.onRefresh) this.onRefresh();
        this.close();
      }
    });

    // Copiar resumen WhatsApp
    this.modalEl.querySelector("#btnCopyTournamentWhatsApp").addEventListener("click", () => {
      this.copyTournamentSummary();
    });

    // Cerrar sesión
    this.modalEl.querySelector("#btnLogoutAdmin").addEventListener("click", () => {
      setAdminAuthenticated(false);
      sound.playClick();
      alert("🔒 Sesión de administrador cerrada.");
      if (this.onRefresh) this.onRefresh();
      this.close();
    });
  }

  copyTournamentSummary() {
    const lines = [
      "🏰 *CASTILLO CUP - PES 6 ONLINE* 🏆",
      "📅 Lanzamiento: Viernes 30 de Octubre - 22:00 hs",
      "💰 Pozo Campeón: $50.000 ARS | Prode: $20.000 ARS",
      "🎁 Inscripción: $0 (Gratuita)",
      ""
    ];

    if (!this.state.isDrawn) {
      lines.push("⏳ *Estado:* Cruces a la espera del sorteo oficial.");
      lines.push("👥 Total de Jugadores inscriptos: 32.");
    } else {
      lines.push("⚔️ *CRUCES 16-AVOS (Ida y Vuelta):*");
      this.state.rounds.r16.forEach((m, idx) => {
        const p1 = m.player1?.name || "TBD";
        const p2 = m.player2?.name || "TBD";
        const outcome = computeMatchOutcome(m);
        let scoreStr = "Pendiente";
        if (outcome.isFinished) {
          scoreStr = `Global ${outcome.global1}-${outcome.global2}`;
        }
        lines.push(`Llave #${idx + 1}: ${p1} vs ${p2} [${scoreStr}]`);
      });
      if (this.state.champion) {
        lines.push("");
        lines.push(`👑 *CAMPEÓN ACTUAL:* ${this.state.champion.name} ($50.000 ARS)`);
      }
    }

    const shareUrl = `https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(shareUrl, "_blank");
  }

  open() {
    if (!isAdminAuthenticated()) {
      this.openLogin();
      return;
    }
    sound.playClick();
    this.modalEl.classList.remove("hidden");
  }

  close() {
    this.modalEl.classList.add("hidden");
  }

  openLogin() {
    sound.playClick();
    this.loginModalEl.classList.remove("hidden");
    const input = this.loginModalEl.querySelector("#adminPinInput");
    if (input) {
      input.value = "";
      setTimeout(() => input.focus(), 100);
    }
  }

  closeLogin() {
    this.loginModalEl.classList.add("hidden");
  }
}
