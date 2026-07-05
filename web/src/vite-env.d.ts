/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Vapi web call (browser = receptionist). Public key is safe to ship in client
  // JS; the assistant is created in the Vapi dashboard with default STT/LLM/voice.
  readonly VITE_VAPI_PUBLIC_KEY?: string
  readonly VITE_VAPI_ASSISTANT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
