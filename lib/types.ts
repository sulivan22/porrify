export type CompetitionKey = "world-cup" | "champions-league" | "la-liga" | "premier-league" | "formula-1";

export type CompetitionOption = {
  key: CompetitionKey;
  label: string;
  subtitle: string;
  description: string;
  teamLabel: string;
  pickCount: number;
};

export type Team = {
  code: string;
  name: string;
  image?: string;
  region: string;
  competitionKey: CompetitionKey;
  groupCode?: string;
  groupName?: string;
  groupImage?: string;
};

export type TeamProgress = {
  competitionKey: CompetitionKey;
  teamCode: string;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  reachedRoundOf32: boolean;
  reachedRoundOf16: boolean;
  reachedQuarterFinal: boolean;
  reachedSemiFinal: boolean;
  reachedFinal: boolean;
  wonThirdPlace: boolean;
  wonWorldCup: boolean;
  baseScore?: number;
};

export type Pick = {
  rank: number;
  teamCode: string;
};

export type Porra = {
  slug: string;
  name: string;
  ownerId: string;
  competitionKey: CompetitionKey;
  entryFeeCents: number;
  participantCount: number;
  status: "draft" | "active" | "closed";
  createdAt: string;
};

export type Entry = {
  porraSlug: string;
  userId: string;
  displayName: string;
  competitionKey: CompetitionKey;
  paymentStatus: "pending" | "paid";
  stripeSessionId: string;
  picks: Pick[];
  totalScore: number;
  joinedAt?: string;
  progressBaseline?: TeamProgress[];
};

export type Payment = {
  stripeSessionId: string;
  userId: string;
  mode: "create" | "join";
  competitionKey: CompetitionKey;
  porraSlug?: string;
  amountTotal: number;
  currency: string;
  checkoutStatus: "open" | "complete" | "expired";
  paymentStatus: "pending" | "paid" | "failed";
  customerEmail?: string;
  createdAt: string;
  paidAt?: string;
  entryReference?: string;
  consumedAt?: string;
};

export type SyncLog = {
  source: string;
  leagueId: string;
  season: string;
  competitionKey: CompetitionKey;
  eventCount: number;
  updatedEntries: number;
  syncedAt: string;
};

export type LeaderboardRow = {
  userId: string;
  displayName: string;
  totalScore: number;
  prizeProjection: string;
  picks: Array<Pick & { team: Team; weightedScore: number }>;
};

export type MatchScoreBreakdown = {
  idEvent: string;
  dateEvent: string;
  teamCode: string;
  teamName: string;
  teamImage?: string;
  opponentName: string;
  opponentImage?: string;
  rank: number;
  multiplier: number;
  goalsFor: number;
  goalsAgainst: number;
  resultPoints: number;
  goalsForPoints: number;
  goalsAgainstPoints: number;
  basePoints: number;
  weightedPoints: number;
};

export type BonusScoreBreakdown = {
  teamCode: string;
  teamName: string;
  teamImage?: string;
  groupName?: string;
  groupImage?: string;
  rank: number;
  multiplier: number;
  label: string;
  basePoints: number;
  weightedPoints: number;
  raceDetails?: Array<{
    idEvent: string;
    eventName: string;
    dateEvent: string;
    position: number | null;
    basePoints: number;
    weightedPoints: number;
  }>;
};

export type EntryScoreBreakdown = {
  porraSlug: string;
  porraName: string;
  competitionKey: CompetitionKey;
  userId: string;
  displayName: string;
  totalScore: number;
  matches: MatchScoreBreakdown[];
  bonuses: BonusScoreBreakdown[];
};
