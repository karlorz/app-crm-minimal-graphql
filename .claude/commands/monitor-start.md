---
description: Start worktree monitoring service
allowed-tools: Bash(*), Read(*), Write(*), Edit(*)
---

Start the worktree monitoring service to enable automated coordination between worktrees.

The monitoring service will:
- Watch for signal files (.claude-complete, .tests-complete, etc.)
- Automatically trigger workflows when signals are detected
- Run tests, validation, and documentation updates
- Provide real-time feedback on workflow status

Monitor types available:
- Auto-detection: Monitors signal files every 5 seconds
- File monitoring: Watches for file system changes
- Webhook server: HTTP-based workflow triggering

To start monitoring:
1. Choose monitor type (recommended: auto-detection)
2. Service runs in background
3. Signal files trigger automatic workflows
4. Monitor logs for workflow status

Signal files and their effects:
- .claude-complete → Trigger test workflow
- .tests-complete → Trigger documentation workflow
- .bugfix-complete → Trigger validation workflow

Logs are written to: /var/folders/g5/w0dkw_x51n1c6q8lgxlmmrrh0000gn/T/claude-monitor.log