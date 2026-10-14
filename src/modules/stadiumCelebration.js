import confetti from "canvas-confetti";
import { sound } from "./audio.js";

// Módulo de Celebración Futbolera: Bengalas, Humo de Cancha, Papelitos Blancos y Fuegos Artificiales
export class StadiumCelebration {
  // Lanza el recibimiento completo estilo estadio de fútbol argentino
  static launch() {
    // 1. Silbato inicial de árbitro
    sound.playWhistle();

    // 2. Desplegar Humo de Estadio / Bengalas
    StadiumCelebration.triggerStadiumSmoke();

    // 3. Lluvia masiva de papelitos blancos de cancha (tiras y picados)
    StadiumCelebration.launchStadiumPaperShower();

    // 4. Batería de Fuegos Artificiales sincronizados con sonido
    StadiumCelebration.launchFireworksSequence();
  }

  // Lluvia de papelitos blancos y tiras de cancha
  static launchStadiumPaperShower() {
    const whiteColors = ["#ffffff", "#f8fafc", "#e2e8f0", "#ffd700"];

    // Cañón izquierdo (Tiras y papelitos disparados hacia arriba y al centro)
    confetti({
      particleCount: 100,
      angle: 60,
      spread: 75,
      origin: { x: 0.05, y: 0.85 },
      colors: whiteColors,
      shapes: ["square"],
      scalar: 1.3,
      gravity: 0.7,
      drift: 0.1,
      ticks: 350
    });

    // Cañón derecho (Tiras y papelitos hacia arriba y al centro)
    confetti({
      particleCount: 100,
      angle: 120,
      spread: 75,
      origin: { x: 0.95, y: 0.85 },
      colors: whiteColors,
      shapes: ["square"],
      scalar: 1.3,
      gravity: 0.7,
      drift: -0.1,
      ticks: 350
    });

    // Cascada continua de papel picado desde arriba durante 3 segundos
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const frame = () => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return;

      const particleCount = 20 * (timeLeft / duration);
      confetti({
        particleCount,
        startVelocity: 0,
        ticks: 250,
        origin: {
          x: Math.random() * 0.8 + 0.1,
          y: Math.random() * 0.15
        },
        colors: ["#ffffff", "#f1f5f9", "#ffffff", "#ffd700"],
        shapes: ["square"],
        gravity: 0.55,
        scalar: 1.1,
        drift: (Math.random() - 0.5) * 0.4
      });

      requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
  }

  // Ráfagas de Fuegos Artificiales con detonaciones sonoras
  static launchFireworksSequence() {
    const fireworksPositions = [
      { x: 0.25, y: 0.4, delay: 400, colors: ["#00f5d4", "#ffffff", "#00bbf9"] },
      { x: 0.75, y: 0.35, delay: 900, colors: ["#ffd700", "#ffffff", "#f59e0b"] },
      { x: 0.4, y: 0.28, delay: 1500, colors: ["#ffffff", "#00f5d4", "#ffd700"] },
      { x: 0.6, y: 0.25, delay: 2100, colors: ["#ffd700", "#ff0055", "#ffffff"] },
      { x: 0.5, y: 0.2, delay: 2700, colors: ["#ffd700", "#00f5d4", "#ffffff"] } // Gran final central
    ];

    fireworksPositions.forEach((fw) => {
      setTimeout(() => {
        sound.playFirework();
        confetti({
          particleCount: 80,
          spread: 100,
          startVelocity: 35,
          origin: { x: fw.x, y: fw.y },
          colors: fw.colors,
          ticks: 200,
          gravity: 0.8,
          scalar: 1.2
        });
      }, fw.delay);
    });

    // Fanfarria victoriosa al culminar los fuegos
    setTimeout(() => {
      sound.playFanfare();
    }, 2800);
  }

  // Humo de bengalas de cancha
  static triggerStadiumSmoke() {
    // Eliminar humo previo si existiera
    const oldSmoke = document.getElementById("stadiumSmokeOverlay");
    if (oldSmoke) oldSmoke.remove();

    const smokeOverlay = document.createElement("div");
    smokeOverlay.id = "stadiumSmokeOverlay";
    smokeOverlay.className = "stadium-smoke-container";

    smokeOverlay.innerHTML = `
      <div class="smoke-haze cyan"></div>
      <div class="smoke-haze gold"></div>
      <div class="smoke-cloud cloud-1"></div>
      <div class="smoke-cloud cloud-2"></div>
      <div class="smoke-cloud cloud-3"></div>
      <div class="stadium-flare flare-left"></div>
      <div class="stadium-flare flare-right"></div>
    `;

    document.body.appendChild(smokeOverlay);

    // Desvanecer y retirar a los 5 segundos
    setTimeout(() => {
      smokeOverlay.classList.add("fade-out");
      setTimeout(() => smokeOverlay.remove(), 1200);
    }, 4500);
  }
}
