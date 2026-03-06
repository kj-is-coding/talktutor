---
name: Investigate Invite Flow Issues
description: Diagnose problems with the invite acceptance flow
---

# Task: Investigate Invite Flow Issues

## Problem Statement
Users are experiencing multiple issues with the invite link flow:

1. "Email already registered" error when using invite link with existing email
2. After filling name/email on invite page, user is redirected to login page instead of being authenticated directly
3. Rate limit exceeded when trying to send magic link from login page

## Files to Investigate
- src/app/invite/[token]/page.tsx
- src/app/invite/[token]/invite-accept-form.tsx
- src/lib/invite-operations.ts
- src/app/login/page.tsx
- src/lib/auth-client.ts

## Output
Write findings to .agent_workspace/investigate/invite_flow_diagnosis_Mar_05.md with:
- Current flow diagram
- Root cause analysis of each issue
- Recommended fixes with code snippets
