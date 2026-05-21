import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { getRecoverablePaymentByUserAndCompetition } from "@/lib/repositories";

const querySchema = z.object({
  mode: z.enum(["create", "join"]),
  competitionKey: z.enum(["world-cup"]),
  porraSlug: z.string().optional()
});

export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.email;

  if (!userId) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = querySchema.parse({
    mode: searchParams.get("mode"),
    competitionKey: searchParams.get("competitionKey"),
    porraSlug: searchParams.get("porraSlug") ?? undefined
  });

  const payment = await getRecoverablePaymentByUserAndCompetition({
    userId,
    mode: query.mode,
    competitionKey: query.competitionKey,
    porraSlug: query.porraSlug
  });

  if (!payment) {
    return NextResponse.json({ error: "No hay ningún pago recuperable." }, { status: 404 });
  }

  return NextResponse.json(payment);
}
