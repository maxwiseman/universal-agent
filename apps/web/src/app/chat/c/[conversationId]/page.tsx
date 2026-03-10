import { auth } from "@universal-agent/auth";
import { db } from "@universal-agent/db";
import { conversation, message } from "@universal-agent/db/schema/chat";
import { eq, asc } from "@universal-agent/db/helpers";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ChatInterface } from "@/components/chat/chat-interface";
import type { UIMessage } from "ai";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const conv = await db.query.conversation.findFirst({
    where: eq(conversation.id, conversationId),
  });

  if (!conv || conv.userId !== session.user.id) {
    notFound();
  }

  const messages = await db.query.message.findMany({
    where: eq(message.conversationId, conversationId),
    orderBy: [asc(message.createdAt)],
  });

  const uiMessages: UIMessage[] = messages.map((m) => ({
    id: m.id,
    role: m.role as UIMessage["role"],
    content: "",
    parts: m.parts as UIMessage["parts"],
  }));

  return (
    <ChatInterface
      conversationId={conversationId}
      initialMessages={uiMessages}
      initialModel={conv.model}
    />
  );
}
