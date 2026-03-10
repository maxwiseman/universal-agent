"use client";

import { FileText } from "lucide-react";

interface ArtifactCardProps {
  path: string;
  artifactId?: string;
  onClick?: () => void;
}

export function ArtifactCard({ path, artifactId, onClick }: ArtifactCardProps) {
  const filename = path.split("/").pop() ?? path;
  const extension = filename.split(".").pop()?.toLowerCase();

  return (
    <button
      type="button"
      onClick={onClick}
      className="border-border hover:bg-muted my-2 flex w-full items-center gap-3 border px-3 py-2.5 text-left transition-colors"
    >
      <FileText className="text-muted-foreground size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{filename}</div>
        <div className="text-muted-foreground text-xs">{extension?.toUpperCase()} file</div>
      </div>
    </button>
  );
}
