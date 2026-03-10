import { auth } from "@universal-agent/auth";
import { db } from "@universal-agent/db";
import { conversation } from "@universal-agent/db/schema/chat";
import { eq, desc } from "@universal-agent/db/helpers";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return Response.json([], { status: 401 });
  }

  const conversations = await db.query.conversation.findMany({
    where: eq(conversation.userId, session.user.id),
    orderBy: [desc(conversation.updatedAt)],
    columns: {
      id: true,
      title: true,
      model: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return Response.json(conversations);
}
