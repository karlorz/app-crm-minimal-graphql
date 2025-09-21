---
description: Switch to bugfix worktree and start Claude Code
allowed-tools: Bash(*), Read(*), Write(*), Edit(*)
---

Navigate to bugfix worktree and start Claude Code for bug fixing.

The bugfix worktree is isolated for fixing bugs. Changes here can be tested and validated before merging to main.

Available actions:
- Fix reported bugs and issues
- Test bug fixes thoroughly
- Create signal file `.bugfix-complete` when fixed
- Validate fixes before merging

Working directory: ../app-crm-minimal-graphql-worktrees/bugfix
Current branch: bugfix/app-crm-minimal-graphql

Signal files:
- Touch `.bugfix-complete` when bug fix is complete
- This will automatically trigger validation workflow