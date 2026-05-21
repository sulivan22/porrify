import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import {
  consumePayment,
  createPorra,
  getPaymentBySessionId,
  getPorraBySlug,
  markPaymentPaid,
  normalizeSlug,
  upsertEntry,
  validatePickSet
} from "@/lib/repositories";
import { getCompetitionCatalogItem } from "@/lib/competition-catalog";
import { getStripe } from "@/lib/stripe";

const pickSchema = z.object({
  rank: z.number().min(1).max(15),
  teamCode: z.string().min(2)
});

const payloadSchema = z.object({
  mode: z.enum(["create", "join"]),
  displayName: z.string().min(2),
  porraSlug: z.string().min(3),
  porraName: z.string().optional(),
  competitionKey: z.enum(["world-cup"]),
  stripeSessionId: z.string().min(3),
  picks: z.array(pickSchema).min(15).max(15)
});

export async function POST(request: Request) {
  const session = await auth();
  const body = payloadSchema.parse(await request.json());
  const userId = session?.user?.email;
  const porraSlug = normalizeSlug(body.porraSlug);

  if (!userId) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  try {
    const competitionCatalog = await getCompetitionCatalogItem(body.competitionKey);
    validatePickSet(body.picks, body.competitionKey, competitionCatalog.teams);
    const payment = await getPaymentBySessionId(body.stripeSessionId);

    if (!payment) {
      throw new Error("No se encontró el pago asociado.");
    }

    if (payment.userId !== userId) {
      throw new Error("Ese pago no pertenece al usuario actual.");
    }

    if (payment.competitionKey !== body.competitionKey) {
      throw new Error("Ese pago pertenece a otra competición.");
    }

    if (payment.mode !== body.mode) {
      throw new Error("Ese pago pertenece a otro flujo.");
    }

    const entryReference = `${userId}:${porraSlug}`;
    if (payment.entryReference && payment.entryReference !== entryReference) {
      throw new Error("Ese pago ya fue utilizado en otra porra.");
    }

    if (body.mode === "join" && payment.porraSlug && normalizeSlug(payment.porraSlug) !== porraSlug) {
      throw new Error("Ese pago pertenece a otra porra.");
    }

    if (payment.paymentStatus !== "paid") {
      const stripe = getStripe();
      const stripeSession = await stripe.checkout.sessions.retrieve(body.stripeSessionId);

      if (stripeSession.payment_status !== "paid") {
        throw new Error("El pago todavía no está confirmado.");
      }

      await markPaymentPaid({
        stripeSessionId: stripeSession.id,
        amountTotal: stripeSession.amount_total ?? payment.amountTotal,
        currency: stripeSession.currency ?? payment.currency,
        customerEmail: stripeSession.customer_email ?? payment.customerEmail
      });
    }

    if (body.mode === "create") {
      await createPorra({
        ownerId: userId,
        name: body.porraName ?? porraSlug,
        slug: porraSlug,
        competitionKey: body.competitionKey,
        entryFeeCents: payment.amountTotal
      });
    } else {
      const porra = await getPorraBySlug(porraSlug);
      if (!porra) {
        throw new Error("La porra indicada no existe.");
      }
      if (porra.ownerId === userId) {
        throw new Error("No puedes unirte a una porra que has creado.");
      }
      if (porra.competitionKey !== body.competitionKey) {
        throw new Error("La porra indicada pertenece a otra competición.");
      }
      if (porra.entryFeeCents !== payment.amountTotal) {
        throw new Error("El pago no coincide con el importe de acceso de la porra.");
      }
    }

    await upsertEntry({
      porraSlug,
      userId,
      displayName: body.displayName,
      competitionKey: body.competitionKey,
      paymentStatus: "paid",
      stripeSessionId: body.stripeSessionId,
      picks: body.picks
    });

    await consumePayment({
      stripeSessionId: body.stripeSessionId,
      porraSlug,
      userId
    });

    return NextResponse.json({
      message: body.mode === "create" ? "Porra creada y selección guardada." : "Solicitud de unión guardada."
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "No se pudo guardar la porra."
      },
      { status: 400 }
    );
  }
}
