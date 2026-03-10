import { auth } from "@universal-agent/auth";
import { db } from "@universal-agent/db";
import { conversation, message } from "@universal-agent/db/schema/chat";
import { eq, asc } from "@universal-agent/db/helpers";
import { headers } from "next/headers";

async function getSessionUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user ?? null;
}

async function getConversation(id: string, userId: string) {
  const conv = await db.query.conversation.findFirst({
    where: eq(conversation.id, id),
  });
  if (!conv || conv.userId !== userId) return null;
  return conv;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const conv = await getConversation(id, user.id);
  if (!conv) return Response.json({ error: "Not found" }, { status: 404 });

  const messages = await db.query.message.findMany({
    where: eq(message.conversationId, id),
    orderBy: [asc(message.createdAt)],
  });

  return Response.json({ ...conv, messages });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const conv = await getConversation(id, user.id);
  if (!conv) return Response.json({ error: "Not found" }, { status: 404 });

  await db.delete(conversation).where(eq(conversation.id, id));

  return Response.json({ success: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const conv = await getConversation(id, user.id);
  if (!conv) return Response.json({ error: "Not found" }, { status: 404 });

  const body: { title?: string } = await req.json();

  const [updated] = await db
    .update(conversation)
    .set({ title: body.title })
    .where(eq(conversation.id, id))
    .returning();

  return Response.json(updated);
}
