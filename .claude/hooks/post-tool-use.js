#!/usr/bin/env node
// PostToolUse Hook - Auto-coordinate worktree workflows
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';

const input = JSON.parse(readFileSync(0, 'utf8'));
const { tool_name, tool_input } = input;
const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const configPath = join(projectDir, '.claude', 'worktree-config.json');
const config = JSON.parse(readFileSync(configPath, 'utf8'));
const { projectName } = config;

// Check for signal files and trigger workflows
if (tool_name === 'Write' || tool_name === 'Edit') {
  const worktreesDir = join(dirname(projectDir), `${projectName}-worktrees`);

  // Check if any signal files exist and process them
  const signals = [
    { file: 'feature/.claude-complete', action: 'trigger-tests' },
    { file: 'test/.tests-complete', action: 'trigger-docs' },
    { file: 'bugfix/.bugfix-complete', action: 'trigger-validation' }
  ];

  for (const signal of signals) {
    const signalPath = join(worktreesDir, signal.file);
    if (existsSync(signalPath)) {
      console.log(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PostToolUse",
          additionalContext: `🔄 Detected ${signal.action} signal from ${signal.file}`
        }
      }));
      break;
    }
  }
}

// Allow tool execution
process.exit(0);
