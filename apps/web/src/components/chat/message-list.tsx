"use client";

import type { UIMessage } from "ai";
import { isToolUIPart, getToolName } from "ai";
import { MarkdownRenderer } from "./markdown-renderer";
import { CodeExecutionResult } from "./code-execution-result";
import { ArtifactCard } from "./artifact-card";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { Bot, User } from "lucide-react";

interface MessageListProps {
  messages: UIMessage[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-muted-foreground text-center">
          <p className="text-lg font-medium">Start a conversation</p>
          <p className="mt-1 text-sm">Send a message to begin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-4">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex gap-3">
            <div className="bg-muted flex size-6 shrink-0 items-center justify-center">
              <Bot className="size-3.5" />
            </div>
            <div className="text-muted-foreground flex items-center gap-1 text-sm">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function MessageItem({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "justify-end")}>
      {!isUser && (
        <div className="bg-muted flex size-6 shrink-0 items-center justify-center">
          <Bot className="size-3.5" />
        </div>
      )}
      <div className={cn("min-w-0 max-w-[85%]", isUser && "order-first")}>
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            if (!part.text) return null;
            return isUser ? (
              <div key={i} className="bg-primary text-primary-foreground px-3 py-2 text-sm">
                {part.text}
              </div>
            ) : (
              <MarkdownRenderer key={i} content={part.text} />
            );
          }

          if (isToolUIPart(part)) {
            const toolName = getToolName(part);

            if (toolName === "runCode" && part.state === "output-available") {
              return (
                <CodeExecutionResult
                  key={i}
                  language={(part.input as Record<string, string>)?.language}
                  code={(part.input as Record<string, string>)?.code}
                  result={part.output as Record<string, unknown>}
                />
              );
            }
            if (toolName === "createFile" && part.state === "output-available") {
              return (
                <ArtifactCard
                  key={i}
                  path={(part.input as Record<string, string>)?.path}
                  artifactId={(part.output as Record<string, string>)?.artifactId}
                />
              );
            }
            if (part.state === "input-available" || part.state === "input-streaming") {
              return (
                <div key={i} className="text-muted-foreground my-1 text-xs">
                  Using {toolName}...
                </div>
              );
            }
            return null;
          }

          return null;
        })}
      </div>
      {isUser && (
        <div className="bg-primary flex size-6 shrink-0 items-center justify-center">
          <User className="text-primary-foreground size-3.5" />
        </div>
      )}
    </div>
  );
}
