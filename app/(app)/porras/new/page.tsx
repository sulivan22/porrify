import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CompetitionPicker } from "@/components/competition-picker";
import { CreatePorraPaymentStep } from "@/components/create-porra-payment-step";
import { PickWizard } from "@/components/pick-wizard";
import { getCompetitionCatalogItem } from "@/lib/competition-catalog";
import { CompetitionKey } from "@/lib/types";

export default async function NewPorraPage({
  searchParams
}: {
  searchParams: Promise<{ competition?: CompetitionKey; session_id?: string; checkout?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  const params = await searchParams;
  const competitionKey = params.competition;
  const hasReturnedFromCheckout = Boolean(params.session_id);

  if (competitionKey !== "world-cup") {
    return <CompetitionPicker basePath="/porras/new" title="¿Para qué competición quieres crear la porra?" />;
  }

  const competition = await getCompetitionCatalogItem(competitionKey);
  const teams = competition.teams;

  return (
    <div className="page-stack">
      {!hasReturnedFromCheckout ? (
        <section className="card flow-card">
          <div className="section-heading">
            <span className="eyebrow">Paso 1</span>
            <h1>Crea una porra de {competition.label}</h1>
          </div>
          <p>
            Define el importe de entrada, realiza el pago y después completa tu selección de {competition.pickCount}{" "}
            {competition.teamLabel}.
          </p>
          <CreatePorraPaymentStep competitionKey={competitionKey} />
        </section>
      ) : null}

      <PickWizard teams={teams} mode="create" competitionKey={competitionKey} />
    </div>
  );
}
