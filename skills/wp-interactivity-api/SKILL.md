---
name: wp-interactivity-api
description: "Must use when building any type of interactivity in WordPress's frontend (not the admin), both in blocks or PHP themes."
---

The Interactivity API is WordPress's standard system for building interactive frontends. It uses server-rendered HTML enhanced with declarative directives (like `data-wp-interactive`, `data-wp-bind`, `data-wp-on`) and a reactive store (state, actions, callbacks) to add client-side behavior without replacing the server-rendered markup.

## CRITICAL RULES

1. **All markup must be server-rendered in PHP.** Never use `document.createElement`, `innerHTML`, or any JavaScript API to create markup. All HTML must come from the PHP render callback (blocks) or PHP template (themes). For dynamic elements, use directives like `data-wp-each` for lists or `data-wp-bind--hidden` for conditional visibility.
2. **Never default to `addEventListener`.** Follow this priority: (1) `data-wp-on--*` directives, (2) `addEventListener` only as a last resort inside `data-wp-init` or `data-wp-watch`, with proper cleanup.
3. **Never default to `setAttribute`.** Follow this priority: (1) server-render attributes in PHP, (2) `data-wp-bind--*` directives, (3) `setAttribute` only as a last resort inside an action or callback.
4. **Frontend code takes priority over editor code.** The Interactivity API (`view.js`) runs on the frontend and must be optimized for performance above all else. Never import editor utilities into frontend code. If logic needs to be shared between frontend and editor, always write it for the frontend first and have the editor (`edit.js`) reuse it — never the other way around.

## MUST-HAVE KNOWLEDGE

Before working on any task, you MUST read all the reference files listed below.

- [Directives and Store](references/directives-and-store.md)
- [Reactive and declarative mindset](references/the-reactive-and-declarative-mindset.md)
- [Understanding global state, local context and derived state](references/undestanding-global-state-local-context-and-derived-state.md)
- [Server-side rendering](references/server-side-rendering.md)

## ADDITIONAL REFERENCES

Only read these if the task involves the specific topic.

- [Client-side Navigation](references/client-side-navigation.md) — read if the task involves client-side navigation or region-based routing.
- [Using TypeScript](references/using-typescript.md) — read if the task involves TypeScript.
