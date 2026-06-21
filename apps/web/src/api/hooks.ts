// Back-compat re-export surface. The hook layer now lives one-module-per-resource under
// `./resources/*` (§2: organized by domain, small focused files). Existing imports of `useHealth` and
// friends from `../api/hooks` keep working; new code can import from `../api/resources/resources`
// directly or from here.

export * from "./resources/resources"
export { queryKeys } from "./queryKeys"
export { ApiError } from "./fetchJson"
