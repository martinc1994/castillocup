import { sound } from "./audio.js";
import { saveTournamentState, lockDraw, isDrawLocked } from "./storage.js";
import { StadiumCelebration } from "./stadiumCelebration.js";

export class DrawManager {
  constructor(tournamentState, onUpdateCallback) {
    this.state = tournamentState;
    this.onUpdate = onUpdateCallback;
    this.isRunning = false;
    this.timer = null;
    this.speed = 850; // Velocidad pausada y emocionante (850ms por bolilla)
    this.remainingPlayers = [];
    this.drawnCount = 0;
  }

  initDrawPool() {
    // Clona los 32 jugadores y los mezcla aleatoriamente
    this.remainingPlayers = [...this.state.players].sort(() => Math.random() - 0.5);
    this.drawnCount = 0;
  }

  // Extrae un solo jugador y lo ubica en la siguiente llave de 16-avos
  drawNextStep() {
    if (this.remainingPlayers.length === 0) {
      this.finishDraw();
      return null;
    }

    const player = this.remainingPlayers.pop();
    const slotIndex = this.drawnCount;
    const matchIndex = Math.floor(slotIndex / 2);
    const isSlot1 = slotIndex % 2 === 0;

    const match = this.state.rounds.r16[matchIndex];
    if (match) {
      if (isSlot1) {
        match.player1 = player;
      } else {
        match.player2 = player;
      }
    }

    this.drawnCount++;
    sound.playBallReveal();

    if (this.onUpdate) {
      this.onUpdate({
        player,
        matchIndex: matchIndex + 1,
        slot: isSlot1 ? 1 : 2,
        totalDrawn: this.drawnCount,
        remaining: this.remainingPlayers.length
      });
    }

    if (this.remainingPlayers.length === 0) {
      this.finishDraw();
    }

    return player;
  }

  // Ejecuta el sorteo automáticamente con animación más pausada (850ms)
  startAutoDraw(speed = 850) {
    if (this.isRunning) return;
    this.speed = speed;
    this.isRunning = true;

    // Si ya estaba sorteado o vacío, inicializamos el bombo
    if (this.drawnCount === 0 || this.remainingPlayers.length === 0) {
      this.initDrawPool();
      // Limpiamos los 16-avos
      this.state.rounds.r16.forEach(m => {
        m.player1 = null;
        m.player2 = null;
      });
    }

    const step = () => {
      if (!this.isRunning) return;
      if (this.remainingPlayers.length > 0) {
        this.drawNextStep();
        this.timer = setTimeout(step, this.speed);
      } else {
        this.finishDraw();
      }
    };

    step();
  }

  pauseAutoDraw() {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  // Guardar sorteo actual (persistir en localStorage de forma explícita)
  saveCurrentDraw() {
    saveTournamentState(this.state);
    sound.playGoal();
    return {
      totalDrawn: this.drawnCount,
      isComplete: this.state.isDrawn
    };
  }

  finishDraw() {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.state.isDrawn = true;
    this.state.drawDate = new Date().toISOString();
    saveTournamentState(this.state);

    sound.playWhistle();

    // Recibimiento estilo cancha: Papelitos blancos, humo de bengalas y fuegos artificiales sincronizados
    try {
      StadiumCelebration.launch();
    } catch (e) {
      console.warn("Celebration fallback", e);
    }

    if (this.onUpdate) {
      this.onUpdate({ isComplete: true });
    }
  }

  resetDraw() {
    this.pauseAutoDraw();
    this.drawnCount = 0;
    this.remainingPlayers = [];
    this.state.isDrawn = false;
    this.state.drawDate = null;

    // Vaciar todas las rondas
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

    if (this.onUpdate) {
      this.onUpdate({ isReset: true });
    }
  }
}
