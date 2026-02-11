# Directives quick reference

Directives are custom `data-wp-*` HTML attributes that bind DOM elements to the reactive store. General syntax:

```
data-wp-<type>--<qualifier>="<namespace>::<value>"
```

- The `namespace::` prefix is optional inside a `data-wp-interactive="namespace"` region.
- Values reference store paths: `state.prop`, `context.prop`, `actions.handler`, `callbacks.fn`.

## Activation & scoping

| Directive | Syntax | Description |
|-----------|--------|-------------|
| `wp-interactive` | `data-wp-interactive="namespace"` | Activates interactivity for the element and its descendants. All other directives must be inside an interactive region. |
| `wp-context` | `data-wp-context='{"key":"value"}'` | Provides local state scoped to the element and its children. Nested contexts merge (child inherits and can override parent). |

## Attribute & style binding

| Directive | Syntax | Description |
|-----------|--------|-------------|
| `wp-bind` | `data-wp-bind--<attribute>="state.prop"` | Sets HTML attributes reactively. `true` adds the attribute; `false` removes it; string sets the value. For `aria-*` and `data-*` with booleans, renders as string `"true"`/`"false"`. |
| `wp-class` | `data-wp-class--<classname>="state.prop"` | Toggles a CSS class based on a boolean value. |
| `wp-style` | `data-wp-style--<css-property>="state.prop"` | Adds/removes inline styles. String values are applied; `false`/`null` removes the style. |

## Content

| Directive | Syntax | Description |
|-----------|--------|-------------|
| `wp-text` | `data-wp-text="state.prop"` | Sets the inner text of an element. Updates reactively. |

## Event handling

| Directive | Syntax | Description |
|-----------|--------|-------------|
| `wp-on` | `data-wp-on--<event>="actions.handler"` | Attaches event listeners. Runs asynchronously by default (WP 6.8+). For synchronous event access (`preventDefault()`, `stopPropagation()`), wrap the action in `withSyncEvent()`. |
| `wp-on-window` | `data-wp-on-window--<event>="callbacks.handler"` | Attaches event listeners to the `window` object (e.g., `resize`, `copy`). Listener removed when the element unmounts. |
| `wp-on-document` | `data-wp-on-document--<event>="callbacks.handler"` | Attaches event listeners to the `document` object (e.g., `scroll`, `keydown`, `mousemove`). Listener removed on unmount. |

## Side effects & lifecycle

| Directive | Syntax | Description |
|-----------|--------|-------------|
| `wp-init` | `data-wp-init="callbacks.handler"` | Runs once when the DOM element is created. Can return a cleanup function. Supports multiple via `data-wp-init--<id>`. |
| `wp-watch` | `data-wp-watch="callbacks.handler"` | Runs when the node is created and whenever referenced state/context changes. Can return a cleanup function. Supports multiple via `data-wp-watch--<id>`. |
| `wp-run` | `data-wp-run="callbacks.handler"` | Executes during the node's render cycle. Uniquely supports hooks: `useState`, `useWatch`, `useEffect`, `useInit`, `useLayoutEffect`. Note: `ref` is `null` during first render. |

## List rendering

| Directive | Syntax | Description |
|-----------|--------|-------------|
| `wp-each` | `data-wp-each="state.array"` | Placed on a `<template>` element. Iterates over the array, rendering the template for each item. Item exposed as `context.item` (or `context.<propname>` via `data-wp-each--<propname>`). |
| `wp-each-key` | `data-wp-each-key="context.item.id"` | Placed on the template's inner element. Specifies the key path for efficient list diffing. |

## Element identity

| Directive | Syntax | Description |
|-----------|--------|-------------|
| `wp-key` | `data-wp-key="unique-value"` | Assigns a unique identifier to elements in iterations. |

## Router (from `@wordpress/interactivity-router`)

| Directive | Syntax | Description |
|-----------|--------|-------------|
| `wp-router-region` | `data-wp-router-region="region-id"` | Marks a region that gets updated during client-side navigation. In WP 6.9+, supports `attachTo` for regions on navigated pages but not the initial page. |

## Negation operator

Prefix any value reference with `!` to negate it:

```html
<div data-wp-bind--hidden="!state.isVisible">...</div>
```

## Cross-namespace references

Use the `namespace::reference` syntax to access another namespace's store:

```html
<button data-wp-on--click="core/query::actions.navigate">Next</button>
```

## Unique directive IDs (WordPress 6.9+)

To attach multiple directives of the same type to one element, use the `---` separator:

```html
<button
  data-wp-on--click---plugin-a="actions.handleA"
  data-wp-on--click---plugin-b="actions.handleB"
>
```

Both handlers fire. The ID after `---` must be unique per element.

## Deprecated

- **`data-wp-on-async`**: Use `data-wp-on` instead (all `wp-on` handlers are async by default since WP 6.8).
- **`data-wp-ignore`**: Deprecated in WordPress 6.9. Broke context inheritance and client-side navigation. Will be removed.

## External references

- [API Reference — Directives](https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/api-reference/#list-of-directives)
- [Changes to the Interactivity API in WordPress 6.9](https://make.wordpress.org/core/2025/11/12/changes-to-the-interactivity-api-in-wordpress-6-9/)
- [Interactivity API Best Practices in 6.8](https://make.wordpress.org/core/2025/03/24/interactivity-api-best-practices-in-6-8/)
