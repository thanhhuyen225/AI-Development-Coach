# AI Development Coach - Context

## Current State (Last updated: 2026-06-16)
- Project: AI Career Development Coach
- UI + Backend deployed: https://endpoint-fc76862c-f97a-4af6-902c-5720b29439fc.agentbase-runtime.aiplatform.vngcloud.vn

## System Prompt (Latest)
- Role: Career Development Coach
- Response format: BRIDGE + QUESTION (1 bridge + 1 question each turn)
- Signal detection: VAGUE, CONTRADICTION, EXTERNAL_BLAME, ASSUMPTION, EMOTIONAL, STRONG_CLAIM
- Question selection based on signal type
- Hard rules: No advice, no multiple questions, pivot after 3 turns

## UI Features (New)
- Login/Register với gradient background
- Sidebar menu: Chat, Hồ sơ, Lịch sử, Đăng xuất
- Profile settings: level, target role, tech stack, focus area
- Chat với AI Coach - parse **text** thành in đậm (bold)

## Files
- Backend: ai-coaching-ui-server/main.py
- UI Source: ai-coaching-ui/src/app/page.tsx
- Dockerfile: ai-coaching-ui-server/Dockerfile
