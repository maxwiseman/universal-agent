"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Terminal } from "lucide-react";
import { useState } from "react";

interface CodeExecutionResultProps {
  language: string;
  code: string;
  result: {
    stdout?: string;
    stderr?: string;
    exitCode?: number;
  };
}

export function CodeExecutionResult({ language, code, result }: CodeExecutionResultProps) {
  const [showCode, setShowCode] = useState(false);
  const hasError = result.exitCode !== 0 || result.stderr;

  return (
    <div className="border-border my-2 border text-xs">
      <button
        type="button"
        onClick={() => setShowCode(!showCode)}
        className="hover:bg-muted flex w-full items-center gap-2 px-3 py-2 text-left transition-colors"
      >
        {showCode ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        <Terminal className="size-3" />
        <span className="font-medium">
          {language} code
        </span>
        <span
          className={cn(
            "ml-auto text-xs",
            hasError ? "text-destructive" : "text-muted-foreground",
          )}
        >
          exit {result.exitCode ?? 0}
        </span>
      </button>

      {showCode && (
        <div className="border-border border-t">
          <pre className="bg-muted overflow-x-auto p-3">
            <code>{code}</code>
          </pre>
        </div>
      )}

      {(result.stdout || result.stderr) && (
        <div className="border-border border-t">
          {result.stdout && (
            <pre className="overflow-x-auto p-3 text-xs">
              <code>{result.stdout}</code>
            </pre>
          )}
          {result.stderr && (
            <pre className="text-destructive overflow-x-auto p-3 text-xs">
              <code>{result.stderr}</code>
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
