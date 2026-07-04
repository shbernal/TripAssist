/**
 * Resolve a path under `public/` against Vite's base URL.
 *
 * The demo ships to GitHub Pages under `/TripAssist/` (see vite.config.ts), so a
 * bare `/faces/camille.png` would 404 there. Everything that references a public
 * asset - faces, audio tracks, manifests - must go through here.
 */
export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}
