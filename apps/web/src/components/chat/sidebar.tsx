"use client";

import { cn } from "@/lib/utils";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface Conversation {
  id: string;
  title: string | null;
  createdAt: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    fetchConversations();
  }, [pathname]);

  async function fetchConversations() {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch {
      // Silently fail
    }
  }

  async function deleteConversation(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (pathname === `/chat/c/${id}`) {
        router.push("/chat");
      }
    } catch {
      // Silently fail
    }
  }

  return (
    <div className="border-border flex h-full w-64 shrink-0 flex-col border-r">
      <div className="border-border border-b p-2">
        <Link href="/chat">
          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
            <Plus className="size-3.5" />
            New chat
          </Button>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-0.5">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/chat/c/${conv.id}`}
              className={cn(
                "hover:bg-muted group flex items-center gap-2 px-2 py-1.5 text-xs transition-colors",
                pathname === `/chat/c/${conv.id}` && "bg-muted",
              )}
            >
              <MessageSquare className="size-3.5 shrink-0 opacity-50" />
              <span className="flex-1 truncate">
                {conv.title ?? "New conversation"}
              </span>
              <button
                type="button"
                onClick={(e) => deleteConversation(conv.id, e)}
                className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="text-muted-foreground hover:text-destructive size-3" />
              </button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
