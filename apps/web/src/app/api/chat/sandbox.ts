import { Sandbox } from "@vercel/sandbox";
import { db } from "@universal-agent/db";
import { sandboxSession, artifact } from "@universal-agent/db/schema/chat";
import { eq } from "@universal-agent/db/helpers";

export async function getOrCreateSandbox(conversationId: string): Promise<Sandbox | null> {
  // Check for existing sandbox session
  const existing = await db.query.sandboxSession.findFirst({
    where: eq(sandboxSession.conversationId, conversationId),
  });

  // Tier 1: Try to reconnect to running sandbox
  if (existing?.sandboxId && existing.status === "running") {
    try {
      return await Sandbox.get({ sandboxId: existing.sandboxId });
    } catch {
      // Sandbox no longer running, fall through
    }
  }

  // Tier 2: Try to resume from snapshot
  if (existing?.snapshotId) {
    try {
      const sb = await Sandbox.create({
        source: { type: "snapshot", snapshotId: existing.snapshotId },
      });

      await db
        .update(sandboxSession)
        .set({
          sandboxId: sb.sandboxId,
          status: "running",
        })
        .where(eq(sandboxSession.id, existing.id));

      return sb;
    } catch {
      // Snapshot expired, fall through
    }
  }

  // Tier 3: Create fresh sandbox
  try {
    const sb = await Sandbox.create();
    const blobPrefix = `workspaces/${conversationId}/`;

    if (existing) {
      await db
        .update(sandboxSession)
        .set({
          sandboxId: sb.sandboxId,
          status: "running",
          blobPrefix,
        })
        .where(eq(sandboxSession.id, existing.id));
    } else {
      await db.insert(sandboxSession).values({
        conversationId,
        sandboxId: sb.sandboxId,
        blobPrefix,
        status: "running",
      });
    }

    // Restore files from DB artifacts
    await restoreFiles(sb, conversationId);

    return sb;
  } catch {
    return null;
  }
}

export async function snapshotSandbox(conversationId: string): Promise<void> {
  const existing = await db.query.sandboxSession.findFirst({
    where: eq(sandboxSession.conversationId, conversationId),
  });

  if (!existing?.sandboxId || existing.status !== "running") return;

  try {
    const sb = await Sandbox.get({ sandboxId: existing.sandboxId });
    const snap = await sb.snapshot();

    await db
      .update(sandboxSession)
      .set({
        snapshotId: snap.snapshotId,
        status: "snapshotted",
      })
      .where(eq(sandboxSession.id, existing.id));
  } catch {
    // Sandbox already gone
  }
}

async function restoreFiles(sb: Sandbox, conversationId: string): Promise<void> {
  const artifacts = await db.query.artifact.findMany({
    where: eq(artifact.conversationId, conversationId),
  });

  for (const art of artifacts) {
    if (art.content) {
      try {
        await sb.writeFiles([
          { path: art.path, content: Buffer.from(art.content) },
        ]);
      } catch {
        // Skip files that fail to write
      }
    }
  }
}

export async function syncFileToBlob(
  conversationId: string,
  path: string,
  content: string,
  mimeType?: string,
  messageId?: string,
): Promise<string> {
  const filename = path.split("/").pop() ?? path;

  const [art] = await db
    .insert(artifact)
    .values({
      conversationId,
      messageId: messageId ?? null,
      name: filename,
      path,
      mimeType: mimeType ?? guessMimeType(path),
      content,
    })
    .returning();

  return art!.id;
}

function guessMimeType(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    html: "text/html",
    css: "text/css",
    js: "application/javascript",
    ts: "application/typescript",
    json: "application/json",
    md: "text/markdown",
    txt: "text/plain",
    svg: "image/svg+xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    py: "text/x-python",
    sh: "application/x-sh",
  };
  return mimeMap[ext ?? ""] ?? "text/plain";
}
