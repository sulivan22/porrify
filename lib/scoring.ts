import { CompetitionKey, Pick, TeamProgress } from "@/lib/types";

export function getBaseTeamScore(progress: TeamProgress, competitionKey: CompetitionKey) {
  if (competitionKey === "formula-1") {
    return progress.baseScore ?? 0;
  }

  return (
    progress.wins * 3 +
    progress.draws * 1 +
    progress.losses * 0 +
    progress.goalsFor * 1 +
    progress.goalsAgainst * -0.5 +
    (progress.reachedRoundOf32 ? 10 : 0) +
    (progress.reachedRoundOf16 ? 15 : 0) +
    (progress.reachedQuarterFinal ? 20 : 0) +
    (progress.reachedSemiFinal ? 40 : 0) +
    (progress.reachedFinal ? 50 : 0) +
    (progress.wonRunnerUp ? 50 : 0) +
    (progress.wonThirdPlace ? 15 : 0) +
    (progress.wonWorldCup ? 100 : 0)
  );
}

export function getRankMultiplier(rank: number, competitionKey: CompetitionKey) {
  if (competitionKey === "formula-1") {
    return Math.max(12 - rank, 1);
  }

  return Math.max(16 - rank, 1);
}

export function getWeightedPickScore(
  pick: Pick,
  progress: TeamProgress | undefined,
  competitionKey: CompetitionKey
) {
  if (!progress) {
    return 0;
  }

  return getBaseTeamScore(progress, competitionKey) * getRankMultiplier(pick.rank, competitionKey);
}

function toNumberDelta(current?: number, baseline?: number) {
  return (current ?? 0) - (baseline ?? 0);
}

function toStageDelta(current?: boolean, baseline?: boolean) {
  return Boolean(current) && !Boolean(baseline);
}

export function getProgressDelta(
  competitionKey: CompetitionKey,
  current: TeamProgress | undefined,
  baseline: TeamProgress | undefined
): TeamProgress | undefined {
  if (!current) {
    return undefined;
  }

  if (!baseline) {
    return current;
  }

  return {
    competitionKey,
    teamCode: current.teamCode,
    wins: toNumberDelta(current.wins, baseline.wins),
    draws: toNumberDelta(current.draws, baseline.draws),
    losses: toNumberDelta(current.losses, baseline.losses),
    goalsFor: toNumberDelta(current.goalsFor, baseline.goalsFor),
    goalsAgainst: toNumberDelta(current.goalsAgainst, baseline.goalsAgainst),
    reachedRoundOf32: toStageDelta(current.reachedRoundOf32, baseline.reachedRoundOf32),
    reachedRoundOf16: toStageDelta(current.reachedRoundOf16, baseline.reachedRoundOf16),
    reachedQuarterFinal: toStageDelta(current.reachedQuarterFinal, baseline.reachedQuarterFinal),
    reachedSemiFinal: toStageDelta(current.reachedSemiFinal, baseline.reachedSemiFinal),
    reachedFinal: toStageDelta(current.reachedFinal, baseline.reachedFinal),
    wonRunnerUp: toStageDelta(current.wonRunnerUp, baseline.wonRunnerUp),
    wonThirdPlace: toStageDelta(current.wonThirdPlace, baseline.wonThirdPlace),
    wonWorldCup: toStageDelta(current.wonWorldCup, baseline.wonWorldCup),
    baseScore: toNumberDelta(current.baseScore, baseline.baseScore)
  };
}
