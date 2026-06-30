import { CompetitionKey } from "@/lib/types";

type SportsDbResponse<T> = {
  schedule?: T[] | null;
  lookup?: T[] | null;
  list?: T[] | null;
};

export type SportsDbEvent = {
  idEvent: string;
  idHomeTeam?: string | null;
  idAwayTeam?: string | null;
  strEvent?: string | null;
  strFilename?: string | null;
  dateEvent?: string | null;
  strHomeTeam?: string | null;
  strAwayTeam?: string | null;
  strHomeTeamBadge?: string | null;
  strAwayTeamBadge?: string | null;
  intHomeScore?: string | null;
  intAwayScore?: string | null;
  strStatus?: string | null;
};

export type SportsDbTeam = {
  idTeam: string;
  strTeam?: string | null;
  strBadge?: string | null;
};

export type SportsDbPlayer = {
  idPlayer: string;
  strPlayer?: string | null;
  idTeam?: string | null;
  strTeam?: string | null;
  strPosition?: string | null;
  strThumb?: string | null;
  strCutout?: string | null;
  strRender?: string | null;
};

export type SportsDbEventResult = {
  idEvent?: string | null;
  idPlayer?: string | null;
  idTeam?: string | null;
  strPlayer?: string | null;
  strEvent?: string | null;
  dateEvent?: string | null;
  intPosition?: string | null;
  intPoints?: string | null;
};

export type SportsDbLeague = {
  idLeague?: string;
  strLeague?: string | null;
  strBadge?: string | null;
  strCurrentSeason?: string | null;
};

export const competitionApiConfig: Record<
  CompetitionKey,
  { leagueId: string; season: string; seasonStart: string; seasonEnd: string; leagueName: string }
> = {
  "world-cup": {
    leagueId: "4429",
    season: "2026",
    seasonStart: "2026-06-11",
    seasonEnd: "2026-07-19",
    leagueName: "FIFA World Cup"
  },
  "la-liga": {
    leagueId: "4335",
    season: "2025-2026",
    seasonStart: "2025-08-15",
    seasonEnd: "2026-05-24",
    leagueName: "Spanish La Liga"
  },
  "champions-league": {
    leagueId: "4480",
    season: "2025-2026",
    seasonStart: "2025-09-01",
    seasonEnd: "2026-06-15",
    leagueName: "UEFA Champions League"
  },
  "premier-league": {
    leagueId: "4328",
    season: "2025-2026",
    seasonStart: "2025-08-15",
    seasonEnd: "2026-05-31",
    leagueName: "English Premier League"
  },
  "formula-1": {
    leagueId: "4370",
    season: "2026",
    seasonStart: "2026-01-01",
    seasonEnd: "2026-12-31",
    leagueName: "Formula 1"
  }
};

function getApiKey() {
  return process.env.THESPORTSDB_API_KEY || "";
}

function getBaseUrl() {
  return "https://www.thesportsdb.com/api/v2/json";
}

async function fetchSportsDb<T>(path: string) {
  const apiKey = getApiKey();
  const response = await fetch(`${getBaseUrl()}${path}`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(apiKey ? { "X-API-KEY": apiKey } : {})
    }
  });

  if (!response.ok) {
    throw new Error(`TheSportsDB respondió con ${response.status}`);
  }

  return (await response.json()) as SportsDbResponse<T>;
}

export async function fetchCompetitionSeasonEvents(competitionKey: CompetitionKey) {
  const config = competitionApiConfig[competitionKey];
  const payload = await fetchSportsDb<SportsDbEvent>(`/schedule/league/${config.leagueId}/${config.season}`);
  const events = payload.schedule ?? [];

  return events.filter((event) => {
    if (!event.dateEvent) {
      return false;
    }

    return event.dateEvent >= config.seasonStart && event.dateEvent <= config.seasonEnd;
  });
}

export async function fetchLeagueDetails(competitionKey: CompetitionKey) {
  const config = competitionApiConfig[competitionKey];
  const payload = await fetchSportsDb<SportsDbLeague>(`/lookup/league/${config.leagueId}`);
  return payload.lookup?.[0] ?? null;
}

export async function fetchLeagueTeams(competitionKey: CompetitionKey) {
  const config = competitionApiConfig[competitionKey];
  const payload = await fetchSportsDb<SportsDbTeam>(`/list/teams/${config.leagueId}`);
  return payload.list ?? [];
}

export async function fetchTeamPlayers(teamId: string) {
  const payload = await fetchSportsDb<SportsDbPlayer>(`/list/players/${teamId}`);
  return payload.list ?? [];
}

export async function fetchEventResults(eventId: string) {
  const payload = await fetchSportsDb<SportsDbEventResult>(`/lookup/event_results/${eventId}`);
  return payload.lookup ?? [];
}
