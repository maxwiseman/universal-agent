"use client";

import { availableModels, type ModelInfo } from "@universal-agent/ai";
import { cn } from "@/lib/utils";
import { ChevronsUpDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface ModelSelectorProps {
  value: string;
  onChange: (modelRegistryId: string) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = availableModels.find((m) => m.id === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "border-border bg-background hover:bg-muted flex items-center gap-1.5 border px-2.5 py-1.5 text-xs transition-colors",
        )}
      >
        <span>{selected?.name ?? "Select model"}</span>
        <ChevronsUpDown className="size-3 opacity-50" />
      </button>

      {open && (
        <div className="border-border bg-popover ring-foreground/10 absolute top-full left-0 z-50 mt-1 min-w-48 overflow-hidden shadow-md ring-1">
          {groupByProvider(availableModels).map(([provider, models]) => (
            <div key={provider}>
              <div className="text-muted-foreground px-2.5 py-1.5 text-xs font-medium">
                {provider}
              </div>
              {models.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    onChange(model.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "hover:bg-accent w-full px-2.5 py-1.5 text-left text-xs transition-colors",
                    model.id === value && "bg-accent",
                  )}
                >
                  {model.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function groupByProvider(models: ModelInfo[]): [string, ModelInfo[]][] {
  const groups = new Map<string, ModelInfo[]>();
  for (const model of models) {
    const existing = groups.get(model.provider);
    if (existing) {
      existing.push(model);
    } else {
      groups.set(model.provider, [model]);
    }
  }
  return [...groups.entries()];
}
