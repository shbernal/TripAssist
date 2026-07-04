import { Story } from './story/Story'

export default function App() {
  return (
    <>
      {/* Keyboard skip link — first focusable element on the page. */}
      <a href="#main" className="sr-only sr-only-focusable">
        Aller au contenu principal
      </a>
      <Story />
    </>
  )
}
