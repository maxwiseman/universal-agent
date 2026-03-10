"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ArtifactViewerProps {
  artifact: {
    content: string;
    mimeType: string;
    name: string;
  };
  onClose: () => void;
}

export function ArtifactViewer({ artifact, onClose }: ArtifactViewerProps) {
  const isHtml = artifact.mimeType === "text/html" || artifact.name.endsWith(".html");
  const isImage = artifact.mimeType.startsWith("image/");

  return (
    <div className="border-border flex w-[480px] shrink-0 flex-col border-l">
      <div className="border-border flex items-center justify-between border-b px-3 py-2">
        <span className="truncate text-sm font-medium">{artifact.name}</span>
        <Button size="icon-xs" variant="ghost" onClick={onClose}>
          <X className="size-3" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        {isHtml ? (
          <iframe
            title={artifact.name}
            srcDoc={artifact.content}
            className="h-full w-full border-0"
            sandbox="allow-scripts"
          />
        ) : isImage ? (
          <img
            src={`data:${artifact.mimeType};base64,${artifact.content}`}
            alt={artifact.name}
            className="max-w-full"
          />
        ) : (
          <pre className="overflow-auto p-3 text-xs">
            <code>{artifact.content}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
