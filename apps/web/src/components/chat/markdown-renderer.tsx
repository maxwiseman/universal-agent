"use client";

import { memo } from "react";

/**
 * Simple markdown renderer that handles common patterns.
 * Uses a lightweight approach without heavy dependencies.
 */
function MarkdownRendererInner({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none break-words">
      <MarkdownContent content={content} />
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  const blocks = parseBlocks(content);

  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === "code") {
          return (
            <div key={i} className="group relative my-3">
              {block.lang && (
                <div className="bg-muted text-muted-foreground border-border border-x border-t px-3 py-1 text-xs">
                  {block.lang}
                </div>
              )}
              <pre className="bg-muted border-border overflow-x-auto border p-3">
                <code className="text-xs">{block.content}</code>
              </pre>
            </div>
          );
        }

        return (
          <div
            key={i}
            className="[&>p]:my-2 [&>ul]:my-2 [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:my-2 [&>ol]:list-decimal [&>ol]:pl-6 [&>h1]:text-lg [&>h1]:font-bold [&>h1]:my-3 [&>h2]:text-base [&>h2]:font-semibold [&>h2]:my-2 [&>h3]:text-sm [&>h3]:font-semibold [&>h3]:my-2 [&>blockquote]:border-l-2 [&>blockquote]:pl-3 [&>blockquote]:text-muted-foreground"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: markdown rendering
            dangerouslySetInnerHTML={{ __html: inlineMarkdownToHtml(block.content) }}
          />
        );
      })}
    </>
  );
}

interface Block {
  type: "text" | "code";
  content: string;
  lang?: string;
}

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while (true) {
    match = codeBlockRegex.exec(text);
    if (!match) break;

    if (match.index > lastIndex) {
      const textContent = text.slice(lastIndex, match.index).trim();
      if (textContent) {
        blocks.push({ type: "text", content: textContent });
      }
    }

    blocks.push({
      type: "code",
      content: match[2] ?? "",
      lang: match[1] || undefined,
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    const textContent = text.slice(lastIndex).trim();
    if (textContent) {
      blocks.push({ type: "text", content: textContent });
    }
  }

  if (blocks.length === 0 && text.trim()) {
    blocks.push({ type: "text", content: text.trim() });
  }

  return blocks;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMarkdownToHtml(text: string): string {
  const lines = text.split("\n");
  let html = "";
  let inList = false;
  let listType = "";

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (inList) {
        html += listType === "ul" ? "</ul>" : "</ol>";
        inList = false;
      }
      continue;
    }

    // Headers
    if (trimmed.startsWith("### ")) {
      if (inList) { html += listType === "ul" ? "</ul>" : "</ol>"; inList = false; }
      html += `<h3>${escapeHtml(trimmed.slice(4))}</h3>`;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      if (inList) { html += listType === "ul" ? "</ul>" : "</ol>"; inList = false; }
      html += `<h2>${escapeHtml(trimmed.slice(3))}</h2>`;
      continue;
    }
    if (trimmed.startsWith("# ")) {
      if (inList) { html += listType === "ul" ? "</ul>" : "</ol>"; inList = false; }
      html += `<h1>${escapeHtml(trimmed.slice(2))}</h1>`;
      continue;
    }

    // Unordered list
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!inList || listType !== "ul") {
        if (inList) html += listType === "ul" ? "</ul>" : "</ol>";
        html += "<ul>";
        inList = true;
        listType = "ul";
      }
      html += `<li>${inlineFormat(trimmed.slice(2))}</li>`;
      continue;
    }

    // Ordered list
    const olMatch = trimmed.match(/^(\d+)\.\s/);
    if (olMatch) {
      if (!inList || listType !== "ol") {
        if (inList) html += listType === "ul" ? "</ul>" : "</ol>";
        html += "<ol>";
        inList = true;
        listType = "ol";
      }
      html += `<li>${inlineFormat(trimmed.slice(olMatch[0].length))}</li>`;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      if (inList) { html += listType === "ul" ? "</ul>" : "</ol>"; inList = false; }
      html += `<blockquote>${inlineFormat(trimmed.slice(2))}</blockquote>`;
      continue;
    }

    // Paragraph
    if (inList) { html += listType === "ul" ? "</ul>" : "</ol>"; inList = false; }
    html += `<p>${inlineFormat(trimmed)}</p>`;
  }

  if (inList) {
    html += listType === "ul" ? "</ul>" : "</ol>";
  }

  return html;
}

function inlineFormat(text: string): string {
  let result = escapeHtml(text);
  // Bold
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Italic
  result = result.replace(/\*(.+?)\*/g, "<em>$1</em>");
  // Inline code
  result = result.replace(/`([^`]+)`/g, '<code class="bg-muted rounded px-1 py-0.5 text-xs">$1</code>');
  // Links
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-primary underline" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  return result;
}

export const MarkdownRenderer = memo(MarkdownRendererInner);
