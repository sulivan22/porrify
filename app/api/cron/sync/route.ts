import { NextResponse } from "next/server";

import { syncCompetitionData } from "@/lib/competition-sync";
import { CompetitionKey } from "@/lib/types";

const competitions: CompetitionKey[] = ["world-cup"];

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const startedAt = Date.now();
  const summary: Array<{
    competitionKey: CompetitionKey;
    ok: boolean;
    eventsProcessed?: number;
    updatedEntries?: number;
    trackedTeams?: number;
    error?: string;
  }> = [];

  for (const competitionKey of competitions) {
    try {
      const result = await syncCompetitionData(competitionKey);
      summary.push({
        competitionKey,
        ok: true,
        eventsProcessed: result.eventsProcessed,
        updatedEntries: result.updatedEntries,
        trackedTeams: result.trackedTeams
      });
    } catch (error) {
      summary.push({
        competitionKey,
        ok: false,
        error: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  }

  return NextResponse.json({
    message: "Sincronización programada completada.",
    durationMs: Date.now() - startedAt,
    summary
  });
}
