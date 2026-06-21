// Where the landing-page CTAs point. The marketing site can be served from a different origin than
// the app, so the app base is overridable at build time via VITE_APP_URL; it defaults to same-origin
// relative paths, which is correct when the app serves the landing page itself.
const APP_BASE_URL = import.meta.env.VITE_APP_URL ?? ""

export const APP_LOGIN_URL = `${APP_BASE_URL}/login`
export const APP_SIGNUP_URL = `${APP_BASE_URL}/signup`

export const GITHUB_REPO_URL = "https://github.com/lagda-dev/lagda"
