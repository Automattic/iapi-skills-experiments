# Server-Side Rendering for Interactivity API

- **Faster initial render**: HTML arrives ready with correct values.
- **No layout shift**: Hidden elements stay hidden from the first paint.
- **SEO benefits**: Search engines see fully rendered content.
- **Graceful degradation**: Content displays correctly even before JavaScript loads.

## Setup Requirements

### 1. Enable Server Directive Processing

**For components using `block.json`:**

```json
{
  "supports": {
    "interactivity": true
  }
}
```

**For themes/plugins without `block.json`:**

Use `wp_interactivity_process_directives()` to manually process directives (see "Themes and Plugins without block.json" section below).

### 2. Initialize Global State with `wp_interactivity_state()`

Define initial state values in PHP before rendering:

```php
wp_interactivity_state( 'myPlugin', array(
  'fruits'    => array( 'Apple', 'Banana', 'Cherry' ),
  'isLoading' => false,
  'count'     => 3,
));
```

The state is serialized and available to client JavaScript automatically.

### 3. Initialize Local Context with `wp_interactivity_data_wp_context()`

For element-scoped context:

```php
<?php
$context = array(
  'isOpen'   => false,
  'itemId'   => 42,
  'itemName' => 'Example',
);
?>
<div
  data-wp-interactive="myPlugin"
  <?php echo wp_interactivity_data_wp_context( $context ); ?>
>
  <button data-wp-on--click="actions.toggle">
    Toggle
  </button>
  <div data-wp-bind--hidden="!context.isOpen">
    Content for <?php echo esc_html( $context['itemName'] ); ?>
  </div>
</div>
```

## Derived State on the Server

When derived state affects the initial HTML, define it in PHP to avoid layout shifts.

### Static Derived State

When the derived value is known at render time:

```php
$fruits    = array( 'Apple', 'Banana', 'Cherry' );
$hasFruits = count( $fruits ) > 0;

wp_interactivity_state( 'myPlugin', array(
  'fruits'    => $fruits,
  'hasFruits' => $hasFruits,
));
```

### Dynamic Derived State (using closures)

When the value depends on context (e.g., inside `data-wp-each` loops):

```php
wp_interactivity_state( 'myPlugin', array(
  'fruits'       => array( 'apple', 'banana', 'cherry' ),
  'shoppingList' => array( 'apple', 'cherry' ),
  'onShoppingList' => function() {
    $state   = wp_interactivity_state();
    $context = wp_interactivity_get_context();
    return in_array( $context['item'], $state['shoppingList'] ) ? 'Yes' : 'No';
  },
));
```

The closure is evaluated during directive processing for each element.

## Complete Example: List with Server Rendering

### PHP (render callback or template)

```php
<?php
$fruits = array( 'Apple', 'Banana', 'Cherry' );

wp_interactivity_state( 'myFruitPlugin', array(
  'fruits'    => $fruits,
  'hasFruits' => count( $fruits ) > 0,
  'mango'     => __( 'Mango' ),
));
?>

<div data-wp-interactive="myFruitPlugin">
  <button data-wp-on--click="actions.addMango">
    <?php esc_html_e( 'Add Mango' ); ?>
  </button>
  <button data-wp-on--click="actions.clearAll">
    <?php esc_html_e( 'Clear All' ); ?>
  </button>

  <ul data-wp-bind--hidden="!state.hasFruits">
    <template data-wp-each="state.fruits">
      <li data-wp-text="context.item"></li>
    </template>
  </ul>

  <p data-wp-bind--hidden="state.hasFruits">
    <?php esc_html_e( 'No fruits available.' ); ?>
  </p>
</div>
```

### JavaScript (view.js)

```javascript
import { store } from '@wordpress/interactivity';

const { state } = store( 'myFruitPlugin', {
  state: {
    get hasFruits() {
      return state.fruits.length > 0;
    },
  },
  actions: {
    addMango() {
      state.fruits.push( state.mango );
    },
    clearAll() {
      state.fruits = [];
    },
  },
} );
```

### Rendered Output (initial HTML)

```html
<div data-wp-interactive="myFruitPlugin">
  <button data-wp-on--click="actions.addMango">Add Mango</button>
  <button data-wp-on--click="actions.clearAll">Clear All</button>

  <ul>
    <li>Apple</li>
    <li>Banana</li>
    <li>Cherry</li>
  </ul>

  <p hidden>No fruits available.</p>
</div>
```

The `hidden` attribute is added server-side because `state.hasFruits` is true.

## Serializing Values for Client Use

Use `wp_interactivity_state()` to pass server values to client JavaScript:

### Translations

```php
wp_interactivity_state( 'myPlugin', array(
  'labels' => array(
    'add'    => __( 'Add Item', 'textdomain' ),
    'remove' => __( 'Remove Item', 'textdomain' ),
    'empty'  => __( 'No items found', 'textdomain' ),
  ),
));
```

### Ajax URLs and Nonces

```php
wp_interactivity_state( 'myPlugin', array(
  'ajaxUrl' => admin_url( 'admin-ajax.php' ),
  'nonce'   => wp_create_nonce( 'myPlugin_nonce' ),
  'restUrl' => rest_url( 'myPlugin/v1/' ),
));
```

### Client Usage

```javascript
const { state } = store( 'myPlugin', {
  actions: {
    *fetchData() {
      const formData = new FormData();
      formData.append( 'action', 'my_action' );
      formData.append( '_ajax_nonce', state.nonce );

      const response = yield fetch( state.ajaxUrl, {
        method: 'POST',
        body: formData,
      } );
      return yield response.json();
    },
  },
} );
```

### Static configuration with `wp_interactivity_config()`

For values that never change (feature flags, i18n strings):

```php
wp_interactivity_config( 'myPlugin', array(
  'showLikeButton' => is_user_logged_in(),
  'lightboxText'   => __( 'Enlarged image' ),
) );
```

Available client-side via `getConfig()`:

```javascript
import { getConfig } from '@wordpress/interactivity';
const { showLikeButton } = getConfig( 'myPlugin' );
```

Use `wp_interactivity_config()` for static, non-reactive values. Use `wp_interactivity_state()` for values that change reactively.

## Themes and Plugins without block.json

For themes or plugins not using `block.json`, use `wp_interactivity_process_directives()`:

```php
<?php
wp_interactivity_state( 'myTheme', array(
  'menuOpen' => false,
));

ob_start();
?>

<nav
  data-wp-interactive="myTheme"
  data-wp-class--is-open="state.menuOpen"
>
  <button data-wp-on--click="actions.toggleMenu">
    Menu
  </button>
  <ul data-wp-bind--hidden="!state.menuOpen">
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
  </ul>
</nav>

<?php
$html = ob_get_clean();
echo wp_interactivity_process_directives( $html );
```

Only call `wp_interactivity_process_directives()` once at the outermost template level.

## Adding Directives via `WP_HTML_Tag_Processor`

Core blocks use `WP_HTML_Tag_Processor` to add interactivity directives to rendered HTML:

```php
$p = new WP_HTML_Tag_Processor( $block_content );
$p->next_tag();
$p->set_attribute( 'data-wp-interactive', 'core/query' );
$p->set_attribute( 'data-wp-router-region', 'query-' . $query_id );
$p->set_attribute( 'data-wp-context', '{}' );
$content = $p->get_updated_html();
```

When manually encoding context (not using `wp_interactivity_data_wp_context()`), use the four hex flags:

```php
wp_json_encode( $data, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP )
```

## PHP Helper Functions Reference

| Function | Purpose |
|----------|---------|
| `wp_interactivity_state( $namespace, $state )` | Initialize/get global state for a namespace |
| `wp_interactivity_config( $namespace, $config )` | Set/get static, non-reactive configuration |
| `wp_interactivity_data_wp_context( $context )` | Generate `data-wp-context` attribute |
| `wp_interactivity_get_context( $namespace )` | Get current context during directive processing |
| `wp_interactivity_process_directives( $html )` | Manually process directives (themes/plugins) |

## Common Pitfalls

### Server Directive Processing Not Enabled

**For `block.json` users:** Without `supports.interactivity`, directives are not processed:

```json
{
  "supports": {
    "interactivity": true
  }
}
```

**For themes/plugins:** Ensure `wp_interactivity_process_directives()` is called on the HTML output.

### Derived State Missing on Server

If `state.hasFruits` is only defined in JavaScript, the `hidden` attribute won't be set:

```html
<!-- Without server state: shows briefly then hides (layout shift) -->
<p data-wp-bind--hidden="state.hasFruits">No fruits</p>
```

### State Not Matching Client Expectations

Ensure PHP and JavaScript derived state logic matches:

```php
// PHP
'hasFruits' => count( $fruits ) > 0,
```

```javascript
// JavaScript — must match PHP logic
get hasFruits() {
  return state.fruits.length > 0;
}
```

## External References

- [WordPress: Server-side rendering](https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/core-concepts/server-side-rendering/)
- [WordPress: Understanding global state, local context and derived state](https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/core-concepts/undestanding-global-state-local-context-and-derived-state/)
- [WordPress: Interactivity API Reference](https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/api-reference/)
