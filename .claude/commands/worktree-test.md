---
description: Switch to test worktree and start Claude Code
allowed-tools: Bash(*), Read(*), Write(*), Edit(*)
---

Navigate to test worktree and start Claude Code for testing and validation.

The test worktree is dedicated to testing activities. It can pull changes from feature worktrees and run automated tests.

Available actions:
- Write and run tests for features
- Validate bug fixes
- Create signal file `.tests-complete` when testing is done
- Run automated test suites

Working directory: ../app-crm-minimal-graphql-worktrees/test
Current branch: test/app-crm-minimal-graphql

Signal files:
- Touch `.tests-complete` when testing is complete
- This will automatically trigger documentation workflow