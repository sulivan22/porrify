import { cache } from "react";

import { competitionOptions, competitionTeamMap, getCompetitionOption } from "@/lib/data";
import {
  competitionApiConfig,
  fetchCompetitionSeasonEvents,
  fetchLeagueDetails,
  fetchLeagueTeams,
  fetchTeamPlayers
} from "@/lib/sportsdb";
import { CompetitionKey, CompetitionOption, Team } from "@/lib/types";

type CompetitionCatalogItem = CompetitionOption & {
  logo?: string;
  leagueId: string;
  season: string;
  teams: Team[];
};

const excludedFormulaOneDriverNames = new Set(["zhou guanyu"]);

function shouldSkipExternalFetch() {
  return process.env.SKIP_DB_DURING_BUILD === "1";
}

function getApiKey() {
  return process.env.THESPORTSDB_API_KEY || "123";
}

function getBaseUrl() {
  return `https://www.thesportsdb.com/api/v1/json/${getApiKey()}`;
}

function mapFallbackCompetition(competitionKey: CompetitionKey): CompetitionCatalogItem {
  const option = getCompetitionOption(competitionKey);
  const apiConfig = competitionApiConfig[competitionKey];

  return {
    ...option,
    leagueId: apiConfig.leagueId,
    season: apiConfig.season,
    teams: competitionTeamMap[competitionKey]
  };
}

async function fetchCompetitionCatalogItem(competitionKey: CompetitionKey): Promise<CompetitionCatalogItem> {
  if (shouldSkipExternalFetch()) {
    return mapFallbackCompetition(competitionKey);
  }

  const option = getCompetitionOption(competitionKey);
  const apiConfig = competitionApiConfig[competitionKey];

  try {
    if (competitionKey === "formula-1") {
      const [league, raceTeams] = await Promise.all([fetchLeagueDetails(competitionKey), fetchLeagueTeams(competitionKey)]);

      const driversByTeam = await Promise.all(
        raceTeams.map(async (team) => ({
          team,
          players: await fetchTeamPlayers(team.idTeam)
        }))
      );

      const teams = driversByTeam
        .flatMap(({ team, players }) =>
          players
            .filter((player) => {
              const normalizedName = (player.strPlayer ?? "").trim().toLowerCase();
              if (excludedFormulaOneDriverNames.has(normalizedName)) {
                return false;
              }

              const position = (player.strPosition ?? "").toLowerCase();
              return !position || position.includes("driver");
            })
            .map((player) => ({
              code: player.idPlayer,
              name: player.strPlayer ?? "Piloto",
              image: player.strThumb ?? player.strCutout ?? player.strRender ?? undefined,
              region: option.label,
              competitionKey,
              groupCode: team.idTeam,
              groupName: team.strTeam ?? undefined,
              groupImage: team.strBadge ?? undefined
            }))
        )
        .sort((a, b) => a.name.localeCompare(b.name, "es"));

      return {
        ...option,
        label: league?.strLeague ?? option.label,
        logo: league?.strBadge ?? undefined,
        leagueId: apiConfig.leagueId,
        season: apiConfig.season,
        teams: teams.length > 0 ? teams : competitionTeamMap[competitionKey]
      };
    }

    const [league, leagueTeams, events] = await Promise.all([
      fetchLeagueDetails(competitionKey),
      fetchLeagueTeams(competitionKey),
      fetchCompetitionSeasonEvents(competitionKey)
    ]);

    const teamMap = new Map<string, Team>();
    for (const team of leagueTeams) {
      if (!team.idTeam || !team.strTeam) {
        continue;
      }

      teamMap.set(team.idTeam, {
        code: team.idTeam,
        name: team.strTeam,
        image: team.strBadge ?? undefined,
        region: option.label,
        competitionKey
      });
    }

    for (const event of events) {
      if (event.idHomeTeam && event.strHomeTeam) {
        teamMap.set(event.idHomeTeam, {
          code: event.idHomeTeam,
          name: event.strHomeTeam,
          image: event.strHomeTeamBadge ?? undefined,
          region: option.label,
          competitionKey
        });
      }

      if (event.idAwayTeam && event.strAwayTeam) {
        teamMap.set(event.idAwayTeam, {
          code: event.idAwayTeam,
          name: event.strAwayTeam,
          image: event.strAwayTeamBadge ?? undefined,
          region: option.label,
          competitionKey
        });
      }
    }

    const teams = Array.from(teamMap.values()).sort((a, b) => a.name.localeCompare(b.name, "es"));

    return {
      ...option,
      label: league?.strLeague ?? option.label,
      logo: league?.strBadge ?? undefined,
      leagueId: apiConfig.leagueId,
      season: apiConfig.season,
      teams: teams.length > 0 ? teams : competitionTeamMap[competitionKey]
    };
  } catch {
    return mapFallbackCompetition(competitionKey);
  }
}

export const getCompetitionCatalogItem = cache(fetchCompetitionCatalogItem);

export const getCompetitionCatalog = cache(async () => {
  return Promise.all(competitionOptions.map((option) => getCompetitionCatalogItem(option.key)));
});
