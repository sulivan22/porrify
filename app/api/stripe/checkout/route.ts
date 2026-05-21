import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { createPayment, getPorraBySlug, normalizeSlug } from "@/lib/repositories";
import { getStripe } from "@/lib/stripe";
const payloadSchema = z.object({
  mode: z.enum(["create", "join"]),
  porraSlug: z.string().optional(),
  competitionKey: z.enum(["world-cup"]).optional(),
  amountCents: z.number().int().min(100).max(1000000).optional()
});

export async function POST(request: Request) {
  const sessionUser = await auth();
  const body = payloadSchema.parse(await request.json());
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const userId = sessionUser?.user?.email;
  const userEmail = sessionUser?.user?.email;

  if (!userId || !userEmail) {
    return NextResponse.json({ error: "Debes iniciar sesión antes de pagar." }, { status: 401 });
  }

  if (!appUrl) {
    return NextResponse.json(
      {
        error: "Falta NEXT_PUBLIC_APP_URL."
      },
      { status: 500 }
    );
  }

  let amountTotal = 0;
  let porraSlug = body.porraSlug ? normalizeSlug(body.porraSlug) : undefined;
  let competitionKey = body.competitionKey;

  if (body.mode === "create") {
    if (!body.amountCents || !competitionKey) {
      return NextResponse.json({ error: "Faltan importe o competición." }, { status: 400 });
    }
    amountTotal = body.amountCents;
  } else {
    if (!porraSlug) {
      return NextResponse.json({ error: "Debes indicar el nombre único de la porra." }, { status: 400 });
    }
    const porra = await getPorraBySlug(porraSlug);
    if (!porra) {
      return NextResponse.json({ error: "La porra indicada no existe." }, { status: 404 });
    }
    if (porra.ownerId === userId) {
      return NextResponse.json({ error: "No puedes unirte a una porra que has creado." }, { status: 400 });
    }
    amountTotal = porra.entryFeeCents;
    if (porra.competitionKey !== "world-cup") {
      return NextResponse.json({ error: "Solo está habilitado el Mundial en este momento." }, { status: 400 });
    }
    competitionKey = "world-cup";
  }

  if (!competitionKey) {
    return NextResponse.json({ error: "No se pudo determinar la competición." }, { status: 400 });
  }

  const amountEuro = (amountTotal / 100).toFixed(2);
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: userEmail,
    success_url:
      body.mode === "create"
        ? `${appUrl}/porras/new?competition=${competitionKey}&checkout=success&session_id={CHECKOUT_SESSION_ID}`
        : `${appUrl}/porras/join?slug=${encodeURIComponent(porraSlug ?? "")}&checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/dashboard?checkout=cancelled`,
    metadata: {
      userId,
      mode: body.mode,
      competitionKey,
      porraSlug: porraSlug ?? ""
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          product_data: {
            name: body.mode === "create" ? "Creación de porra" : "Entrada a porra",
            description: `Acceso a porra (${amountEuro}€)`
          },
          unit_amount: amountTotal
        }
      }
    ]
  });

  await createPayment({
    stripeSessionId: session.id,
    userId,
    mode: body.mode,
    competitionKey,
    porraSlug,
    amountTotal,
    currency: "eur",
    checkoutStatus: "open",
    paymentStatus: "pending",
    customerEmail: userEmail,
    createdAt: new Date().toISOString()
  });

  return NextResponse.json({ url: session.url });
}
