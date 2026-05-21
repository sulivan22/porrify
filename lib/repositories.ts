import { ObjectId } from "mongodb";

import { getCompetitionCatalogItem } from "@/lib/competition-catalog";
import { demoProgress, getCompetitionOption, getTeamsForCompetition } from "@/lib/data";
import { getDb } from "@/lib/mongodb";
import { getProgressDelta, getRankMultiplier, getWeightedPickScore } from "@/lib/scoring";
import { fetchEventResults, SportsDbEvent } from "@/lib/sportsdb";
import {
  BonusScoreBreakdown,
  CompetitionKey,
  Entry,
  EntryScoreBreakdown,
  LeaderboardRow,
  MatchScoreBreakdown,
  Payment,
  Pick,
  Porra,
  SyncLog,
  Team,
  TeamProgress
} from "@/lib/types";

function normalizeCompetitionKey(value?: string | null): CompetitionKey {
  if (value === "champions-league") {
    return "champions-league";
  }

  if (value === "la-liga") {
    return "la-liga";
  }

  if (value === "premier-league") {
    return "premier-league";
  }

  if (value === "formula-1") {
    return "formula-1";
  }

  return "world-cup";
}

function normalizePorra(porra: Porra | null) {
  if (!porra) {
    return null;
  }

  return {
    ...porra,
    competitionKey: normalizeCompetitionKey(porra.competitionKey),
    entryFeeCents: porra.entryFeeCents ?? 1000
  } satisfies Porra;
}

const fallbackPorras: Porra[] = [
  {
    slug: "elite-2026",
    name: "Elite 2026",
    ownerId: "demo-owner",
    competitionKey: "world-cup",
    entryFeeCents: 1000,
    participantCount: 12,
    status: "active",
    createdAt: new Date("2026-03-01").toISOString()
  },
  {
    slug: "laliga-test",
    name: "La Liga Test",
    ownerId: "demo-owner",
    competitionKey: "la-liga",
    entryFeeCents: 1000,
    participantCount: 5,
    status: "active",
    createdAt: new Date("2026-03-02").toISOString()
  }
];

const fallbackEntries: Entry[] = [
  {
    porraSlug: "elite-2026",
    userId: "demo-user",
    displayName: "Sulivan",
    competitionKey: "world-cup",
    paymentStatus: "paid",
    stripeSessionId: "cs_demo_paid",
    totalScore: 541,
    picks: [
      { rank: 1, teamCode: "ARG" },
      { rank: 2, teamCode: "ESP" },
      { rank: 3, teamCode: "BRA" },
      { rank: 4, teamCode: "FRA" },
      { rank: 5, teamCode: "ENG" },
      { rank: 6, teamCode: "POR" },
      { rank: 7, teamCode: "GER" },
      { rank: 8, teamCode: "MAR" },
      { rank: 9, teamCode: "USA" },
      { rank: 10, teamCode: "JPN" }
    ]
  },
  {
    porraSlug: "elite-2026",
    userId: "demo-user-2",
    displayName: "Alicia",
    competitionKey: "world-cup",
    paymentStatus: "paid",
    stripeSessionId: "cs_demo_paid_2",
    totalScore: 489,
    picks: [
      { rank: 1, teamCode: "ESP" },
      { rank: 2, teamCode: "ARG" },
      { rank: 3, teamCode: "BRA" },
      { rank: 4, teamCode: "GER" },
      { rank: 5, teamCode: "ENG" },
      { rank: 6, teamCode: "FRA" },
      { rank: 7, teamCode: "POR" },
      { rank: 8, teamCode: "USA" },
      { rank: 9, teamCode: "MEX" },
      { rank: 10, teamCode: "MAR" }
    ]
  },
  {
    porraSlug: "laliga-test",
    userId: "demo-user-3",
    displayName: "Carlos",
    competitionKey: "la-liga",
    paymentStatus: "paid",
    stripeSessionId: "cs_demo_paid_3",
    totalScore: 320,
    picks: [
      { rank: 1, teamCode: "RMA" },
      { rank: 2, teamCode: "BAR" },
      { rank: 3, teamCode: "ATM" },
      { rank: 4, teamCode: "BET" },
      { rank: 5, teamCode: "ATH" },
      { rank: 6, teamCode: "RSO" },
      { rank: 7, teamCode: "VIL" },
      { rank: 8, teamCode: "VAL" },
      { rank: 9, teamCode: "SEV" },
      { rank: 10, teamCode: "GIR" }
    ]
  }
];

function withFallback<T>(operation: () => Promise<T>, fallback: T) {
  return operation().catch(() => fallback);
}

function createEmptyProgressBaseline(competitionKey: CompetitionKey, teamCode: string): TeamProgress {
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

function getCurrentOrEmptyProgress(
  competitionKey: CompetitionKey,
  teamCode: string,
  progress: TeamProgress[]
) {
  return (
    progress.find((item) => item.teamCode === teamCode) ??
    createEmptyProgressBaseline(competitionKey, teamCode)
  );
}

export async function listPorras() {
  return withFallback(async () => {
    const db = await getDb();
    const porras = await db.collection<Porra>("porras").find({}).sort({ createdAt: -1 }).toArray();
    return porras.map((porra) => normalizePorra(porra)!);
  }, fallbackPorras);
}

export async function listPorrasByUser(userId: string) {
  return withFallback(async () => {
    const db = await getDb();
    const entries = await db.collection<Entry>("entries").find({ userId, paymentStatus: "paid" }).toArray();
    const slugs = [...new Set(entries.map((entry) => entry.porraSlug))];

    if (slugs.length === 0) {
      return [] as Porra[];
    }

    const porras = await db.collection<Porra>("porras").find({ slug: { $in: slugs } }).sort({ createdAt: -1 }).toArray();
    return porras.map((porra) => normalizePorra(porra)!);
  }, fallbackPorras.filter((porra) => fallbackEntries.some((entry) => entry.userId === userId && entry.porraSlug === porra.slug)));
}

export async function getUserEntries(userId: string) {
  return withFallback(async () => {
    const db = await getDb();
    return db.collection<Entry>("entries").find({ userId, paymentStatus: "paid" }).toArray();
  }, fallbackEntries.filter((entry) => entry.userId === userId && entry.paymentStatus === "paid"));
}

export async function getUserRoleByEmail(email?: string | null) {
  if (!email) {
    return "user";
  }

  return withFallback(async () => {
    const db = await getDb();
    const user = await db.collection<{ email: string; role?: string }>("users").findOne({ email });
    return user?.role ?? "user";
  }, "user");
}

export async function getPorraBySlug(slug: string) {
  return withFallback(async () => {
    const db = await getDb();
    const porra = await db.collection<Porra>("porras").findOne({ slug });
    return normalizePorra(porra);
  }, fallbackPorras.find((porra) => porra.slug === slug) ?? null);
}

export async function createPorra(input: {
  name: string;
  slug: string;
  ownerId: string;
  competitionKey: CompetitionKey;
  entryFeeCents: number;
}) {
  const db = await getDb();
  const existing = await db.collection<Porra>("porras").findOne({ slug: input.slug });
  if (existing) {
    throw new Error("Ese nombre de porra ya existe.");
  }

  const porra: Porra = {
    slug: input.slug,
    name: input.name,
    ownerId: input.ownerId,
    competitionKey: input.competitionKey,
    entryFeeCents: input.entryFeeCents,
    participantCount: 0,
    status: "active",
    createdAt: new Date().toISOString()
  };

  await db.collection<Porra>("porras").insertOne(porra);
  return porra;
}

export async function upsertEntry(input: Omit<Entry, "totalScore">) {
  const db = await getDb();
  const existingEntry = await db.collection<Entry>("entries").findOne({ porraSlug: input.porraSlug, userId: input.userId });
  const progress = await db
    .collection<TeamProgress>("teamProgress")
    .find({ competitionKey: input.competitionKey })
    .toArray()
    .catch(() => demoProgress.filter((item) => item.competitionKey === input.competitionKey));

  const baselineMap = new Map((existingEntry?.progressBaseline ?? []).map((item) => [item.teamCode, item]));
  const progressBaseline = input.picks.map((pick) => {
    return baselineMap.get(pick.teamCode) ?? getCurrentOrEmptyProgress(input.competitionKey, pick.teamCode, progress);
  });
  const progressBaselineMap = new Map(progressBaseline.map((item) => [item.teamCode, item]));

  const totalScore = input.picks.reduce((sum, pick) => {
    const currentProgress = progress.find((item) => item.teamCode === pick.teamCode);
    const baselineProgress = progressBaselineMap.get(pick.teamCode);
    const deltaProgress = getProgressDelta(input.competitionKey, currentProgress, baselineProgress);
    return sum + getWeightedPickScore(pick, deltaProgress, input.competitionKey);
  }, 0);

  const entry: Entry = {
    ...input,
    totalScore,
    joinedAt: existingEntry?.joinedAt ?? new Date().toISOString(),
    progressBaseline
  };

  const result = await db.collection<Entry>("entries").updateOne(
    { porraSlug: input.porraSlug, userId: input.userId },
    { $set: entry },
    { upsert: true }
  );

  if (result.upsertedCount > 0) {
    await db.collection<Porra>("porras").updateOne({ slug: input.porraSlug }, { $inc: { participantCount: 1 } });
  }

  return entry;
}

export async function createPayment(input: Payment) {
  const db = await getDb();
  await db.collection<Payment>("payments").updateOne(
    { stripeSessionId: input.stripeSessionId },
    { $set: input },
    { upsert: true }
  );
  return input;
}

export async function getPaymentBySessionId(stripeSessionId: string) {
  return withFallback(async () => {
    const db = await getDb();
    const payment = await db.collection<Payment>("payments").findOne({ stripeSessionId });
    return payment
      ? {
          ...payment,
          competitionKey: normalizeCompetitionKey(payment.competitionKey)
        }
      : null;
  }, null);
}

export async function getRecoverablePaymentByUserAndCompetition(input: {
  userId: string;
  mode: "create" | "join";
  competitionKey: CompetitionKey;
  porraSlug?: string;
}) {
  return withFallback(async () => {
    const db = await getDb();
    return db.collection<Payment>("payments").findOne(
      {
        userId: input.userId,
        mode: input.mode,
        competitionKey: input.competitionKey,
        ...(input.mode === "join" && input.porraSlug ? { porraSlug: input.porraSlug } : {}),
        paymentStatus: "paid",
        entryReference: { $exists: false }
      },
      {
        sort: {
          paidAt: -1,
          createdAt: -1
        }
      }
    ).then((payment) =>
      payment
        ? {
            ...payment,
            competitionKey: normalizeCompetitionKey(payment.competitionKey)
          }
        : null
    );
  }, null);
}

export async function replaceCompetitionEvents(competitionKey: CompetitionKey, events: Array<Record<string, unknown>>) {
  const db = await getDb();
  await db.collection("competitionEvents").deleteMany({ competitionKey });
  if (events.length > 0) {
    await db.collection("competitionEvents").insertMany(events.map((event) => ({ ...event, competitionKey })));
  }
}

export async function replaceTeamProgress(competitionKey: CompetitionKey, teamProgress: TeamProgress[]) {
  const db = await getDb();
  await db.collection<TeamProgress>("teamProgress").deleteMany({ competitionKey });
  if (teamProgress.length > 0) {
    await db.collection<TeamProgress>("teamProgress").insertMany(teamProgress);
  }
}

export async function updateAllEntryScores(competitionKey: CompetitionKey, progress: TeamProgress[]) {
  const db = await getDb();
  const entries = await db.collection<Entry>("entries").find({ competitionKey }).toArray();

  if (entries.length === 0) {
    return 0;
  }

  let formulaOneEventPoints: FormulaOneEventPoints[] = [];
  let footballEvents: SportsDbEvent[] = [];
  if (competitionKey === "formula-1") {
    const events = await db
      .collection<SportsDbEvent & { competitionKey: CompetitionKey }>("competitionEvents")
      .find({ competitionKey })
      .toArray();
    formulaOneEventPoints = await buildFormulaOneEventPoints(events);
  } else {
    footballEvents = await db
      .collection<SportsDbEvent & { competitionKey: CompetitionKey }>("competitionEvents")
      .find({ competitionKey })
      .toArray();
  }

  const operations = entries.map((entry) => {
    const totalScore =
      competitionKey === "formula-1"
        ? calculateFormulaOneEntryTotal(entry, formulaOneEventPoints)
        : calculateFootballEntryTotal({ entry, competitionKey, events: footballEvents });

    return {
      updateOne: {
        filter: { porraSlug: entry.porraSlug, userId: entry.userId },
        update: {
          $set: {
            totalScore
          }
        }
      }
    };
  });

  await db.collection<Entry>("entries").bulkWrite(operations);
  return operations.length;
}

export async function createSyncLog(syncLog: SyncLog) {
  const db = await getDb();
  await db.collection<SyncLog>("syncLogs").insertOne(syncLog);
}

export async function markPaymentPaid(input: {
  stripeSessionId: string;
  amountTotal: number;
  currency: string;
  customerEmail?: string;
}) {
  const db = await getDb();
  await db.collection<Payment>("payments").updateOne(
    { stripeSessionId: input.stripeSessionId },
    {
      $set: {
        amountTotal: input.amountTotal,
        currency: input.currency,
        customerEmail: input.customerEmail,
        checkoutStatus: "complete",
        paymentStatus: "paid",
        paidAt: new Date().toISOString()
      }
    }
  );
}

export async function markPaymentExpired(stripeSessionId: string) {
  const db = await getDb();
  await db.collection<Payment>("payments").updateOne(
    { stripeSessionId },
    {
      $set: {
        checkoutStatus: "expired",
        paymentStatus: "failed"
      }
    }
  );
}

export async function consumePayment(input: {
  stripeSessionId: string;
  porraSlug: string;
  userId: string;
}) {
  const db = await getDb();
  const entryReference = `${input.userId}:${input.porraSlug}`;

  await db.collection<Payment>("payments").updateOne(
    { stripeSessionId: input.stripeSessionId },
    {
      $set: {
        porraSlug: input.porraSlug,
        entryReference,
        consumedAt: new Date().toISOString()
      }
    }
  );
}

export async function getLeaderboard(slug: string): Promise<LeaderboardRow[]> {
  return withFallback(async () => {
    const db = await getDb();
    const porra = normalizePorra(await db.collection<Porra>("porras").findOne({ slug }));

    if (!porra) {
      return [];
    }

    const [entries, progress] = await Promise.all([
      db.collection<Entry>("entries").find({ porraSlug: slug, paymentStatus: "paid" }).toArray(),
      db.collection<TeamProgress>("teamProgress").find({ competitionKey: porra.competitionKey }).toArray()
    ]);
    const competition = await getCompetitionCatalogItem(porra.competitionKey);

    return materializeLeaderboard(entries, progress, porra.competitionKey, competition.teams);
  }, (() => {
    const porra = fallbackPorras.find((item) => item.slug === slug);
    if (!porra) {
      return [];
    }
    return materializeLeaderboard(
      fallbackEntries.filter((entry) => entry.porraSlug === slug),
      demoProgress.filter((item) => item.competitionKey === porra.competitionKey),
      porra.competitionKey
    );
  })());
}

function materializeLeaderboard(
  entries: Entry[],
  progress: TeamProgress[],
  competitionKey: CompetitionKey,
  teams = getTeamsForCompetition(competitionKey)
): LeaderboardRow[] {

  return entries
    .map((entry) => {
      const baselineMap = new Map((entry.progressBaseline ?? []).map((item) => [item.teamCode, item]));

      return {
        userId: entry.userId,
        displayName: entry.displayName,
        totalScore: entry.totalScore,
        prizeProjection: "Pendiente",
        picks: entry.picks.map((pick) => {
          const team =
            teams.find((item) => item.code === pick.teamCode) ?? {
              code: pick.teamCode,
              name: pick.teamCode,
              region: getCompetitionOption(competitionKey).label,
              competitionKey
            };
          const currentProgress = progress.find((item) => item.teamCode === pick.teamCode);
          const baselineProgress = baselineMap.get(pick.teamCode);
          const deltaProgress = getProgressDelta(competitionKey, currentProgress, baselineProgress);
          return {
            ...pick,
            team,
            weightedScore: getWeightedPickScore(pick, deltaProgress, competitionKey)
          };
        })
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((row, index) => ({
      ...row,
      prizeProjection: index === 0 ? "50%" : index === 1 ? "30%" : index === 2 ? "20%" : "-"
    }));
}

function toScore(value?: string | null) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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

function parseEventTimestamp(event: SportsDbEvent) {
  const timestamp = Date.parse(String((event as { strTimestamp?: string | null }).strTimestamp ?? ""));
  if (Number.isFinite(timestamp)) {
    return timestamp;
  }

  if (!event.dateEvent) {
    return null;
  }

  const rawTime = String((event as { strTime?: string | null }).strTime ?? "").trim();
  const normalizedTime = /^\d{2}:\d{2}(:\d{2})?$/.test(rawTime)
    ? rawTime.length === 5
      ? `${rawTime}:00`
      : rawTime
    : "00:00:00";
  const dateTime = Date.parse(`${event.dateEvent}T${normalizedTime}Z`);
  return Number.isFinite(dateTime) ? dateTime : null;
}

type FormulaOneEventPoints = {
  eventId: string;
  timestamp: number | null;
  driverPoints: Map<string, number>;
};

type FootballStage = "round32" | "round16" | "quarter" | "semi" | "final" | "third-place" | null;

async function buildFormulaOneEventPoints(events: SportsDbEvent[]) {
  const raceEvents = sortByDateAsc(events).filter((event) => isFormulaOneRaceEvent(event) && Boolean(event.idEvent));

  return Promise.all(
    raceEvents.map(async (event) => {
      const results = await fetchEventResults(event.idEvent).catch(() => []);
      const driverPoints = new Map<string, number>();

      for (const result of results) {
        const driverCode = result.idPlayer ?? null;
        if (!driverCode) {
          continue;
        }

        const apiPoints = Number(result.intPoints ?? "");
        const fallbackPoints = pointsByRacePosition(Number(result.intPosition ?? ""));
        const candidatePoints = Number.isFinite(apiPoints) ? apiPoints : fallbackPoints;
        const current = driverPoints.get(driverCode) ?? Number.NEGATIVE_INFINITY;
        if (candidatePoints > current) {
          driverPoints.set(driverCode, candidatePoints);
        }
      }

      return {
        eventId: event.idEvent,
        timestamp: parseEventTimestamp(event),
        driverPoints
      } satisfies FormulaOneEventPoints;
    })
  );
}

function calculateFormulaOneEntryTotal(entry: Entry, eventPoints: FormulaOneEventPoints[]) {
  const joinedAtTs = Date.parse(entry.joinedAt ?? "");
  const hasJoinTs = Number.isFinite(joinedAtTs);

  return entry.picks.reduce((total, pick) => {
    const multiplier = getRankMultiplier(pick.rank, "formula-1");

    for (const race of eventPoints) {
      if (hasJoinTs) {
        if (race.timestamp === null || race.timestamp < joinedAtTs) {
          continue;
        }
      }

      total += (race.driverPoints.get(pick.teamCode) ?? 0) * multiplier;
    }

    return total;
  }, 0);
}

function getFootballStageLabel(event: SportsDbEvent): FootballStage {
  const source = `${event.strEvent ?? ""} ${event.strFilename ?? ""}`.toLowerCase();

  if (/(third|3rd).*(place|play[- ]?off)|play[- ]?off.*(third|3rd)/.test(source)) {
    return "third-place";
  }
  if (/semi/.test(source)) {
    return "semi";
  }
  if (/quarter/.test(source)) {
    return "quarter";
  }
  if (/(round of 16|last 16|round-of-16|octavos)/.test(source)) {
    return "round16";
  }
  if (/(round of 32|last 32|round-of-32|16avos|dieciseisavos)/.test(source)) {
    return "round32";
  }
  if (/\bfinal\b/.test(source)) {
    return "final";
  }

  return null;
}

function getFootballStageBonus(stage: FootballStage) {
  switch (stage) {
    case "round32":
      return { label: "Pasa a 16avos", points: 10 };
    case "round16":
      return { label: "Pasa a octavos", points: 15 };
    case "quarter":
      return { label: "Pasa a cuartos", points: 20 };
    case "semi":
      return { label: "Pasa a semifinales", points: 40 };
    case "final":
      return { label: "Pasa a la final", points: 50 };
    default:
      return null;
  }
}

function buildFootballBonusesFromEvents(input: {
  picks: Pick[];
  competitionKey: CompetitionKey;
  events: SportsDbEvent[];
  joinedAtTimestamp: number | null;
  teamMap?: Map<string, Team>;
}) {
  const pickMap = new Map(input.picks.map((pick) => [pick.teamCode, pick]));
  const awarded = new Set<string>();
  const bonuses: BonusScoreBreakdown[] = [];
  const hasJoinTimestamp = input.joinedAtTimestamp !== null;

  for (const event of sortByDateAsc(input.events)) {
    if (hasJoinTimestamp) {
      const eventTimestamp = parseEventTimestamp(event);
      if (eventTimestamp === null || eventTimestamp < input.joinedAtTimestamp!) {
        continue;
      }
    }

    const homeCode = event.idHomeTeam ?? null;
    const awayCode = event.idAwayTeam ?? null;
    const homeScore = toScore(event.intHomeScore);
    const awayScore = toScore(event.intAwayScore);

    if (!homeCode || !awayCode || homeScore === null || awayScore === null) {
      continue;
    }

    const stage = getFootballStageLabel(event);

    const stageBonus = getFootballStageBonus(stage);
    if (stageBonus) {
      for (const teamCode of [homeCode, awayCode]) {
        const pick = pickMap.get(teamCode);
        if (!pick) {
          continue;
        }

        const awardKey = `${teamCode}:${stage}`;
        if (awarded.has(awardKey)) {
          continue;
        }
        awarded.add(awardKey);

        const team = input.teamMap?.get(teamCode);
        const multiplier = getRankMultiplier(pick.rank, input.competitionKey);
        bonuses.push({
          teamCode,
          teamName: team?.name ?? teamCode,
          teamImage: team?.image,
          groupName: team?.groupName,
          groupImage: team?.groupImage,
          rank: pick.rank,
          multiplier,
          label: stageBonus.label,
          basePoints: stageBonus.points,
          weightedPoints: stageBonus.points * multiplier
        });
      }
    }

    if (homeScore === awayScore) {
      continue;
    }

    const winnerCode = homeScore > awayScore ? homeCode : awayCode;
    const winnerPick = pickMap.get(winnerCode);
    if (!winnerPick) {
      continue;
    }

    if (stage === "third-place") {
      const thirdKey = `${winnerCode}:third-place-win`;
      if (!awarded.has(thirdKey)) {
        awarded.add(thirdKey);
        const team = input.teamMap?.get(winnerCode);
        const multiplier = getRankMultiplier(winnerPick.rank, input.competitionKey);
        bonuses.push({
          teamCode: winnerCode,
          teamName: team?.name ?? winnerCode,
          teamImage: team?.image,
          groupName: team?.groupName,
          groupImage: team?.groupImage,
          rank: winnerPick.rank,
          multiplier,
          label: "Gana el 3er puesto",
          basePoints: 15,
          weightedPoints: 15 * multiplier
        });
      }
    }

    if (stage === "final") {
      const championKey = `${winnerCode}:champion`;
      if (!awarded.has(championKey)) {
        awarded.add(championKey);
        const team = input.teamMap?.get(winnerCode);
        const multiplier = getRankMultiplier(winnerPick.rank, input.competitionKey);
        bonuses.push({
          teamCode: winnerCode,
          teamName: team?.name ?? winnerCode,
          teamImage: team?.image,
          groupName: team?.groupName,
          groupImage: team?.groupImage,
          rank: winnerPick.rank,
          multiplier,
          label: "Gana el torneo",
          basePoints: 100,
          weightedPoints: 100 * multiplier
        });
      }
    }
  }

  return bonuses;
}

function calculateFootballEntryTotal(input: {
  entry: Entry;
  competitionKey: CompetitionKey;
  events: SportsDbEvent[];
}) {
  const pickMap = new Map(input.entry.picks.map((pick) => [pick.teamCode, pick]));
  const joinedAtTimestamp = Date.parse(input.entry.joinedAt ?? "");
  const hasJoinTimestamp = Number.isFinite(joinedAtTimestamp);

  const matchWeighted = sortByDateAsc(input.events).reduce((sum, event) => {
    if (hasJoinTimestamp) {
      const eventTimestamp = parseEventTimestamp(event);
      if (eventTimestamp === null || eventTimestamp < joinedAtTimestamp) {
        return sum;
      }
    }

    const homeCode = event.idHomeTeam ?? null;
    const awayCode = event.idAwayTeam ?? null;
    const homeScore = toScore(event.intHomeScore);
    const awayScore = toScore(event.intAwayScore);

    if (!homeCode || !awayCode || homeScore === null || awayScore === null) {
      return sum;
    }

    const sides = [
      { teamCode: homeCode, goalsFor: homeScore, goalsAgainst: awayScore },
      { teamCode: awayCode, goalsFor: awayScore, goalsAgainst: homeScore }
    ] as const;

    let current = sum;
    for (const side of sides) {
      const pick = pickMap.get(side.teamCode);
      if (!pick) {
        continue;
      }
      const resultPoints = side.goalsFor > side.goalsAgainst ? 3 : side.goalsFor === side.goalsAgainst ? 1 : 0;
      const goalsForPoints = side.goalsFor;
      const goalsAgainstPoints = side.goalsAgainst * -0.5;
      const basePoints = resultPoints + goalsForPoints + goalsAgainstPoints;
      const multiplier = getRankMultiplier(pick.rank, input.competitionKey);
      current += basePoints * multiplier;
    }
    return current;
  }, 0);

  const bonuses = buildFootballBonusesFromEvents({
    picks: input.entry.picks,
    competitionKey: input.competitionKey,
    events: input.events,
    joinedAtTimestamp: hasJoinTimestamp ? joinedAtTimestamp : null
  });

  const bonusWeighted = bonuses.reduce((sum, bonus) => sum + bonus.weightedPoints, 0);
  return matchWeighted + bonusWeighted;
}

function getBonusesForTeam(
  progress: TeamProgress,
  baseline: TeamProgress = createEmptyProgressBaseline(progress.competitionKey, progress.teamCode)
) {
  return [
    progress.reachedRoundOf32 && !baseline.reachedRoundOf32 ? { label: "Pasa a 16avos", points: 10 } : null,
    progress.reachedRoundOf16 && !baseline.reachedRoundOf16 ? { label: "Pasa a octavos", points: 15 } : null,
    progress.reachedQuarterFinal && !baseline.reachedQuarterFinal ? { label: "Pasa a cuartos", points: 20 } : null,
    progress.reachedSemiFinal && !baseline.reachedSemiFinal ? { label: "Pasa a semifinales", points: 40 } : null,
    progress.reachedFinal && !baseline.reachedFinal ? { label: "Pasa a la final", points: 50 } : null,
    progress.wonThirdPlace && !baseline.wonThirdPlace ? { label: "Gana el 3er puesto", points: 15 } : null,
    progress.wonWorldCup && !baseline.wonWorldCup ? { label: "Gana el torneo", points: 100 } : null
  ].filter((item): item is { label: string; points: number } => Boolean(item));
}

function sortByDateAsc<T extends { dateEvent?: string | null }>(rows: T[]) {
  return [...rows].sort((a, b) => (a.dateEvent ?? "").localeCompare(b.dateEvent ?? ""));
}

export async function getEntryScoreBreakdown(
  slug: string,
  userId: string
): Promise<EntryScoreBreakdown | null> {
  const decodedUserId = decodeURIComponent(userId);

  return withFallback(async () => {
    const db = await getDb();
    const porra = normalizePorra(await db.collection<Porra>("porras").findOne({ slug }));

    if (!porra) {
      return null;
    }

    const [entry, progress, events, competition] = await Promise.all([
      db.collection<Entry>("entries").findOne({ porraSlug: slug, userId: decodedUserId, paymentStatus: "paid" }),
      db.collection<TeamProgress>("teamProgress").find({ competitionKey: porra.competitionKey }).toArray(),
      db.collection<SportsDbEvent & { competitionKey: CompetitionKey }>("competitionEvents")
        .find({ competitionKey: porra.competitionKey })
        .toArray(),
      getCompetitionCatalogItem(porra.competitionKey)
    ]);

    if (!entry) {
      return null;
    }

    const teamMap = new Map(competition.teams.map((team) => [team.code, team]));
    const pickMap = new Map(entry.picks.map((pick) => [pick.teamCode, pick]));
    const progressMap = new Map(progress.map((item) => [item.teamCode, item]));
    const baselineMap = new Map((entry.progressBaseline ?? []).map((item) => [item.teamCode, item]));
    const joinedAtTimestamp = Date.parse(entry.joinedAt ?? "");
    const hasJoinTimestamp = Number.isFinite(joinedAtTimestamp);

    if (porra.competitionKey === "formula-1") {
      const raceEvents = sortByDateAsc(events).filter((event) => {
        if (!isFormulaOneRaceEvent(event)) {
          return false;
        }

        if (hasJoinTimestamp) {
          const eventTimestamp = parseEventTimestamp(event);
          if (eventTimestamp === null || eventTimestamp < joinedAtTimestamp) {
            return false;
          }
        }

        return Boolean(event.idEvent);
      });

      const eventResults = await Promise.all(
        raceEvents.map(async (event) => ({
          event,
          results: await fetchEventResults(event.idEvent).catch(() => [])
        }))
      );

      const bonuses: BonusScoreBreakdown[] = entry.picks.map((pick) => {
        const team = teamMap.get(pick.teamCode);
        const multiplier = getRankMultiplier(pick.rank, porra.competitionKey);
        const raceDetails = eventResults
          .map(({ event, results }) => {
            const pilotResults = results.filter((result) => result.idPlayer === pick.teamCode);
            if (pilotResults.length === 0) {
              return null;
            }

            const best = pilotResults.reduce((current, candidate) => {
              const currentPoints = Number(current.intPoints ?? "");
              const candidatePoints = Number(candidate.intPoints ?? "");
              const currentFallback = pointsByRacePosition(Number(current.intPosition ?? ""));
              const candidateFallback = pointsByRacePosition(Number(candidate.intPosition ?? ""));
              const currentValue = Number.isFinite(currentPoints) ? currentPoints : currentFallback;
              const candidateValue = Number.isFinite(candidatePoints) ? candidatePoints : candidateFallback;
              return candidateValue > currentValue ? candidate : current;
            });

            const apiPoints = Number(best.intPoints ?? "");
            const position = Number(best.intPosition ?? "");
            const basePoints = Number.isFinite(apiPoints) ? apiPoints : pointsByRacePosition(position);

            return {
              idEvent: event.idEvent,
              eventName: event.strEvent ?? "Grand Prix",
              dateEvent: event.dateEvent ?? "",
              position: Number.isFinite(position) ? position : null,
              basePoints,
              weightedPoints: basePoints * multiplier
            };
          })
          .filter(
            (
              detail
            ): detail is {
              idEvent: string;
              eventName: string;
              dateEvent: string;
              position: number | null;
              basePoints: number;
              weightedPoints: number;
            } => Boolean(detail)
          );

        const basePoints = raceDetails.reduce((sum, detail) => sum + detail.basePoints, 0);

        return {
          teamCode: pick.teamCode,
          teamName: team?.name ?? pick.teamCode,
          teamImage: team?.image,
          groupName: team?.groupName,
          groupImage: team?.groupImage,
          rank: pick.rank,
          multiplier,
          label: "Puntos acumulados en Grand Prix",
          basePoints,
          weightedPoints: basePoints * multiplier,
          raceDetails
        };
      });

      return {
        porraSlug: slug,
        porraName: porra.name,
        competitionKey: porra.competitionKey,
        userId: entry.userId,
        displayName: entry.displayName,
        totalScore: bonuses.reduce((sum, bonus) => sum + bonus.weightedPoints, 0),
        matches: [],
        bonuses
      } satisfies EntryScoreBreakdown;
    }

    const matches: MatchScoreBreakdown[] = [];

    for (const event of sortByDateAsc(events)) {
      if (hasJoinTimestamp) {
        const eventTimestamp = parseEventTimestamp(event);
        if (eventTimestamp === null || eventTimestamp < joinedAtTimestamp) {
          continue;
        }
      }

      const homeCode = event.idHomeTeam ?? null;
      const awayCode = event.idAwayTeam ?? null;
      const homeScore = toScore(event.intHomeScore);
      const awayScore = toScore(event.intAwayScore);

      if (!homeCode || !awayCode || homeScore === null || awayScore === null) {
        continue;
      }

      const sides = [
        { teamCode: homeCode, opponentCode: awayCode, goalsFor: homeScore, goalsAgainst: awayScore },
        { teamCode: awayCode, opponentCode: homeCode, goalsFor: awayScore, goalsAgainst: homeScore }
      ] as const;

      for (const side of sides) {
        const pick = pickMap.get(side.teamCode);
        if (!pick) {
          continue;
        }

        const resultPoints = side.goalsFor > side.goalsAgainst ? 3 : side.goalsFor === side.goalsAgainst ? 1 : 0;
        const goalsForPoints = side.goalsFor;
        const goalsAgainstPoints = side.goalsAgainst * -0.5;
        const basePoints = resultPoints + goalsForPoints + goalsAgainstPoints;
        const multiplier = getRankMultiplier(pick.rank, porra.competitionKey);
        const weightedPoints = basePoints * multiplier;
        const team = teamMap.get(side.teamCode);
        const opponent = teamMap.get(side.opponentCode);

        matches.push({
          idEvent: event.idEvent,
          dateEvent: event.dateEvent ?? "",
          teamCode: side.teamCode,
          teamName: team?.name ?? event.strHomeTeam ?? event.strAwayTeam ?? side.teamCode,
          teamImage: team?.image,
          opponentName: opponent?.name ?? (side.teamCode === homeCode ? event.strAwayTeam : event.strHomeTeam) ?? side.opponentCode,
          opponentImage: opponent?.image,
          rank: pick.rank,
          multiplier,
          goalsFor: side.goalsFor,
          goalsAgainst: side.goalsAgainst,
          resultPoints,
          goalsForPoints,
          goalsAgainstPoints,
          basePoints,
          weightedPoints
        });
      }
    }

    const bonuses = buildFootballBonusesFromEvents({
      picks: entry.picks,
      competitionKey: porra.competitionKey,
      events,
      joinedAtTimestamp: hasJoinTimestamp ? joinedAtTimestamp : null,
      teamMap
    });

    const totalScore =
      matches.reduce((sum, match) => sum + match.weightedPoints, 0) +
      bonuses.reduce((sum, bonus) => sum + bonus.weightedPoints, 0);

    return {
      porraSlug: slug,
      porraName: porra.name,
      competitionKey: porra.competitionKey,
      userId: entry.userId,
      displayName: entry.displayName,
      totalScore,
      matches,
      bonuses
    } satisfies EntryScoreBreakdown;
  }, null);
}

export function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createObjectId() {
  return new ObjectId().toHexString();
}

export function validatePickSet(
  picks: Pick[],
  competitionKey: CompetitionKey,
  teams: Array<{ code: string; groupCode?: string }> = []
) {
  const pickCount = getCompetitionOption(competitionKey).pickCount;
  if (picks.length !== pickCount) {
    throw new Error(`Debes seleccionar exactamente ${pickCount} selecciones.`);
  }

  const distinct = new Set(picks.map((pick) => pick.teamCode));
  if (distinct.size !== pickCount) {
    throw new Error("No puedes repetir equipos.");
  }

  if (competitionKey !== "formula-1") {
    return;
  }

  const teamMap = new Map(teams.map((team) => [team.code, team]));
  const escuderias = picks.map((pick) => teamMap.get(pick.teamCode)?.groupCode).filter(Boolean);
  if (escuderias.length !== pickCount) {
    throw new Error("No se pudo validar la escudería de todos los pilotos seleccionados.");
  }

  if (new Set(escuderias).size !== pickCount) {
    throw new Error("En Formula 1 debes elegir solo un piloto por escudería.");
  }
}

export function getCompetitionLabel(competitionKey: CompetitionKey) {
  return getCompetitionOption(competitionKey).label;
}
