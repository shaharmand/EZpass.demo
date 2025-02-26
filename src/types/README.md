# Type System Notes

## Ant Design Icons

We've made a deliberate decision to use Ant Design icons directly without wrapping them or providing pointer event handlers. Here's why:

1. Ant Design's icon type system requires `onPointerEnterCapture` and `onPointerLeaveCapture` props, but these are not actually required for functionality.
2. The type system is overly strict in this case, as the icons work perfectly fine without these props.
3. While we could wrap each icon to provide these props, this would add unnecessary complexity and potential performance overhead.

### Our Approach

1. Use icons directly from `@ant-design/icons`
2. Ignore TypeScript errors related to missing pointer event handlers
3. If needed, use `// @ts-ignore` comments for icon props

Example usage:

```typescript
// Direct usage (may show TypeScript errors)
import { UserOutlined } from '@ant-design/icons';
<UserOutlined />

// With type assertion if needed
<UserOutlined {...({} as any)} />
```

This approach prioritizes simplicity and maintainability over strict type checking for this specific case. 