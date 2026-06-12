import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { InviteFriendButton } from "@/components/invite-friend-button";
import { TeamAvatar } from "@/components/team-avatar";

import { LeaderboardTable } from "@/components/leaderboard-table";
import { getCompetitionCatalogItem } from "@/lib/competition-catalog";
import { payoutRules } from "@/lib/data";
import { getCompetitionLabel, getLeaderboard, getPorraBySlug, getUserEntries } from "@/lib/repositories";
import { Team } from "@/lib/types";

export default async function PorraDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const porra = await getPorraBySlug(slug);

  if (!porra) {
    notFound();
  }

  const leaderboard = await getLeaderboard(slug);
  const competition = await getCompetitionCatalogItem(porra.competitionKey);
  const userEntries = session?.user?.email ? await getUserEntries(session.user.email) : [];
  const userEntry = userEntries.find((entry) => entry.porraSlug === slug && entry.paymentStatus === "paid");
  const teamsByCode = new Map(competition.teams.map((team) => [team.code, team]));
  const userSelection =
    userEntry?.picks
      .slice()
      .sort((a, b) => a.rank - b.rank)
      .map((pick) => ({
        rank: pick.rank,
        team:
          teamsByCode.get(pick.teamCode) ??
          ({
            code: pick.teamCode,
            name: pick.teamCode,
            region: getCompetitionLabel(porra.competitionKey),
            competitionKey: porra.competitionKey
          } satisfies Team)
      })) ?? [];
  const totalCollected = (porra.participantCount * porra.entryFeeCents) / 100;
  const platformFee = totalCollected * 0.1;
  const prizePool = totalCollected * 0.9;

  return (
    <div className="page-stack">
      <section className="card">
        <div className="detail-header">
          <div>
            <span className="eyebrow">Porra</span>
            <h1>{porra.name}</h1>
          </div>
          {session?.user ? (
            <div className="detail-actions">
              {userSelection.length > 0 ? (
                <details className="my-selection-panel">
                  <summary className="ghost-button selection-button">Tu selección</summary>
                  <div className="my-selection-content">
                    <strong>Orden de tu selección</strong>
                    <div className="my-selection-list">
                      {userSelection.map((item) => (
                        <div className="my-selection-row" key={`${item.rank}-${item.team.code}`}>
                          <span className="rank-pill">#{item.rank}</span>
                          <span className="score-line-team">
                            <TeamAvatar team={item.team} />
                            <span>{item.team.name}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
              ) : null}
              <InviteFriendButton
                slug={porra.slug}
                porraName={porra.name}
                competitionLabel={getCompetitionLabel(porra.competitionKey)}
              />
            </div>
          ) : null}
        </div>
        <p className="porra-detail-meta">
          {competition.logo ? (
            <img
              className={`competition-inline-logo ${
                porra.competitionKey === "champions-league" ? "competition-badge-dark" : ""
              }`}
              src={competition.logo}
              alt={`Logo ${getCompetitionLabel(porra.competitionKey)}`}
              width="50"
              height="50"
            />
          ) : null}
          <span>
            {getCompetitionLabel(porra.competitionKey)} · {porra.participantCount} participantes. Bote estimado:{" "}
            {prizePool.toFixed(2)}€.
          </span>
        </p>
        <p className="helper-text">
          Recaudado: {totalCollected.toFixed(2)}€ · Plataforma (10%): {platformFee.toFixed(2)}€ · Premio (90%):{" "}
          {prizePool.toFixed(2)}€
        </p>
        <div className="stat-grid">
          {payoutRules.map((rule) => (
            <article className="stat-card" key={rule.place}>
              <span>{rule.label}</span>
              <strong>{((prizePool * rule.percentage) / 100).toFixed(2)}€</strong>
            </article>
          ))}
        </div>
      </section>

      <LeaderboardTable rows={leaderboard} porraSlug={slug} />
    </div>
  );
}
