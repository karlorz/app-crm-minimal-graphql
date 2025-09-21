---
description: Synchronize changes between all worktrees
allowed-tools: Bash(*), Read(*), Write(*), Edit(*)
---

Synchronize changes between all worktrees to ensure everyone has the latest updates.

This command will:
1. Check the status of all worktrees
2. Pull latest changes from remote branches
3. Show any conflicts that need resolution
4. Provide sync status for each worktree

Worktrees to sync:
- feature/app-crm-minimal-graphql
- test/app-crm-minimal-graphql
- docs/app-crm-minimal-graphql
- bugfix/app-crm-minimal-graphql

Run this command when:
- Starting work to ensure you have latest changes
- After completing work to share your changes
- When experiencing conflicts between worktrees

Available actions:
- Pull latest changes from remote
- Push local changes to remote
- Resolve merge conflicts if any
- View sync status for all worktrees