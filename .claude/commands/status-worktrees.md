---
description: View status of all worktrees and signal files
allowed-tools: Bash(*), Read(*), Write(*), Edit(*)
---

View comprehensive status of all worktrees including Git status, signal files, and remote synchronization.
This command provides a complete overview of:
- Git worktree status and health
- Signal file presence and workflow state
- Remote synchronization status
- Branch cleanliness and conflicts
Worktree status information:
- Main repository status
- Feature worktree (feature/app-crm-minimal-graphql)
- Test worktree (test/app-crm-minimal-graphql)
- Docs worktree (docs/app-crm-minimal-graphql)
- Bugfix worktree (bugfix/app-crm-minimal-graphql)
Signal file monitoring:
- .claude-complete - Feature completion signal
- .tests-complete - Test completion signal
- .bugfix-complete - Bugfix completion signal
- .docs-complete - Documentation completion signal
Git status includes:
- Branch cleanliness
- Uncommitted changes
- Remote synchronization
- Worktree availability
Use this command to:
- Check overall project health
- Verify workflow progress
- Identify synchronization issues
- Monitor signal file states
- View remote branch status