import { getCompetitionCatalogItem } from "@/lib/competition-catalog";
import {
  createSyncLog,
  getCompetitionLabel,
  replaceCompetitionEvents,
  replaceTeamProgress,
  updateAllEntryScores
} from "@/lib/repositories";
import { competitionApiConfig, fetchCompetitionSeasonEvents, fetchEventResults, SportsDbEvent } from "@/lib/sportsdb";
import { CompetitionKey, TeamProgress } from "@/lib/types";

function createEmptyProgress(competitionKey: CompetitionKey, teamCode: string): TeamProgress {
  return {
    competitionKey,
    teamCode,
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
    wonThirdPlace: false,
    wonWorldCup: false,
    baseScore: 0
  };
}

function getProgressMap(competitionKey: CompetitionKey, teamCodes: string[]) {
  return new Map(teamCodes.map((teamCode) => [teamCode, createEmptyProgress(competitionKey, teamCode)]));
}

function toScore(value?: string | null) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getStageLabel(event: SportsDbEvent) {
  const source = `${event.strEvent ?? ""} ${event.strFilename ?? ""}`.toLowerCase();

  if (/(third|3rd).*(place|play[- ]?off)|play[- ]?off.*(third|3rd)/.test(source)) {
    return "third-place" as const;
  }

  if (/semi/.test(source)) {
    return "semi" as const;
  }

  if (/quarter/.test(source)) {
    return "quarter" as const;
  }

  if (/(round of 16|last 16|round-of-16|octavos)/.test(source)) {
    return "round16" as const;
  }

  if (/(round of 32|last 32|round-of-32|16avos|dieciseisavos)/.test(source)) {
    return "round32" as const;
  }

  if (/\bfinal\b/.test(source)) {
    return "final" as const;
  }

  return null;
}

function markStage(progress: TeamProgress, stage: ReturnType<typeof getStageLabel>) {
  if (stage === "round32") {
    progress.reachedRoundOf32 = true;
  }

  if (stage === "round16") {
    progress.reachedRoundOf16 = true;
  }

  if (stage === "quarter") {
    progress.reachedQuarterFinal = true;
  }

  if (stage === "semi") {
    progress.reachedSemiFinal = true;
  }

  if (stage === "final") {
    progress.reachedFinal = true;
  }
}

function applyResult(progress: TeamProgress, goalsFor: number, goalsAgainst: number) {
  progress.goalsFor += goalsFor;
  progress.goalsAgainst += goalsAgainst;

  if (goalsFor > goalsAgainst) {
    progress.wins += 1;
    return;
  }

  if (goalsFor < goalsAgainst) {
    progress.losses += 1;
    return;
  }

  progress.draws += 1;
}

function applyStageWinner(
  stage: ReturnType<typeof getStageLabel>,
  homeProgress: TeamProgress,
  awayProgress: TeamProgress,
  homeScore: number,
  awayScore: number
) {
  if (homeScore === awayScore) {
    return;
  }

  const winner = homeScore > awayScore ? homeProgress : awayProgress;

  if (stage === "third-place") {
    winner.wonThirdPlace = true;
  }

  if (stage === "final") {
    winner.wonWorldCup = true;
  }
}

function materializeProgress(competitionKey: CompetitionKey, events: SportsDbEvent[], teamCodes: string[]) {
  const progressMap = getProgressMap(competitionKey, teamCodes);

  for (const event of events) {
    const homeCode = event.idHomeTeam ?? null;
    const awayCode = event.idAwayTeam ?? null;

    if (!homeCode || !awayCode) {
      continue;
    }

    const homeProgress = progressMap.get(homeCode);
    const awayProgress = progressMap.get(awayCode);

    if (!homeProgress || !awayProgress) {
      continue;
    }

    const stage = getStageLabel(event);
    markStage(homeProgress, stage);
    markStage(awayProgress, stage);

    const homeScore = toScore(event.intHomeScore);
    const awayScore = toScore(event.intAwayScore);

    if (homeScore === null || awayScore === null) {
      continue;
    }

    applyResult(homeProgress, homeScore, awayScore);
    applyResult(awayProgress, awayScore, homeScore);
    applyStageWinner(stage, homeProgress, awayProgress, homeScore, awayScore);
  }

  return Array.from(progressMap.values());
}

function pointsByRacePosition(position: number) {
  switch (position) {
    case 1:
      return 25;
    case 2:
      return 18;
    case 3:
      return 15;
    case 4:
      return 12;
    case 5:
      return 10;
    case 6:
      return 8;
    case 7:
      return 6;
    case 8:
      return 4;
    case 9:
      return 2;
    case 10:
      return 1;
    default:
      return 0;
  }
}

function isFormulaOneRaceEvent(event: SportsDbEvent) {
  const source = `${event.strEvent ?? ""} ${event.strFilename ?? ""}`.toLowerCase();

  if (!source.includes("grand prix")) {
    return false;
  }

  if (
    source.includes("sprint") ||
    source.includes("qualifying") ||
    source.includes("practice") ||
    source.includes("test") ||
    source.includes("shootout")
  ) {
    return false;
  }

  return true;
}

async function materializeFormulaOneProgress(events: SportsDbEvent[], driverCodes: string[]) {
  const progressMap = getProgressMap("formula-1", driverCodes);

  for (const event of events) {
    if (!event.idEvent) {
      continue;
    }

    if (!isFormulaOneRaceEvent(event)) {
      continue;
    }

    const eventResults = await fetchEventResults(event.idEvent).catch(() => []);
    const driverBestPoints = new Map<string, number>();

    for (const result of eventResults) {
      const driverCode = result.idPlayer ?? null;
      const position = Number(result.intPosition ?? "");
      if (!driverCode) {
        continue;
      }

      const pointsFromApi = Number(result.intPoints ?? "");
      const hasApiPoints = Number.isFinite(pointsFromApi);

      if (!hasApiPoints && !Number.isFinite(position)) {
        continue;
      }

      const points = hasApiPoints ? pointsFromApi : pointsByRacePosition(position);
      const current = driverBestPoints.get(driverCode) ?? Number.NEGATIVE_INFINITY;
      driverBestPoints.set(driverCode, Math.max(current, points));
    }

    for (const [driverCode, points] of driverBestPoints.entries()) {
      const progress = progressMap.get(driverCode);
      if (!progress) {
        continue;
      }
      progress.baseScore = (progress.baseScore ?? 0) + points;
    }
  }

  return Array.from(progressMap.values());
}

export async function syncCompetitionData(competitionKey: CompetitionKey) {
  const events = await fetchCompetitionSeasonEvents(competitionKey);
  const competition = await getCompetitionCatalogItem(competitionKey);
  const teamCodes = competition.teams.map((team) => team.code);

  if (events.length === 0) {
    return {
      competitionLabel: getCompetitionLabel(competitionKey),
      eventsProcessed: 0,
      updatedEntries: 0,
      trackedTeams: 0
    };
  }

  const teamProgress =
    competitionKey === "formula-1"
      ? await materializeFormulaOneProgress(events, teamCodes)
      : materializeProgress(competitionKey, events, teamCodes);
  await replaceCompetitionEvents(competitionKey, events);
  await replaceTeamProgress(competitionKey, teamProgress);
  const updatedEntries = await updateAllEntryScores(competitionKey, teamProgress);

  const config = competitionApiConfig[competitionKey];
  await createSyncLog({
    source: "TheSportsDB",
    leagueId: config.leagueId,
    season: config.season,
    competitionKey,
    eventCount: events.length,
    updatedEntries,
    syncedAt: new Date().toISOString()
  });

  return {
    competitionLabel: getCompetitionLabel(competitionKey),
    eventsProcessed: events.length,
    updatedEntries,
    trackedTeams: teamProgress.filter((item) =>
      competitionKey === "formula-1"
        ? (item.baseScore ?? 0) > 0
        : item.wins || item.draws || item.losses || item.reachedRoundOf32 || item.reachedRoundOf16
    ).length
  };
}
