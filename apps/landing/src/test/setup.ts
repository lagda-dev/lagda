import "@testing-library/jest-dom/vitest"

// jsdom (as wired by vitest here) ships a non-functional localStorage stub, so the theme hook's
// persistence can't be exercised. Install a minimal in-memory Storage implementation for tests.
const createMemoryStorage = (): Storage => {
  const store = new Map<string, string>()
  return {
    get length() {
      return store.size
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => void store.delete(key),
    setItem: (key: string, value: string) => void store.set(key, String(value)),
  }
}

Object.defineProperty(globalThis, "localStorage", { value: createMemoryStorage(), configurable: true })
