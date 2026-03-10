import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

export const SKILLS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../skills");
