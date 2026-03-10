"use client";

import { Button } from "@/components/ui/button";
import { ArrowUp, Square } from "lucide-react";
import { useRef, useEffect } from "react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isLoading: boolean;
}

export function ChatInput({ value, onChange, onSubmit, onStop, isLoading }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) {
        onSubmit();
      }
    }
  }

  return (
    <div className="border-border bg-background border">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Send a message..."
        rows={1}
        className="w-full resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
      />
      <div className="flex items-center justify-end px-2 pb-2">
        {isLoading ? (
          <Button size="icon-xs" variant="outline" onClick={onStop}>
            <Square className="size-3" />
          </Button>
        ) : (
          <Button
            size="icon-xs"
            onClick={onSubmit}
            disabled={!value.trim()}
          >
            <ArrowUp className="size-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
