---
name: cyengine-builder-development
description: Develop and debug CyEngine spatial runtime and CypherVerse Builder tools, layers, scene objects, physics, player-relative interfaces, and interactions.
---
# CyEngine and Builder Development

## Architecture
- Treat CyEngine as spatial behavior/runtime support and CypherVerse as the primary product and Builder.
- Inspect actual package entry points, exports, installed package version, source, and consuming application before changing integration.
- Trace the relevant reality/layer/tool/component lifecycle, scene ownership, player state, physics, rendering, and event flow.
- Reuse existing layers, tools, modifiers, contexts, and scene object systems. Do not create parallel tool frameworks.
- Keep Builder/editor responsibilities distinct from runtime spatial behavior.

## Interaction and UI
- Respect established player-relative positioning and interaction patterns.
- Do not replace player-following VR-style panels with fixed developer sidebars unless explicitly requested.
- Preserve existing bottom-toolbar and tool-panel conventions where present.
- Check desktop, mobile, XR, pointer, keyboard, and controller behavior when relevant.
- Avoid global scene, camera, physics, or input changes for a localized UI request.

## Compatibility and verification
- Inspect peer dependencies, Three.js/R3F/Cannon versions, package exports, build output, and runtime resolution.
- Test the consuming CypherVerse application, not just the library in isolation.
- Verify scene loading, object lifecycle, transforms, tool activation, player-relative positioning, and cleanup as relevant.
- Avoid broad dependency upgrades and generated build artifacts unless explicitly required.

Report the exact lifecycle and files affected, compatibility risks, tests/builds run, and any behavior not verified in an actual browser/XR session.
