---
description: Stop worktree monitoring service
allowed-tools: Bash(*), Read(*), Write(*), Edit(*)
---

Stop the worktree monitoring service and clean up background processes.

This command will:
1. Stop all monitoring services
2. Clean up temporary files
3. Show final status summary
4. Provide cleanup recommendations

Actions performed:
- Terminate monitoring processes
- Remove signal files
- Clean up temporary logs
- Show summary of activities

After stopping monitoring:
- Manual coordination is required
- Signal files will not be processed
- Worktrees operate independently
- Manual sync commands still work

To restart monitoring later, use /monitor-start