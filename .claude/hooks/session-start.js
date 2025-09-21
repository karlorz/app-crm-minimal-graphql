#!/usr/bin/env node
// SessionStart Hook - Initialize worktree context
import { readFileSync } from 'fs';
import { join } from 'path';

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const configPath = join(projectDir, '.claude', 'worktree-config.json');
const config = JSON.parse(readFileSync(configPath, 'utf8'));
const { projectName } = config;

const additionalContext = `🔄 Multi-Worktree Setup Active
Project: ${sanitizeProjectNameForTemplate(projectName)}
Worktrees: feature, test, docs, bugfix

Available commands:
- /worktree-feature - Work in feature worktree
- /worktree-test - Work in test worktree
- /worktree-docs - Work in docs worktree
- /worktree-bugfix - Work in bugfix worktree
- /sync-worktrees - Sync changes between worktrees
- /monitor-start - Start worktree monitoring
- /monitor-stop - Stop worktree monitoring

Use signal files to coordinate workflows:
- .claude-complete - Feature work completed
- .tests-complete - Tests completed
- .bugfix-complete - Bugfix completed`;

console.log(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext
  }
}));
