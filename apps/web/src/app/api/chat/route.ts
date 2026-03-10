import { generateText, streamText, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { auth } from "@universal-agent/auth";
import { db } from "@universal-agent/db";
import { conversation, message } from "@universal-agent/db/schema/chat";
import {
  gateway,
  availableModels,
  defaultModel,
  runCodeSchema,
  createFileSchema,
  readFileSchema,
} from "@universal-agent/ai";
import { eq } from "@universal-agent/db/helpers";
import { headers } from "next/headers";
import { getOrCreateSandbox, syncFileToBlob } from "./sandbox";
import { initSkillTools } from "./skills";

const BASE_SYSTEM_PROMPT = `You are a helpful AI assistant with access to a code sandbox and skills. You can:
- Run code (JavaScript/TypeScript, Python, shell scripts)
- Create files (HTML pages, scripts, data files, etc.)
- Read files from the workspace
- Activate skills for specialized tasks

When writing code, always use the runCode tool to execute it so the user can see the results.
When creating artifacts like HTML pages, charts, or documents, use the createFile tool.
Be concise and helpful. Format your responses with markdown when appropriate.

## Skills

You have access to a \`skill\` tool that lists available skills and loads their instructions.
Call the skill tool to see what specialized capabilities are available.
When a skill is activated, follow its instructions. Skills may tell you to use bash commands
to read files or run scripts — use the \`skillBash\` tool for skill-related file access,
and the \`runCode\` tool for executing code in the sandbox.`;

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const {
    messages,
    conversationId,
    model: modelId,
  }: { messages: UIMessage[]; conversationId?: string; model?: string } = await req.json();

  const selectedModel = availableModels.find((m) => m.id === modelId) ?? defaultModel;

  // Create or get conversation
  let convId = conversationId;
  if (!convId) {
    const [conv] = await db
      .insert(conversation)
      .values({
        userId: session.user.id,
        model: selectedModel.id,
      })
      .returning();
    convId = conv!.id;
  } else {
    // Verify conversation belongs to user
    const conv = await db.query.conversation.findFirst({
      where: eq(conversation.id, convId),
    });
    if (!conv || conv.userId !== session.user.id) {
      return new Response("Not found", { status: 404 });
    }
  }

  // Lazily initialized sandbox — only created when a tool needs it
  let sandbox: Awaited<ReturnType<typeof getOrCreateSandbox>> = null;

  async function ensureSandbox() {
    if (!sandbox) {
      sandbox = await getOrCreateSandbox(convId!);
    }
    return sandbox;
  }

  // Initialize skill tools (in-memory, no sandbox cost)
  const { skillTool, bashTools, skillInstructions } = await initSkillTools();

  const systemPrompt = skillInstructions
    ? `${BASE_SYSTEM_PROMPT}\n\n${skillInstructions}`
    : BASE_SYSTEM_PROMPT;

  const result = streamText({
    model: gateway(selectedModel.id),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools: {
      skill: skillTool,
      skillBash: bashTools.bash,
      runCode: {
        ...runCodeSchema,
        execute: async ({ code, language, filename }) => {
          const sb = await ensureSandbox();
          if (!sb) {
            return {
              stdout: "",
              stderr: "Sandbox is not available. Please configure @vercel/sandbox.",
              exitCode: 1,
            };
          }

          const extMap: Record<string, string> = { javascript: "js", typescript: "ts", python: "py", shell: "sh" };
          const ext = extMap[language] ?? "js";
          const fname = filename ?? `script.${ext}`;
          await sb.writeFiles([{ path: fname, content: Buffer.from(code) }]);

          const interpreter =
            language === "python"
              ? "python3"
              : language === "shell"
                ? "bash"
                : "node";

          const result = await sb.runCommand(interpreter, [fname]);

          return {
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: result.exitCode,
          };
        },
      },
      createFile: {
        ...createFileSchema,
        execute: async ({ path, content, mimeType }) => {
          // Write to sandbox if available
          const sb = await ensureSandbox();
          if (sb) {
            await sb.writeFiles([{ path, content: Buffer.from(content) }]);
          }

          // Always persist as artifact
          const artifactId = await syncFileToBlob(convId!, path, content, mimeType);

          return {
            artifactId,
            path,
            message: `Created ${path}`,
          };
        },
      },
      readFile: {
        ...readFileSchema,
        execute: async ({ path }) => {
          const sb = await ensureSandbox();
          if (!sb) {
            return {
              content: "",
              error: "Sandbox is not available.",
            };
          }

          try {
            const buf = await sb.readFileToBuffer({ path });
            if (!buf) {
              return { content: "", error: `File not found: ${path}` };
            }
            return { content: buf.toString("utf-8") };
          } catch {
            return {
              content: "",
              error: `File not found: ${path}`,
            };
          }
        },
      },
    },
    stopWhen: stepCountIs(10),
    onFinish: async ({ response }) => {
      // Persist the latest user message and assistant response
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage && lastUserMessage.role === "user") {
        await db.insert(message).values({
          id: lastUserMessage.id,
          conversationId: convId!,
          role: "user",
          parts: lastUserMessage.parts,
        });
      }

      for (const msg of response.messages) {
        if (msg.role === "assistant") {
          await db.insert(message).values({
            conversationId: convId!,
            role: "assistant",
            parts: msg.content,
          });
        }
      }

      // Auto-generate title for new conversations
      if (!conversationId && lastUserMessage) {
        const userText =
          lastUserMessage.parts
            .filter((p): p is { type: "text"; text: string } => p.type === "text")
            .map((p) => p.text)
            .join(" ") || "";

        if (userText) {
          try {
            const { text: title } = await generateText({
              model: gateway("openai/gpt-4o-mini"),
              prompt: `Generate a very short title (max 6 words) for a conversation that starts with this message. Return only the title, no quotes:\n\n${userText.slice(0, 200)}`,
            });

            await db
              .update(conversation)
              .set({ title: title.trim().slice(0, 100) })
              .where(eq(conversation.id, convId!));
          } catch {
            // Title generation is non-critical
          }
        }
      }
    },
  });

  return result.toUIMessageStreamResponse({
    headers: {
      "X-Conversation-Id": convId!,
    },
  });
}
