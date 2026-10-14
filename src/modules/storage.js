import { INITIAL_PLAYERS } from "../data/players.js";

const STORAGE_KEY_TOURNAMENT = "castillo_cup_tournament_state_v1";
const STORAGE_KEY_PRODE = "castillo_cup_prode_submissions_v1";
const STORAGE_KEY_DRAW_LOCK = "castillo_cup_draw_lock_v1";
const STORAGE_KEY_DEVICE_IP = "castillo_cup_device_ip_v1";
const STORAGE_KEY_DEVICE_ID = "castillo_cup_device_id_v1";

// Identificador único persistente para este dispositivo
export function getOrGenerateDeviceId() {
  try {
    let devId = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
    if (!devId) {
      devId = "DEV-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      localStorage.setItem(STORAGE_KEY_DEVICE_ID, devId);
    }
    return devId;
  } catch (e) {
    return "DEV-PES6";
  }
}

// Comprobar si este dispositivo ya realizó su sorteo definitivo
export function isDrawLocked() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DRAW_LOCK);
    if (!raw) return { locked: false, lockedAt: null };
    const parsed = JSON.parse(raw);
    return {
      locked: Boolean(parsed?.isLocked),
      lockedAt: parsed?.lockedAt || null
    };
  } catch (e) {
    return { locked: false, lockedAt: null };
  }
}

// Bloquear el sorteo para este dispositivo (sorteo único de prueba)
export function lockDraw() {
  try {
    const lockData = {
      isLocked: true,
      lockedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY_DRAW_LOCK, JSON.stringify(lockData));
    return lockData;
  } catch (e) {
    console.error("Error al bloquear sorteo:", e);
    return null;
  }
}

// Desbloquear sorteo para este dispositivo (función de administración / testeo)
export function unlockDraw() {
  try {
    localStorage.removeItem(STORAGE_KEY_DRAW_LOCK);
    return true;
  } catch (e) {
    return false;
  }
}

// Crea la estructura inicial de llaves del torneo (32 jugadores, 16-avos hasta la Final)
export function createInitialBracket() {
  const rounds = {
    r16: [],
    r8: [],
    r4: [],
    r2: [],
    r1: []
  };

  // 16-avos (16 cruces)
  for (let i = 1; i <= 16; i++) {
    const nextMatchIdx = Math.ceil(i / 2);
    const nextSlot = i % 2 === 1 ? 1 : 2;
    rounds.r16.push({
      id: `r16_m${i}`,
      matchNumber: i,
      round: "r16",
      roundTitle: "16-avos de Final",
      player1: null,
      player2: null,
      score1_ida: null,
      score2_ida: null,
      score1_vuelta: null,
      score2_vuelta: null,
      score1_extra: null,
      score2_extra: null,
      penalties1: null,
      penalties2: null,
      status: "pending", // pending, finished
      winner: null,
      nextMatchId: `r8_m${nextMatchIdx}`,
      nextSlot
    });
  }

  // Octavos (8 cruces)
  for (let i = 1; i <= 8; i++) {
    const nextMatchIdx = Math.ceil(i / 2);
    const nextSlot = i % 2 === 1 ? 1 : 2;
    rounds.r8.push({
      id: `r8_m${i}`,
      matchNumber: i,
      round: "r8",
      roundTitle: "Octavos de Final",
      player1: null,
      player2: null,
      score1_ida: null,
      score2_ida: null,
      score1_vuelta: null,
      score2_vuelta: null,
      score1_extra: null,
      score2_extra: null,
      penalties1: null,
      penalties2: null,
      status: "pending",
      winner: null,
      nextMatchId: `r4_m${nextMatchIdx}`,
      nextSlot
    });
  }

  // Cuartos (4 cruces)
  for (let i = 1; i <= 4; i++) {
    const nextMatchIdx = Math.ceil(i / 2);
    const nextSlot = i % 2 === 1 ? 1 : 2;
    rounds.r4.push({
      id: `r4_m${i}`,
      matchNumber: i,
      round: "r4",
      roundTitle: "Cuartos de Final",
      player1: null,
      player2: null,
      score1_ida: null,
      score2_ida: null,
      score1_vuelta: null,
      score2_vuelta: null,
      score1_extra: null,
      score2_extra: null,
      penalties1: null,
      penalties2: null,
      status: "pending",
      winner: null,
      nextMatchId: `r2_m${nextMatchIdx}`,
      nextSlot
    });
  }

  // Semifinales (2 cruces)
  for (let i = 1; i <= 2; i++) {
    const nextMatchIdx = 1;
    const nextSlot = i;
    rounds.r2.push({
      id: `r2_m${i}`,
      matchNumber: i,
      round: "r2",
      roundTitle: "Semifinal",
      player1: null,
      player2: null,
      score1_ida: null,
      score2_ida: null,
      score1_vuelta: null,
      score2_vuelta: null,
      score1_extra: null,
      score2_extra: null,
      penalties1: null,
      penalties2: null,
      status: "pending",
      winner: null,
      nextMatchId: `r1_m1`,
      nextSlot
    });
  }

  // Gran Final (1 cruce)
  rounds.r1.push({
    id: `r1_m1`,
    matchNumber: 1,
    round: "r1",
    roundTitle: "Gran Final",
    player1: null,
    player2: null,
    score1_ida: null,
    score2_ida: null,
    score1_vuelta: null,
    score2_vuelta: null,
    score1_extra: null,
    score2_extra: null,
    penalties1: null,
    penalties2: null,
    status: "pending",
    winner: null,
    nextMatchId: null,
    nextSlot: null
  });

  return {
    version: 1,
    isDrawn: false,
    drawDate: null,
    players: JSON.parse(JSON.stringify(INITIAL_PLAYERS)),
    rounds,
    champion: null
  };
}

// Cargar estado de almacenamiento o crear uno nuevo
export function loadTournamentState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TOURNAMENT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.rounds && parsed.rounds.r16) {
        // Sincronizar Darío C. 🐐 (Único Jugador Estrella / Jugador 0)
        parsed.players?.forEach(p => {
          if (p.id === 0 || p.name.includes("Darío C.") || (p.name.includes("Dario") && p.id !== 1)) {
            p.name = "Darío C. 🐐";
            p.alias = "Darío C. 🐐";
            p.confirmed = true;
            p.isStar = true;
          } else {
            delete p.isStar;
            // Si por error se había asignado el nombre a jugador 1, restaurar Valenfulvo
            if (p.id === 1 && p.name.includes("Darío")) {
              p.name = "Valenfulvo";
              p.alias = "Valenfulvo";
            }
          }
        });

        // Sincronizar en llaves existentes si estuviera asignado Darío C. 🐐
        Object.keys(parsed.rounds || {}).forEach(rk => {
          parsed.rounds[rk]?.forEach(m => {
            if (m.player1 && (m.player1.id === 0 || m.player1.name?.includes("Darío C.") || (m.player1.id !== 1 && m.player1.name?.toLowerCase().includes("dario")))) {
              m.player1.name = "Darío C. 🐐";
              m.player1.alias = "Darío C. 🐐";
            }
            if (m.player2 && (m.player2.id === 0 || m.player2.name?.includes("Darío C.") || (m.player2.id !== 1 && m.player2.name?.toLowerCase().includes("dario")))) {
              m.player2.name = "Darío C. 🐐";
              m.player2.alias = "Darío C. 🐐";
            }
            if (m.winner && (m.winner.id === 0 || m.winner.name?.includes("Darío C.") || (m.winner.id !== 1 && m.winner.name?.toLowerCase().includes("dario")))) {
              m.winner.name = "Darío C. 🐐";
              m.winner.alias = "Darío C. 🐐";
            }
          });
        });
        if (parsed.champion && (parsed.champion.id === 0 || parsed.champion.name?.includes("Darío C.") || (parsed.champion.id !== 1 && parsed.champion.name?.toLowerCase().includes("dario")))) {
          parsed.champion.name = "Darío C. 🐐";
          parsed.champion.alias = "Darío C. 🐐";
        }

        // Sincronizar actualización de Eber Ampugnani si estuviera guardado con el nombre anterior
        const eber = parsed.players?.find(p => p.id === 7 || p.name.includes("Eber"));
        if (eber) {
          eber.name = "Eber Ampugnani";
          eber.alias = "Eber Ampugnani";
          eber.confirmed = true;
          delete eber.note;
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error al cargar estado del torneo:", err);
  }
  const fresh = createInitialBracket();
  saveTournamentState(fresh);
  return fresh;
}

// Guardar estado
export function saveTournamentState(state) {
  try {
    localStorage.setItem(STORAGE_KEY_TOURNAMENT, JSON.stringify(state));
  } catch (err) {
    console.error("Error al guardar estado del torneo:", err);
  }
}

// Reiniciar torneo a estado inicial previo al sorteo
export function resetTournament(resetLock = false) {
  if (resetLock) {
    unlockDraw();
  }
  const fresh = createInitialBracket();
  saveTournamentState(fresh);
  return fresh;
}

// Buscar un partido por ID en todas las rondas
export function findMatchById(state, matchId) {
  for (const roundKey of ["r16", "r8", "r4", "r2", "r1"]) {
    const match = state.rounds[roundKey].find(m => m.id === matchId);
    if (match) return { match, roundKey };
  }
  return null;
}

// Calcular resultado global y definir ganador
export function computeMatchOutcome(match) {
  const hasIda = match.score1_ida !== null && match.score2_ida !== null && match.score1_ida !== "" && match.score2_ida !== "";
  const hasVuelta = match.score1_vuelta !== null && match.score2_vuelta !== null && match.score1_vuelta !== "" && match.score2_vuelta !== "";

  if (!hasIda || !hasVuelta) {
    return {
      isFinished: false,
      global1: null,
      global2: null,
      isTied: false,
      needsExtra: false,
      winner: null
    };
  }

  const s1_ida = parseInt(match.score1_ida, 10);
  const s2_ida = parseInt(match.score2_ida, 10);
  const s1_vuelta = parseInt(match.score1_vuelta, 10);
  const s2_vuelta = parseInt(match.score2_vuelta, 10);

  const global1 = s1_ida + s1_vuelta;
  const global2 = s2_ida + s2_vuelta;

  if (global1 > global2) {
    return {
      isFinished: true,
      global1,
      global2,
      isTied: false,
      needsExtra: false,
      winner: match.player1
    };
  } else if (global2 > global1) {
    return {
      isFinished: true,
      global1,
      global2,
      isTied: false,
      needsExtra: false,
      winner: match.player2
    };
  } else {
    // Empate global exacto -> Se define por 3er partido
    const hasExtra = match.score1_extra !== null && match.score2_extra !== null && match.score1_extra !== "" && match.score2_extra !== "";
    if (!hasExtra) {
      return {
        isFinished: false,
        global1,
        global2,
        isTied: true,
        needsExtra: true,
        winner: null
      };
    }

    const s1_ex = parseInt(match.score1_extra, 10);
    const s2_ex = parseInt(match.score2_extra, 10);

    if (s1_ex > s2_ex) {
      return {
        isFinished: true,
        global1,
        global2,
        isTied: false,
        needsExtra: true,
        winner: match.player1
      };
    } else if (s2_ex > s1_ex) {
      return {
        isFinished: true,
        global1,
        global2,
        isTied: false,
        needsExtra: true,
        winner: match.player2
      };
    } else {
      // Empate en 3er partido -> Penales
      const hasPen = match.penalties1 !== null && match.penalties2 !== null && match.penalties1 !== "" && match.penalties2 !== "";
      if (!hasPen) {
        return {
          isFinished: false,
          global1,
          global2,
          isTied: true,
          needsExtra: true,
          needsPenalties: true,
          winner: null
        };
      }
      const p1 = parseInt(match.penalties1, 10);
      const p2 = parseInt(match.penalties2, 10);
      if (p1 > p2) {
        return {
          isFinished: true,
          global1,
          global2,
          isTied: false,
          needsExtra: true,
          winner: match.player1
        };
      } else if (p2 > p1) {
        return {
          isFinished: true,
          global1,
          global2,
          isTied: false,
          needsExtra: true,
          winner: match.player2
        };
      } else {
        return {
          isFinished: false,
          global1,
          global2,
          isTied: true,
          needsExtra: true,
          winner: null
        };
      }
    }
  }
}

// Propagar ganador a la siguiente ronda
export function updateMatchAndPropagate(state, matchId, matchData) {
  const found = findMatchById(state, matchId);
  if (!found) return false;

  const { match } = found;

  // Actualizar datos del partido
  Object.assign(match, matchData);

  const outcome = computeMatchOutcome(match);

  if (outcome.isFinished && outcome.winner) {
    match.status = "finished";
    match.winner = outcome.winner;

    // Si es la final, declarar campeón
    if (match.round === "r1") {
      state.champion = outcome.winner;
    } else if (match.nextMatchId) {
      // Propagar a la siguiente ronda
      const nextFound = findMatchById(state, match.nextMatchId);
      if (nextFound) {
        if (match.nextSlot === 1) {
          nextFound.match.player1 = outcome.winner;
        } else {
          nextFound.match.player2 = outcome.winner;
        }
      }
    }
  } else {
    // Si se borraron o invalidaron resultados, quitar ganador
    match.status = "pending";
    const previousWinner = match.winner;
    match.winner = null;

    if (match.round === "r1") {
      state.champion = null;
    } else if (match.nextMatchId && previousWinner) {
      const nextFound = findMatchById(state, match.nextMatchId);
      if (nextFound) {
        if (match.nextSlot === 1 && nextFound.match.player1?.id === previousWinner.id) {
          nextFound.match.player1 = null;
        } else if (match.nextSlot === 2 && nextFound.match.player2?.id === previousWinner.id) {
          nextFound.match.player2 = null;
        }
      }
    }
  }

  saveTournamentState(state);
  return true;
}

// Prode Storage Helpers (Modo Prototipo: no se guardan en almacenamiento persistente)
export function loadProdeSubmissions() {
  return [];
}

export function saveProdeSubmission(submission) {
  // En modo prototipo los pronósticos no se guardan en base de datos ni storage
  return submission;
}
