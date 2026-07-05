import { Story } from './story/Story'

export default function App() {
  return (
    <>
      {/* Keyboard skip link - first focusable element on the page. */}
      <a href="#main" className="sr-only sr-only-focusable">
        Aller au contenu principal
      </a>
      {/* Slow-drifting blue glows behind the whole story. */}
      <div aria-hidden="true" className="bg-blobs" />
      <Story />
    </>
  )
}
