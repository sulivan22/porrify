import { CompetitionKey, CompetitionOption, Team, TeamProgress } from "@/lib/types";

export const worldCupTeams: Team[] = [
  { code: "ARG", name: "Argentina", image: "https://flagsapi.com/AR/flat/64.png", region: "CONMEBOL", competitionKey: "world-cup" },
  { code: "BRA", name: "Brasil", image: "https://flagsapi.com/BR/flat/64.png", region: "CONMEBOL", competitionKey: "world-cup" },
  { code: "ESP", name: "España", image: "https://flagsapi.com/ES/flat/64.png", region: "UEFA", competitionKey: "world-cup" },
  { code: "FRA", name: "Francia", image: "https://flagsapi.com/FR/flat/64.png", region: "UEFA", competitionKey: "world-cup" },
  { code: "ENG", name: "Inglaterra", image: "https://flagsapi.com/GB/flat/64.png", region: "UEFA", competitionKey: "world-cup" },
  { code: "GER", name: "Alemania", image: "https://flagsapi.com/DE/flat/64.png", region: "UEFA", competitionKey: "world-cup" },
  { code: "POR", name: "Portugal", image: "https://flagsapi.com/PT/flat/64.png", region: "UEFA", competitionKey: "world-cup" },
  { code: "NED", name: "Países Bajos", image: "https://flagsapi.com/NL/flat/64.png", region: "UEFA", competitionKey: "world-cup" },
  { code: "ITA", name: "Italia", image: "https://flagsapi.com/IT/flat/64.png", region: "UEFA", competitionKey: "world-cup" },
  { code: "CRO", name: "Croacia", image: "https://flagsapi.com/HR/flat/64.png", region: "UEFA", competitionKey: "world-cup" },
  { code: "USA", name: "Estados Unidos", image: "https://flagsapi.com/US/flat/64.png", region: "CONCACAF", competitionKey: "world-cup" },
  { code: "MEX", name: "México", image: "https://flagsapi.com/MX/flat/64.png", region: "CONCACAF", competitionKey: "world-cup" },
  { code: "JPN", name: "Japón", image: "https://flagsapi.com/JP/flat/64.png", region: "AFC", competitionKey: "world-cup" },
  { code: "KOR", name: "Corea del Sur", image: "https://flagsapi.com/KR/flat/64.png", region: "AFC", competitionKey: "world-cup" },
  { code: "MAR", name: "Marruecos", image: "https://flagsapi.com/MA/flat/64.png", region: "CAF", competitionKey: "world-cup" },
  { code: "SEN", name: "Senegal", image: "https://flagsapi.com/SN/flat/64.png", region: "CAF", competitionKey: "world-cup" }
];

export const laLigaTeams: Team[] = [
  { code: "ATH", name: "Athletic Bilbao", region: "La Liga", competitionKey: "la-liga" },
  { code: "ATM", name: "Atlético Madrid", region: "La Liga", competitionKey: "la-liga" },
  { code: "BAR", name: "Barcelona", region: "La Liga", competitionKey: "la-liga" },
  { code: "CEL", name: "Celta Vigo", region: "La Liga", competitionKey: "la-liga" },
  { code: "ALA", name: "Deportivo Alavés", region: "La Liga", competitionKey: "la-liga" },
  { code: "ELC", name: "Elche", region: "La Liga", competitionKey: "la-liga" },
  { code: "ESPANYOL", name: "Espanyol", region: "La Liga", competitionKey: "la-liga" },
  { code: "GET", name: "Getafe", region: "La Liga", competitionKey: "la-liga" },
  { code: "GIR", name: "Girona", region: "La Liga", competitionKey: "la-liga" },
  { code: "LEV", name: "Levante", region: "La Liga", competitionKey: "la-liga" },
  { code: "MLL", name: "Mallorca", region: "La Liga", competitionKey: "la-liga" },
  { code: "OSA", name: "Osasuna", region: "La Liga", competitionKey: "la-liga" },
  { code: "RAY", name: "Rayo Vallecano", region: "La Liga", competitionKey: "la-liga" },
  { code: "BET", name: "Real Betis", region: "La Liga", competitionKey: "la-liga" },
  { code: "RMA", name: "Real Madrid", region: "La Liga", competitionKey: "la-liga" },
  { code: "OVI", name: "Real Oviedo", region: "La Liga", competitionKey: "la-liga" },
  { code: "RSO", name: "Real Sociedad", region: "La Liga", competitionKey: "la-liga" },
  { code: "SEV", name: "Sevilla", region: "La Liga", competitionKey: "la-liga" },
  { code: "VAL", name: "Valencia", region: "La Liga", competitionKey: "la-liga" },
  { code: "VIL", name: "Villarreal", region: "La Liga", competitionKey: "la-liga" }
];

export const premierLeagueTeams: Team[] = [
  { code: "ARS", name: "Arsenal", region: "Premier League", competitionKey: "premier-league" },
  { code: "AVL", name: "Aston Villa", region: "Premier League", competitionKey: "premier-league" },
  { code: "BOU", name: "Bournemouth", region: "Premier League", competitionKey: "premier-league" },
  { code: "BRE", name: "Brentford", region: "Premier League", competitionKey: "premier-league" },
  { code: "BHA", name: "Brighton", region: "Premier League", competitionKey: "premier-league" },
  { code: "BUR", name: "Burnley", region: "Premier League", competitionKey: "premier-league" },
  { code: "CHE", name: "Chelsea", region: "Premier League", competitionKey: "premier-league" },
  { code: "CRY", name: "Crystal Palace", region: "Premier League", competitionKey: "premier-league" },
  { code: "EVE", name: "Everton", region: "Premier League", competitionKey: "premier-league" },
  { code: "FUL", name: "Fulham", region: "Premier League", competitionKey: "premier-league" },
  { code: "LEE", name: "Leeds United", region: "Premier League", competitionKey: "premier-league" },
  { code: "LIV", name: "Liverpool", region: "Premier League", competitionKey: "premier-league" },
  { code: "MCI", name: "Manchester City", region: "Premier League", competitionKey: "premier-league" },
  { code: "MUN", name: "Manchester United", region: "Premier League", competitionKey: "premier-league" },
  { code: "NEW", name: "Newcastle United", region: "Premier League", competitionKey: "premier-league" },
  { code: "NFO", name: "Nottingham Forest", region: "Premier League", competitionKey: "premier-league" },
  { code: "SUN", name: "Sunderland", region: "Premier League", competitionKey: "premier-league" },
  { code: "TOT", name: "Tottenham Hotspur", region: "Premier League", competitionKey: "premier-league" },
  { code: "WHU", name: "West Ham United", region: "Premier League", competitionKey: "premier-league" },
  { code: "WOL", name: "Wolverhampton", region: "Premier League", competitionKey: "premier-league" }
];

export const championsLeagueTeams: Team[] = [
  { code: "ucl-rma", name: "Real Madrid", region: "Champions League", competitionKey: "champions-league" },
  { code: "ucl-bar", name: "Barcelona", region: "Champions League", competitionKey: "champions-league" },
  { code: "ucl-atm", name: "Atlético Madrid", region: "Champions League", competitionKey: "champions-league" },
  { code: "ucl-mci", name: "Manchester City", region: "Champions League", competitionKey: "champions-league" },
  { code: "ucl-liv", name: "Liverpool", region: "Champions League", competitionKey: "champions-league" },
  { code: "ucl-ars", name: "Arsenal", region: "Champions League", competitionKey: "champions-league" },
  { code: "ucl-psg", name: "Paris Saint-Germain", region: "Champions League", competitionKey: "champions-league" },
  { code: "ucl-bay", name: "Bayern Munich", region: "Champions League", competitionKey: "champions-league" },
  { code: "ucl-bvb", name: "Borussia Dortmund", region: "Champions League", competitionKey: "champions-league" },
  { code: "ucl-int", name: "Inter", region: "Champions League", competitionKey: "champions-league" },
  { code: "ucl-mil", name: "Milan", region: "Champions League", competitionKey: "champions-league" },
  { code: "ucl-juv", name: "Juventus", region: "Champions League", competitionKey: "champions-league" },
  { code: "ucl-nap", name: "Napoli", region: "Champions League", competitionKey: "champions-league" },
  { code: "ucl-por", name: "FC Porto", region: "Champions League", competitionKey: "champions-league" },
  { code: "ucl-ben", name: "Benfica", region: "Champions League", competitionKey: "champions-league" },
  { code: "ucl-scp", name: "Sporting CP", region: "Champions League", competitionKey: "champions-league" },
  { code: "ucl-psv", name: "PSV Eindhoven", region: "Champions League", competitionKey: "champions-league" },
  { code: "ucl-aja", name: "Ajax", region: "Champions League", competitionKey: "champions-league" },
  { code: "ucl-gal", name: "Galatasaray", region: "Champions League", competitionKey: "champions-league" },
  { code: "ucl-cel", name: "Celtic", region: "Champions League", competitionKey: "champions-league" }
];

export const formulaOneDrivers: Team[] = [
  { code: "f1-ham", name: "Lewis Hamilton", region: "Formula 1", competitionKey: "formula-1", groupCode: "f1-fer", groupName: "Ferrari" },
  { code: "f1-lec", name: "Charles Leclerc", region: "Formula 1", competitionKey: "formula-1", groupCode: "f1-fer", groupName: "Ferrari" },
  { code: "f1-ver", name: "Max Verstappen", region: "Formula 1", competitionKey: "formula-1", groupCode: "f1-rbr", groupName: "Red Bull" },
  { code: "f1-tsu", name: "Yuki Tsunoda", region: "Formula 1", competitionKey: "formula-1", groupCode: "f1-rbr", groupName: "Red Bull" },
  { code: "f1-nor", name: "Lando Norris", region: "Formula 1", competitionKey: "formula-1", groupCode: "f1-mcl", groupName: "McLaren" },
  { code: "f1-pia", name: "Oscar Piastri", region: "Formula 1", competitionKey: "formula-1", groupCode: "f1-mcl", groupName: "McLaren" },
  { code: "f1-rus", name: "George Russell", region: "Formula 1", competitionKey: "formula-1", groupCode: "f1-mer", groupName: "Mercedes" },
  { code: "f1-ant", name: "Kimi Antonelli", region: "Formula 1", competitionKey: "formula-1", groupCode: "f1-mer", groupName: "Mercedes" },
  { code: "f1-alo", name: "Fernando Alonso", region: "Formula 1", competitionKey: "formula-1", groupCode: "f1-ast", groupName: "Aston Martin" },
  { code: "f1-str", name: "Lance Stroll", region: "Formula 1", competitionKey: "formula-1", groupCode: "f1-ast", groupName: "Aston Martin" },
  { code: "f1-gas", name: "Pierre Gasly", region: "Formula 1", competitionKey: "formula-1", groupCode: "f1-alp", groupName: "Alpine" },
  { code: "f1-col", name: "Franco Colapinto", region: "Formula 1", competitionKey: "formula-1", groupCode: "f1-alp", groupName: "Alpine" },
  { code: "f1-oce", name: "Esteban Ocon", region: "Formula 1", competitionKey: "formula-1", groupCode: "f1-haa", groupName: "Haas" },
  { code: "f1-bear", name: "Oliver Bearman", region: "Formula 1", competitionKey: "formula-1", groupCode: "f1-haa", groupName: "Haas" },
  { code: "f1-alb", name: "Alexander Albon", region: "Formula 1", competitionKey: "formula-1", groupCode: "f1-wil", groupName: "Williams" },
  { code: "f1-sai", name: "Carlos Sainz", region: "Formula 1", competitionKey: "formula-1", groupCode: "f1-wil", groupName: "Williams" },
  { code: "f1-hul", name: "Nico Hulkenberg", region: "Formula 1", competitionKey: "formula-1", groupCode: "f1-sau", groupName: "Sauber" },
  { code: "f1-bor", name: "Gabriel Bortoleto", region: "Formula 1", competitionKey: "formula-1", groupCode: "f1-sau", groupName: "Sauber" },
  { code: "f1-law", name: "Liam Lawson", region: "Formula 1", competitionKey: "formula-1", groupCode: "f1-rb", groupName: "Racing Bulls" },
  { code: "f1-had", name: "Isack Hadjar", region: "Formula 1", competitionKey: "formula-1", groupCode: "f1-rb", groupName: "Racing Bulls" },
  { code: "f1-oco", name: "Victor Martins", region: "Formula 1", competitionKey: "formula-1", groupCode: "f1-cad", groupName: "Cadillac" }
];

export const competitionOptions: CompetitionOption[] = [
  {
    key: "world-cup",
    label: "Mundial 2026",
    subtitle: "Torneo final a partir del 11 de junio de 2026",
    description: "Mantén el formato original por países para dejar la porra preparada.",
    teamLabel: "países",
    pickCount: 15
  }
];

export const competitionTeamMap: Record<CompetitionKey, Team[]> = {
  "champions-league": championsLeagueTeams,
  "la-liga": laLigaTeams,
  "premier-league": premierLeagueTeams,
  "formula-1": formulaOneDrivers,
  "world-cup": worldCupTeams
};

export const demoProgress: TeamProgress[] = [
  {
    competitionKey: "world-cup",
    teamCode: "ESP",
    wins: 3,
    draws: 1,
    losses: 0,
    goalsFor: 9,
    goalsAgainst: 2,
    reachedRoundOf32: true,
    reachedRoundOf16: true,
    reachedQuarterFinal: true,
    reachedSemiFinal: false,
    reachedFinal: false,
    wonRunnerUp: false,
    wonThirdPlace: false,
    wonWorldCup: false
  },
  {
    competitionKey: "world-cup",
    teamCode: "ARG",
    wins: 4,
    draws: 0,
    losses: 0,
    goalsFor: 11,
    goalsAgainst: 3,
    reachedRoundOf32: true,
    reachedRoundOf16: true,
    reachedQuarterFinal: true,
    reachedSemiFinal: true,
    reachedFinal: false,
    wonRunnerUp: false,
    wonThirdPlace: false,
    wonWorldCup: false
  },
  {
    competitionKey: "world-cup",
    teamCode: "BRA",
    wins: 2,
    draws: 1,
    losses: 1,
    goalsFor: 8,
    goalsAgainst: 4,
    reachedRoundOf32: true,
    reachedRoundOf16: true,
    reachedQuarterFinal: false,
    reachedSemiFinal: false,
    reachedFinal: false,
    wonRunnerUp: false,
    wonThirdPlace: false,
    wonWorldCup: false
  },
  {
    competitionKey: "la-liga",
    teamCode: "RMA",
    wins: 18,
    draws: 4,
    losses: 3,
    goalsFor: 54,
    goalsAgainst: 21,
    reachedRoundOf32: false,
    reachedRoundOf16: false,
    reachedQuarterFinal: false,
    reachedSemiFinal: false,
    reachedFinal: false,
    wonRunnerUp: false,
    wonThirdPlace: false,
    wonWorldCup: false
  },
  {
    competitionKey: "premier-league",
    teamCode: "LIV",
    wins: 18,
    draws: 6,
    losses: 2,
    goalsFor: 61,
    goalsAgainst: 28,
    reachedRoundOf32: false,
    reachedRoundOf16: false,
    reachedQuarterFinal: false,
    reachedSemiFinal: false,
    reachedFinal: false,
    wonRunnerUp: false,
    wonThirdPlace: false,
    wonWorldCup: false
  },
  {
    competitionKey: "formula-1",
    teamCode: "f1-ver",
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    reachedRoundOf32: false,
    reachedRoundOf16: false,
    reachedQuarterFinal: false,
    reachedSemiFinal: false,
    reachedFinal: false,
    wonRunnerUp: false,
    wonThirdPlace: false,
    wonWorldCup: false,
    baseScore: 125
  }
];

export const payoutRules = [
  { place: 1, label: "Ganador", percentage: 50 },
  { place: 2, label: "Segundo", percentage: 30 },
  { place: 3, label: "Tercero", percentage: 20 }
];

export function getTeamsForCompetition(competitionKey: CompetitionKey) {
  return competitionTeamMap[competitionKey];
}

export function getCompetitionOption(competitionKey: CompetitionKey) {
  return competitionOptions.find((option) => option.key === competitionKey) ?? competitionOptions[0];
}
