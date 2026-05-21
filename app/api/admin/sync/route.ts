import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { syncCompetitionData } from "@/lib/competition-sync";
import { getUserRoleByEmail } from "@/lib/repositories";
const payloadSchema = z.object({
  competitionKey: z.enum(["world-cup"])
});

export async function POST(request: Request) {
  const session = await auth();
  const role = await getUserRoleByEmail(session?.user?.email);

  if (!session?.user || role !== "admin") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  try {
    const body = payloadSchema.parse(await request.json());
    const result = await syncCompetitionData(body.competitionKey);
    return NextResponse.json({
      message: "Sincronización completada.",
      ...result
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "No se pudo completar la sincronización."
      },
      { status: 500 }
    );
  }
}
