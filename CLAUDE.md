### Code Quality Standards

- **No Code Duplication**: Always prioritize creating shared utilities and centralized logic over duplicating code
- When similar logic exists in multiple files, extract it into shared utilities in the `util/` directory
- Prefer composition and reusable functions to maintain consistency and reduce maintenance overhead

- **No Magic Numbers**: Always use named constants instead of hardcoded numbers in code
- Define constants in `lib/consts.ts` with clear, descriptive names and comments
- Use constants to derive related values (e.g., `MAX_FOO * 2`)

### Component Definition Style

- **Function Declaration Preference**: Use the `function` keyword with a `props` parameter instead of arrow functions with destructured parameters. It is ok to omit `props` if it there are no props
- **Preferred Style**:
  ```tsx
  function ComponentName(props: { param1: type; param2: type }) {
    const { param1, param2 } = props;
    // component implementation
  }
  ```
- **Avoid**:
  ```tsx
  const ComponentName = ({
    param1,
    param2,
  }: {
    param1: type;
    param2: type;
  }) => {
    // component implementation
  };
  ```
- This applies to all React component definitions, including those wrapped with React.memo
- For React.memo components, use: `const Component = React.memo(function ComponentName(props) { ... })`

### TypeScript Configuration

- Uses strict TypeScript with path aliases (`@/*` maps to `./`)
- Extends expo/tsconfig.base configuration

## IMPORTANT: Sound Notification

After finishing responding to my request or running a command, run this command to notify me by sound:

```bash
afplay /System/Library/Sounds/Funk.aiff
```

Also play that sound if you need my input for anything, including if you need me to choose between options.

## Testing

When using the playwright MCP server, the dev server is at http://localhost:3016
Always ensure that text is legible.
