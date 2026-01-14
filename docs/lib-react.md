# React Reference

> A JavaScript library for building user interfaces.

**Website:** https://react.dev  
**Version:** 19.x (latest)

## Overview

React is a declarative, component-based library for building user interfaces. It uses a virtual DOM for efficient updates and a unidirectional data flow.

## Core Concepts

### Components

Components are the building blocks of React applications:

```tsx
// Function component (recommended)
function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>
}

// Arrow function component
const Greeting = ({ name }: { name: string }) => (
  <h1>Hello, {name}!</h1>
)
```

### JSX

JSX is a syntax extension that lets you write HTML-like code in JavaScript:

```tsx
const element = (
  <div className="container">
    <h1>Title</h1>
    <p>{dynamicContent}</p>
    {isVisible && <span>Conditional</span>}
    {items.map(item => <li key={item.id}>{item.name}</li>)}
  </div>
)
```

## Hooks Reference

### useState

Adds state to functional components:

```tsx
const [count, setCount] = useState(0)
const [user, setUser] = useState<User | null>(null)
const [items, setItems] = useState<string[]>([])

// Update state
setCount(5)                    // Direct value
setCount(prev => prev + 1)     // Based on previous (recommended)

// Update objects (must create new reference)
setUser({ ...user, name: 'New Name' })

// Update arrays
setItems([...items, 'new item'])
setItems(items.filter(i => i !== 'remove'))
```

**Key Points:**
- State updates are asynchronous and batched
- Use functional updates when depending on previous state
- Never mutate state directly; always create new references

### useEffect

Synchronize with external systems:

```tsx
useEffect(() => {
  // Setup: runs after render
  const subscription = api.subscribe(id)
  
  // Cleanup: runs before next effect or unmount
  return () => {
    subscription.unsubscribe()
  }
}, [id])  // Dependencies: re-run when these change
```

**Dependency Array:**
- `[a, b]` - Run when a or b changes
- `[]` - Run once on mount, cleanup on unmount
- No array - Run after every render (rarely wanted)

**Common Patterns:**
```tsx
// Fetch data
useEffect(() => {
  let ignore = false
  async function fetchData() {
    const result = await api.get(id)
    if (!ignore) setData(result)
  }
  fetchData()
  return () => { ignore = true }
}, [id])

// Event listeners
useEffect(() => {
  const handler = (e: Event) => { /* ... */ }
  window.addEventListener('resize', handler)
  return () => window.removeEventListener('resize', handler)
}, [])

// Timers
useEffect(() => {
  const id = setInterval(() => setCount(c => c + 1), 1000)
  return () => clearInterval(id)
}, [])
```

### useRef

Access DOM elements or persist values without re-renders:

```tsx
// DOM reference
const inputRef = useRef<HTMLInputElement>(null)
// Usage: <input ref={inputRef} />
// Access: inputRef.current?.focus()

// Mutable value (doesn't trigger re-render)
const countRef = useRef(0)
countRef.current++  // No re-render
```

### useCallback

Memoize callback functions:

```tsx
// Without useCallback: new function every render
const handleClick = () => doSomething(id)

// With useCallback: same function reference unless id changes
const handleClick = useCallback(() => {
  doSomething(id)
}, [id])
```

Use when:
- Passing callbacks to memoized children
- Callbacks are dependencies of other hooks

### useMemo

Memoize expensive computations:

```tsx
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.localeCompare(b))
}, [items])
```

### useContext

Access context values:

```tsx
// Create context
const ThemeContext = createContext<'light' | 'dark'>('light')

// Provide value
<ThemeContext.Provider value="dark">
  <App />
</ThemeContext.Provider>

// Consume
const theme = useContext(ThemeContext)
```

### useReducer

Complex state logic:

```tsx
type State = { count: number }
type Action = { type: 'increment' } | { type: 'decrement' } | { type: 'set', payload: number }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment': return { count: state.count + 1 }
    case 'decrement': return { count: state.count - 1 }
    case 'set': return { count: action.payload }
  }
}

const [state, dispatch] = useReducer(reducer, { count: 0 })

dispatch({ type: 'increment' })
dispatch({ type: 'set', payload: 10 })
```

## Custom Hooks

Extract reusable logic:

```tsx
// useLocalStorage hook
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : initialValue
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}

// Usage
const [theme, setTheme] = useLocalStorage('theme', 'dark')
```

## Common Patterns

### Conditional Rendering

```tsx
// && operator
{isLoggedIn && <Profile />}

// Ternary
{isLoading ? <Spinner /> : <Content />}

// Early return
if (isLoading) return <Spinner />
if (error) return <Error message={error} />
return <Content />
```

### Lists and Keys

```tsx
{items.map(item => (
  <ListItem 
    key={item.id}  // Must be stable, unique identifier
    item={item}
  />
))}
```

**Key Rules:**
- Use stable IDs (not array index unless list is static)
- Keys must be unique among siblings
- Don't generate keys during render

### Event Handling

```tsx
// Click
<button onClick={() => handleClick(id)}>Click</button>
<button onClick={handleClick}>Click</button>

// Form
<input 
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>

// Submit
<form onSubmit={(e) => {
  e.preventDefault()
  handleSubmit()
}}>
```

### Controlled vs Uncontrolled

```tsx
// Controlled: React owns the state
const [value, setValue] = useState('')
<input value={value} onChange={e => setValue(e.target.value)} />

// Uncontrolled: DOM owns the state
const inputRef = useRef<HTMLInputElement>(null)
<input ref={inputRef} defaultValue="initial" />
// Access: inputRef.current?.value
```

## TypeScript Patterns

### Props

```tsx
interface Props {
  name: string
  age?: number  // Optional
  onSubmit: (data: FormData) => void
  children: React.ReactNode
}

function Component({ name, age = 18, onSubmit, children }: Props) {
  // ...
}
```

### Events

```tsx
// Mouse
onClick: React.MouseEvent<HTMLButtonElement>

// Form
onSubmit: React.FormEvent<HTMLFormElement>

// Input
onChange: React.ChangeEvent<HTMLInputElement>

// Keyboard
onKeyDown: React.KeyboardEvent<HTMLInputElement>
```

### Refs

```tsx
const divRef = useRef<HTMLDivElement>(null)
const inputRef = useRef<HTMLInputElement>(null)
const customRef = useRef<CustomComponentHandle>(null)
```

## Performance Tips

1. **Memoize expensive components:**
   ```tsx
   const MemoizedComponent = React.memo(Component)
   ```

2. **Use keys correctly** for list reconciliation

3. **Avoid inline object/array props:**
   ```tsx
   // Bad: new object every render
   <Component style={{ color: 'red' }} />
   
   // Good: stable reference
   const style = useMemo(() => ({ color: 'red' }), [])
   <Component style={style} />
   ```

4. **Lazy load components:**
   ```tsx
   const HeavyComponent = React.lazy(() => import('./HeavyComponent'))
   
   <Suspense fallback={<Loading />}>
     <HeavyComponent />
   </Suspense>
   ```

## VibeOS Shell UI Hooks

The shell UI uses custom hooks for session management:

```tsx
// useSession - manages OpenCode session state
const { messages, status, sendMessage, abort, reset } = useSession()

// useSSE - handles Server-Sent Events
const { connected, events } = useSSE(sessionId)

// useAutoFade - auto-hide UI when idle
const { visible, resetTimer } = useAutoFade(timeout)
```

## Resources

- [React Documentation](https://react.dev)
- [React Reference](https://react.dev/reference/react)
- [React Hooks](https://react.dev/reference/react/hooks)
- [TypeScript + React Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
