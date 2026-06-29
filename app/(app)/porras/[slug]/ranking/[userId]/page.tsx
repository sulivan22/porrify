import Link from "next/link";
import { notFound } from "next/navigation";

import { TeamAvatar } from "@/components/team-avatar";
import { getEntryScoreBreakdown } from "@/lib/repositories";
import { Team } from "@/lib/types";

export default async function EntryRankingDetailPage({
  params
}: {
  params: Promise<{ slug: string; userId: string }>;
}) {
  const { slug, userId } = await params;
  const breakdown = await getEntryScoreBreakdown(slug, userId);

  if (!breakdown) {
    notFound();
  }

  const isFormulaOne = breakdown.competitionKey === "formula-1";
  const hideBonuses =
    breakdown.competitionKey === "la-liga" || breakdown.competitionKey === "premier-league";
  const showMatches = !isFormulaOne;
  const showBonuses = !hideBonuses;

  return (
    <div className="page-stack">
      <section className="card">
        <span className="eyebrow">Desglose</span>
        <h1>{breakdown.displayName}</h1>
        <p>
          {breakdown.porraName} · Total: {breakdown.totalScore.toFixed(1)} pts
        </p>
        <div className="cta-row">
          <Link href={`/porras/${breakdown.porraSlug}`} className="ghost-button">
            Volver al ranking
          </Link>
          <details className="my-selection-panel">
            <summary className="ghost-button selection-button">Equipos</summary>
            <div className="my-selection-content">
              <strong>Selección de {breakdown.displayName}</strong>
              <div className="my-selection-list">
                {breakdown.selections.map((selection) => (
                  <div className="my-selection-row" key={`${selection.rank}-${selection.team.code}`}>
                    <span className="rank-pill">#{selection.rank}</span>
                    <span className="score-line-team">
                      <TeamAvatar team={selection.team} />
                      <span>{selection.team.name}</span>
                    </span>
                    <span className="selection-multiplier">x{selection.multiplier}</span>
                  </div>
                ))}
              </div>
            </div>
          </details>
          <details className="my-selection-panel">
            <summary className="ghost-button selection-button">Sistema de puntos</summary>
            <div className="my-selection-content">
              <strong>Reglas de puntuacion</strong>
              <div className="score-rules-list">
                <p>Seleccionas 15 paises y cada puesto multiplica sus puntos: del #1 x15 al #15 x1.</p>
                <p>Partido ganado +3, empate +1, derrota 0. Cada gol a favor +1 y cada gol en contra -0.5.</p>
                <p>Bonos: 16avos +10, octavos +15, cuartos +20, semifinales +40, final +50, subcampeon +50, 3er puesto +15 y campeon +100.</p>
              </div>
            </div>
          </details>
        </div>
      </section>

      {showMatches ? (
        <section className="card">
          <div className="section-heading">
            <span className="eyebrow">Partidos</span>
            <h2>Puntos obtenidos por partido</h2>
          </div>
          <div className="score-breakdown-list">
            {breakdown.matches.length > 0 ? (
              breakdown.matches.map((match) => (
                <article className="score-breakdown-row" key={`${match.idEvent}-${match.teamCode}-${match.rank}`}>
                  <div>
                    <strong className="score-line-teams">
                      <span className="score-line-team">
                        <TeamAvatar
                          team={
                            {
                              code: match.teamCode,
                              name: match.teamName,
                              image: match.teamImage,
                              region: breakdown.competitionKey,
                              competitionKey: breakdown.competitionKey
                            } satisfies Team
                          }
                        />
                        <span>{match.teamName}</span>
                      </span>
                      <span>
                        {match.goalsFor}-{match.goalsAgainst}
                      </span>
                      <span className="score-line-team">
                        <TeamAvatar
                          team={
                            {
                              code: `${match.idEvent}-${match.opponentName}`,
                              name: match.opponentName,
                              image: match.opponentImage,
                              region: breakdown.competitionKey,
                              competitionKey: breakdown.competitionKey
                            } satisfies Team
                          }
                        />
                        <span>{match.opponentName}</span>
                      </span>
                    </strong>
                    <p>
                      {match.dateEvent || "Sin fecha"} · Puesto #{match.rank} · x{match.multiplier}
                    </p>
                    <p>
                      Resultado: {match.resultPoints.toFixed(1)} · Goles a favor: {match.goalsForPoints.toFixed(1)} ·
                      Goles en contra: {match.goalsAgainstPoints.toFixed(1)}
                    </p>
                  </div>
                  <strong>{match.weightedPoints.toFixed(1)} pts</strong>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <strong>Aún no hay partidos puntuables.</strong>
                <p>Cuando haya resultados con marcador oficial, aparecerán aquí.</p>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {showBonuses ? (
        <section className="card">
          <div className="section-heading">
            <span className="eyebrow">{isFormulaOne ? "Pilotos" : "Bonos"}</span>
            <h2>{isFormulaOne ? "Puntos Pilotos" : "Puntos por fases y títulos"}</h2>
          </div>
          <div className="score-breakdown-list">
            {breakdown.bonuses.length > 0 ? (
              breakdown.bonuses.map((bonus, index) => (
                <article className="score-breakdown-row" key={`${bonus.teamCode}-${bonus.label}-${index}`}>
                  <div>
                    <strong className="score-line-team">
                      {breakdown.competitionKey === "formula-1" && bonus.groupImage ? (
                        <img className="constructor-badge" src={bonus.groupImage} alt="" width="26" height="26" />
                      ) : null}
                      <span>{bonus.teamName}</span>
                      <TeamAvatar
                        team={
                          {
                            code: bonus.teamCode,
                            name: bonus.teamName,
                            image: bonus.teamImage,
                            region: breakdown.competitionKey,
                            competitionKey: breakdown.competitionKey
                          } satisfies Team
                        }
                      />
                    </strong>
                    <p>
                      {isFormulaOne ? `Puesto #${bonus.rank} · x${bonus.multiplier}` : `${bonus.label} · Puesto #${bonus.rank} · x${bonus.multiplier}`}
                    </p>
                    <p>Base: {bonus.basePoints.toFixed(1)} pts</p>
                    {isFormulaOne && bonus.raceDetails && bonus.raceDetails.length > 0 ? (
                      <details className="pilot-race-panel">
                        <summary className="pilot-race-toggle">Ver resumen por carreras</summary>
                        <div className="pilot-race-list">
                          {bonus.raceDetails.map((race) => (
                            <div className="pilot-race-row" key={`${bonus.teamCode}-${race.idEvent}`}>
                              <span>
                                {race.eventName} {race.dateEvent ? `(${race.dateEvent})` : ""}
                              </span>
                              <span>
                                Pos: {race.position ?? "-"} · Base: {race.basePoints.toFixed(1)} · x
                                {bonus.multiplier} = {race.weightedPoints.toFixed(1)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </details>
                    ) : null}
                  </div>
                  <strong>{bonus.weightedPoints.toFixed(1)} pts</strong>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <strong>{isFormulaOne ? "Sin puntos de pilotos registrados." : "Sin bonos registrados."}</strong>
                <p>
                  {isFormulaOne
                    ? "Los puntos aparecerán cuando haya resultados oficiales de Grand Prix."
                    : "Los bonos aparecen cuando se alcanzan fases o títulos según el reglamento."}
                </p>
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
