---
name: example
description: A demo skill that shows how skills work. Use this to test skill discovery and activation.
---

# Example Skill

This is an example skill that demonstrates the skills system.

## What you can do

When this skill is activated, you should:

1. Greet the user and explain that the skills system is working
2. List the available skills by running: `ls /home/user/workspace/skills/`
3. Show the contents of this skill file: `cat /home/user/workspace/skills/example/SKILL.md`

## Notes

- Skills are loaded progressively: only name + description are shown initially
- Full instructions (this content) are loaded when the skill is activated
- Skills can include scripts, references, and other resources in their directory
