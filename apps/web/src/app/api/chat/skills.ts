import {
  experimental_createSkillTool as createSkillTool,
  createBashTool,
} from "bash-tool";
import { SKILLS_DIR } from "@universal-agent/ai/skills";

export async function initSkillTools() {
  const { skill, files, instructions } = await createSkillTool({
    skillsDirectory: SKILLS_DIR,
  });

  const { tools: bashTools } = await createBashTool({
    files,
    extraInstructions: instructions,
  });

  // Cast through unknown to bridge duplicate ai SDK type declarations
  // (bash-tool peer dep resolves to a separate copy of ai's Tool type)
  return {
    skillTool: skill as unknown as import("ai").Tool<any, any>,
    bashTools: {
      bash: bashTools.bash as unknown as import("ai").Tool<any, any>,
    },
    skillInstructions: instructions,
  };
}
