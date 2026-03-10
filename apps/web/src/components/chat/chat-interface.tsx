"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ChatInput } from "./chat-input";
import { MessageList } from "./message-list";
import { ModelSelector } from "./model-selector";
import { ArtifactViewer } from "./artifact-viewer";
import { defaultModel } from "@universal-agent/ai";
import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

interface ChatInterfaceProps {
  conversationId?: string;
  initialMessages?: UIMessage[];
  initialModel?: string;
}

export function ChatInterface({
  conversationId,
  initialMessages = [],
  initialModel,
}: ChatInterfaceProps) {
  const router = useRouter();
  const [model, setModel] = useState(initialModel ?? defaultModel.id);
  const [currentConversationId, setCurrentConversationId] = useState(conversationId);
  const [input, setInput] = useState("");
  const [selectedArtifact, setSelectedArtifact] = useState<{
    content: string;
    mimeType: string;
    name: string;
  } | null>(null);

  const convIdRef = useRef(currentConversationId);
  convIdRef.current = currentConversationId;

  const modelRef = useRef(model);
  modelRef.current = model;

  const [transport] = useState(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: {},
        fetch: async (url, init) => {
          // Inject conversationId and model into the body
          if (init?.body && typeof init.body === "string") {
            const parsed = JSON.parse(init.body);
            parsed.conversationId = convIdRef.current;
            parsed.model = modelRef.current;
            init = { ...init, body: JSON.stringify(parsed) };
          }
          const response = await globalThis.fetch(url, init);
          const newConvId = response.headers.get("X-Conversation-Id");
          if (newConvId && !convIdRef.current) {
            convIdRef.current = newConvId;
            setCurrentConversationId(newConvId);
            router.replace(`/chat/c/${newConvId}`);
          }
          return response;
        },
      }),
  );

  const { messages, sendMessage, status, stop } = useChat({
    id: currentConversationId,
    messages: initialMessages,
    transport,
  });

  const isLoading = status === "submitted" || status === "streaming";

  const handleSend = useCallback(() => {
    if (input.trim()) {
      sendMessage({ text: input });
      setInput("");
    }
  }, [input, sendMessage]);

  return (
    <div className="flex h-full">
      <div className="flex flex-1 flex-col">
        <div className="border-border flex items-center gap-2 border-b px-4 py-2">
          <ModelSelector value={model} onChange={setModel} />
        </div>

        <MessageList messages={messages} isLoading={isLoading} />

        <div className="mx-auto w-full max-w-3xl px-4 pb-4">
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleSend}
            onStop={stop}
            isLoading={isLoading}
          />
        </div>
      </div>

      {selectedArtifact && (
        <ArtifactViewer
          artifact={selectedArtifact}
          onClose={() => setSelectedArtifact(null)}
        />
      )}
    </div>
  );
}
