// Información, reglas oficiales y asignación de equipos por ronda
export const ROUND_TEAMS = {
  r16: {
    roundKey: "r16",
    roundName: "16-avos de Final",
    teamName: "Manchester United",
    shortName: "United",
    badgeFile: "united.png",
    ruleLabel: "Todos United",
    color: "#da291c"
  },
  r8: {
    roundKey: "r8",
    roundName: "Octavos de Final",
    teamName: "AC Milán",
    shortName: "Milán",
    badgeFile: "milan.png",
    ruleLabel: "Todos Milán",
    color: "#fb090b"
  },
  r4: {
    roundKey: "r4",
    roundName: "Cuartos de Final",
    teamName: "Newcastle United",
    shortName: "Newcastle",
    badgeFile: "newcastle.png",
    ruleLabel: "Todos Newcastle",
    color: "#241f20"
  },
  r2: {
    roundKey: "r2",
    roundName: "Semifinales",
    teamName: "Italia",
    shortName: "Italia",
    badgeFile: "italia.png",
    ruleLabel: "Todos Italia",
    color: "#004899"
  },
  r1: {
    roundKey: "r1",
    roundName: "Gran Final",
    teamName: "Brasil",
    shortName: "Brasil vs. Brasil",
    badgeFile: "brasil.png",
    ruleLabel: "Brasil vs. Brasil",
    color: "#ffdf00"
  }
};

export const TOURNAMENT_INFO = {
  name: "Castillo Cup",
  game: "Pro Evolution Soccer 6 (PES 6)",
  subtitle: "Mata-Mata 32 Jugadores",
  slogan: "PES 6 ONLINE",
  entryFee: "$0 (Inscripción Gratuita)",
  launchDate: "2026-10-30T22:00:00",
  drawDate: "2026-10-27T21:00:00",
  prizes: {
    champion: {
      amount: 50000,
      formatted: "$50.000 ARS",
      title: "Campeón de la Copa",
      description: "Premio en efectivo para el campeón de PES 6"
    },
    prode: {
      amount: 20000,
      formatted: "$20.000 ARS",
      title: "Ganador del Prode",
      description: "Premio para el participante con mayor puntaje en el Prode (16-avos)"
    }
  },
  prodeRules: {
    exactScorePoints: 3,
    outcomePoints: 1,
    missPoints: 0
  },
  gameConfig: {
    condition: "Al azar",
    injury: "Sí",
    time: "10 min.",
    matchType: "Largo",
    subs: "5 cambios",
    weather: "Despejado",
    season: "Verano"
  },
  roundRules: [
    { round: "16-avos de Final", rule: "Todos United", team: "Manchester United", file: "united.png" },
    { round: "Octavos de Final", rule: "Todos Milán", team: "AC Milán", file: "milan.png" },
    { round: "Cuartos de Final", rule: "Todos Newcastle", team: "Newcastle United", file: "newcastle.png" },
    { round: "Semifinal", rule: "Todos Italia", team: "Italia", file: "italia.png" },
    { round: "Gran Final", rule: "Brasil vs. Brasil", team: "Brasil", file: "brasil.png" }
  ],
  rules: [
    {
      title: "Formato Eliminatorio (Mata-Mata)",
      detail: "32 participantes en llaves directas de eliminación simple hasta consagrar al campeón."
    },
    {
      title: "Equipos Fijos por Ronda (Modo Espejo)",
      detail: "16avos: Todos United • 8avos: Todos Milán • 4tos: Todos Newcastle • Semifinal: Todos Italia • Final: Brasil vs. Brasil."
    },
    {
      title: "Partidos Ida y Vuelta",
      detail: "Cada cruce se define por Marcador Global (suma de goles de ida y vuelta)."
    },
    {
      title: "Desempate en Tercer Partido",
      detail: "En caso de empate global exacto, se disputa un 3er partido con Tiempo Extra y Penales."
    },
    {
      title: "Inscripción 100% Gratuita",
      detail: "Inscripción: $0. Pozo total acumulado de $70.000 ARS en premios ($50.000 Campeón + $20.000 Prode)."
    },
    {
      title: "Configuración de Sala PES 6",
      detail: "Al azar • Lesión: Sí • 10 min. • Largo • 5 cambios • Despejado • Verano."
    }
  ]
};
