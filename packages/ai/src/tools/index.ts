import { z } from "zod";

export const runCodeSchema = {
  description:
    "Run code in a sandboxed environment. Supports JavaScript/TypeScript, Python, and shell scripts.",
  inputSchema: z.object({
    code: z.string().describe("The code to execute"),
    language: z
      .enum(["javascript", "typescript", "python", "shell"])
      .describe("The programming language of the code"),
    filename: z
      .string()
      .optional()
      .describe("Optional filename to save the code as before running"),
  }),
};

export const createFileSchema = {
  description:
    "Create or overwrite a file in the sandbox workspace. Use this to create HTML pages, scripts, data files, etc.",
  inputSchema: z.object({
    path: z.string().describe("The file path relative to the workspace root"),
    content: z.string().describe("The file content"),
    mimeType: z
      .string()
      .optional()
      .describe("MIME type of the file (auto-detected if not provided)"),
  }),
};

export const readFileSchema = {
  description: "Read the contents of a file from the sandbox workspace.",
  inputSchema: z.object({
    path: z.string().describe("The file path relative to the workspace root"),
  }),
};
