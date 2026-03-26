# JARVIS AI Assistant

## Current State
New project — no existing application files.

## Requested Changes (Diff)

### Add
- Full JARVIS-themed chat interface with HUD-style animated elements
- Settings panel: AI provider selector (OpenAI / Gemini), API key input with show/hide toggle
- localStorage persistence for API key and selected provider
- Chat history display with user/JARVIS message bubbles
- Clear chat button
- JARVIS system prompt pre-loaded with full personality instructions
- Direct frontend API calls to OpenAI (GPT-4) and Google Gemini APIs
- Animated HUD elements: glowing rings, scan lines, pulsing arcs, radar-style animations
- JARVIS avatar/logo displayed prominently
- Responsive design for mobile and desktop

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan
1. Backend: minimal Motoko actor (no backend logic needed — all AI calls happen in frontend via user's own API keys)
2. Frontend:
   - App shell with dark HUD theme and animated background elements
   - JARVIS logo/avatar component with glow effects
   - Chat interface: message list, input bar, send button
   - Settings panel (slide-in or modal): provider toggle, API key field, save button
   - Chat logic: build message array with JARVIS system prompt, call selected AI provider API
   - localStorage hook for persisting provider + API key
   - Animated CSS: glowing rings, scan lines, pulsing arcs using keyframe animations
