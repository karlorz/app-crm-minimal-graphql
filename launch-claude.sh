#!/bin/bash
# Launch Claude Code in feature worktree
echo "Starting Claude Code in feature environment..."
echo "Current branch: $(git branch --show-current)"
echo "Worktree path: $(pwd)"
claude
