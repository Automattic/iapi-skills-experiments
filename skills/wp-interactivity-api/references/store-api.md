# Store API reference

The store API is the JavaScript interface for creating reactive state, actions, and callbacks.

## `store( namespace, definition, options? )`

Creates or extends a namespaced reactive store.

```javascript
import { store, getContext, getElement } from '@wordpress/interactivity';

const { state, actions } = store( 'myPlugin', {
  state: {
    isOpen: false,
    items: [],
    // Derived state via getter
    get hasItems() {
      return state.items.length > 0;
    },
  },
  actions: {
    *toggle() {
      state.isOpen = !state.isOpen;
    },
    *updateItem() {
      const context = getContext();
      context.selected = true;
    },
    // Async action
    *fetchData() {
      const response = yield fetch( '/api/data' );
      const data = yield response.json();
      state.items = data;
    },
  },
  callbacks: {
    logState() {
      console.log( 'State changed:', state.isOpen );
    },
    init() {
      // Runs on wp-init
      return () => {
        // Cleanup on unmount
      };
    },
  },
} );
```

**Options:**

- `{ lock: true }` — Makes the store private (prevents external namespace access).
- `{ lock: 'secret-string' }` — Locked with a key; only code knowing the key can unlock.

Multiple calls to `store()` for the same namespace deep-merge new properties into the existing store.

## `getContext( namespace? )`

Returns the local context of the current element. Optional `namespace` parameter for cross-namespace access.

```javascript
const context = getContext();
context.isOpen = !context.isOpen;

// Cross-namespace:
const otherContext = getContext( 'otherPlugin' );
```

## `getElement()`

Returns an object with:

- `ref` — The DOM element (`HTMLElement`). **Null during first render / hydration.**
- `attributes` — Read-only object containing the element's attributes.

```javascript
const { ref, attributes } = getElement();
if ( ref ) {
  ref.focus();
}
```

## `getConfig( namespace? )`

Returns static configuration set via `wp_interactivity_config()` on the server. Non-reactive, read-only.

```javascript
import { getConfig } from '@wordpress/interactivity';
const { apiUrl, nonce } = getConfig( 'myPlugin' );
```

## `getServerState( namespace? )`

Returns a read-only reactive object reflecting server-side state. Updated during client-side navigation (when `actions.navigate()` is used). Use in `wp-watch` or `wp-run` to subscribe to server-side state changes on navigation.

```javascript
import { getServerState } from '@wordpress/interactivity';
const serverState = getServerState();

callbacks: {
  onNavigate() {
    state.localCopy = serverState.someValue;
  },
}
```

## `getServerContext( namespace? )`

Same as `getServerState` but for local context. Read-only, updated on navigation. Fully replaced (not merged) on navigation.

## `withScope( callback )`

Preserves the Interactivity API scope for callbacks executed outside the runtime (e.g., `setInterval`, `setTimeout`, `requestAnimationFrame`).

```javascript
callbacks: {
  initSlideShow() {
    setInterval(
      withScope( () => {
        actions.nextImage();
      } ),
      3000
    );
  },
}
```

## `withSyncEvent( callback )`

Wraps an action to provide synchronous access to the event object. Required when using `event.preventDefault()`, `event.stopPropagation()`, or `event.stopImmediatePropagation()`.

```javascript
import { store, withSyncEvent } from '@wordpress/interactivity';

store( 'myPlugin', {
  actions: {
    *handleSubmit: withSyncEvent( function* ( event ) {
      event.preventDefault();
      // handle form
    } ),
    *handleClick: withSyncEvent( function* ( event ) {
      event.preventDefault();
      yield someAsyncWork();
    } ),
  },
} );
```

Since WP 6.8, accessing synchronous event methods without `withSyncEvent()` triggers a deprecation warning. In a future WP release, it will break.

## `splitTask()`

Yields to the main thread in async actions to avoid long tasks and improve INP (Interaction to Next Paint).

```javascript
actions: {
  *processItems() {
    for ( const item of state.items ) {
      yield splitTask();
      processItem( item );
    }
  },
}
```

## Hooks (usable inside `wp-run` callbacks)

| Hook | Description |
|------|-------------|
| `useState` | Manages local component state |
| `useWatch` | Reactive hook re-executed when reactive variables change |
| `useEffect` | Effect hook (runs after render) |
| `useInit` | Runs once on initialization |
| `useLayoutEffect` | Effect hook (runs synchronously after DOM mutations) |

These hooks are imported from `@wordpress/interactivity` and can only be used inside `wp-run` callbacks.

## Actions — generator functions

The Interactivity API uses generator functions for all actions instead of regular functions or `async/await` to maintain proper scope tracking.

```javascript
// CORRECT — all actions use generator functions
actions: {
  *increment() {
    state.count += 1;
  },
  *fetchData() {
    state.isLoading = true;
    const response = yield fetch( '/api/data' );
    const data = yield response.json();
    state.items = data;
    state.isLoading = false;
  },
}

// WRONG — loses reactive scope
actions: {
  increment() { // DO NOT DO THIS
    state.count += 1;
  },
  async fetchData() { // DO NOT DO THIS
    const response = await fetch( '/api/data' );
  },
}
```

### TypeScript types for actions (WP 6.9+)

```typescript
import { store, type AsyncAction, type TypeYield } from '@wordpress/interactivity';

actions: {
  *fetchData(): AsyncAction<void> {
    const data: TypeYield<ReturnType<typeof fetch>> = yield fetch( url );
  },
}
```

## State management concepts

### Global state vs. local context

- **Global state** (`state`): Defined via `store()` in JS and `wp_interactivity_state()` in PHP. Shared across all interactive regions with the same namespace.
- **Local context** (`context`): Defined via `data-wp-context` in HTML and `wp_interactivity_data_wp_context()` in PHP. Scoped to the element and its descendants. Each block instance has independent context.

### Derived state

Computed values using JavaScript getters. Automatically recalculates when dependencies change:

```javascript
state: {
  items: [],
  get hasItems() {
    return state.items.length > 0;
  },
  get itemCount() {
    return state.items.length;
  },
}
```

### Direct mutation

Direct mutation is supported and preferred (unlike React):

```javascript
state.list.push( 'item' );  // works correctly
state.count += 1;            // works correctly
```

No need for spread operators or immutable patterns.

## Router (`@wordpress/interactivity-router`)

### `actions.navigate( href, options? )`

Performs client-side navigation, updating all `data-wp-router-region` areas.

Options: `force`, `html`, `replace`, `timeout`, `loadingAnimation`, `screenReaderAnnouncement`.

### `actions.prefetch( url, options? )`

Prefetches a page and its assets (stylesheets, script modules).

Options: `force`, `html`.

### Dynamic import pattern

Core blocks dynamically import the router to minimize bundle size:

```javascript
actions: {
  *navigate() {
    const { ref } = getElement();
    const { actions } = yield import( '@wordpress/interactivity-router' );
    yield actions.navigate( ref.href );
  },
}
```

## External references

- [API Reference](https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/api-reference/)
- [Understanding global state, local context and derived state](https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/core-concepts/undestanding-global-state-local-context-and-derived-state/)
- [@wordpress/interactivity-router](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-interactivity-router/)
