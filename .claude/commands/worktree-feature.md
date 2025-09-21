---
description: Switch to feature worktree and start Claude Code
allowed-tools: Bash(*), Read(*), Write(*), Edit(*)
---

Navigate to feature worktree and start Claude Code for feature development.

The feature worktree is isolated for new feature development. Changes made here will not affect other worktrees until explicitly synchronized.

Available actions:
- Develop new features with Claude Code
- Create signal file `.claude-complete` when finished
- Changes are automatically tracked in the feature branch

Working directory: ../app-crm-minimal-graphql-worktrees/feature
Current branch: feature/app-crm-minimal-graphql

Signal files:
- Touch `.claude-complete` when feature work is complete
- This will automatically trigger test workflow