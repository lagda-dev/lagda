import { AsyncLocalStorage } from "node:async_hooks"

// Per-request DB query counter — the N+1 test guard (§5). A request runs inside `withQueryCounter`,
// any data-access call bumps the counter via `recordQuery`, and the test asserts the total stays
// within budget. Implemented with AsyncLocalStorage so the count follows the async call chain
// without threading a counter through every function signature.

type QueryCounterStore = {
  count: number
}

const storage = new AsyncLocalStorage<QueryCounterStore>()

// Run `operation` inside a fresh counter scope and report how many queries it issued alongside the
// operation's own result. Pure orchestration: the store is local to this call.
export const withQueryCounter = async <TResult>(operation: () => Promise<TResult>): Promise<{ result: TResult; queryCount: number }> => {
  const store: QueryCounterStore = { count: 0 }
  const result = await storage.run(store, operation)
  return { result, queryCount: store.count }
}

// Increment the active request's query counter. A no-op when called outside a counter scope so the
// data layer can call it unconditionally without crashing background work.
export const recordQuery = (): void => {
  const store = storage.getStore()
  if (store === undefined) {
    return
  }
  store.count += 1
}

// Read the active request's query count, or `0` when called outside a counter scope.
export const currentQueryCount = (): number => {
  const store = storage.getStore()
  return store === undefined ? 0 : store.count
}
