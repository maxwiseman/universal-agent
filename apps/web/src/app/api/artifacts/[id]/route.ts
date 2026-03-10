import { auth } from "@universal-agent/auth";
import { db } from "@universal-agent/db";
import { artifact, conversation } from "@universal-agent/db/schema/chat";
import { eq } from "@universal-agent/db/helpers";
import { headers } from "next/headers";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const art = await db.query.artifact.findFirst({
    where: eq(artifact.id, id),
  });

  if (!art) {
    return new Response("Not found", { status: 404 });
  }

  // Verify ownership through conversation
  const conv = await db.query.conversation.findFirst({
    where: eq(conversation.id, art.conversationId),
  });

  if (!conv || conv.userId !== session.user.id) {
    return new Response("Not found", { status: 404 });
  }

  // If blob URL exists, redirect to it
  if (art.blobUrl) {
    return Response.redirect(art.blobUrl);
  }

  // Return inline content
  const contentType = art.mimeType ?? "text/plain";
  return new Response(art.content ?? "", {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${art.name}"`,
    },
  });
}
