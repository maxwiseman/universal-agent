import { auth } from "@universal-agent/auth";
import { db } from "@universal-agent/db";
import { userSettings } from "@universal-agent/db/schema/chat";
import { eq } from "@universal-agent/db/helpers";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, session.user.id),
  });

  return Response.json(settings ?? { userId: session.user.id, defaultModel: null });
}

export async function PATCH(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: { defaultModel?: string } = await req.json();

  const [updated] = await db
    .insert(userSettings)
    .values({
      userId: session.user.id,
      defaultModel: body.defaultModel ?? null,
    })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { defaultModel: body.defaultModel ?? null },
    })
    .returning();

  return Response.json(updated);
}
