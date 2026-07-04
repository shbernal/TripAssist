import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Two projects in one run so the Node backend and the jsdom frontend share a
// single Vitest invocation. Reuses Vite's ESM/TS transpile pipeline - no ts-jest.
export default defineConfig({
  test: {
    projects: [
      {
        // Backend: plain Node environment for server/ + scripts/ logic.
        test: {
          name: 'server',
          environment: 'node',
          // Persist to an ephemeral in-memory SQLite DB - no disk, no cross-test bleed.
          // Claude gates cleared: tests exercise the deterministic fallbacks even if
          // the developer's shell exports real credentials (§5.2 - fallbacks are a
          // tests/CI path, never the live path).
          env: {
            TRIPASSIST_DB: ':memory:',
            ANTHROPIC_API_KEY: '',
            ANTHROPIC_AUTH_TOKEN: '',
            ANTHROPIC_VIA_CLI: '',
          },
          include: ['server/**/*.test.ts', 'scripts/**/*.test.ts'],
        },
      },
      {
        // Frontend: jsdom + React for web/ components and hooks.
        plugins: [react()],
        test: {
          name: 'web',
          environment: 'jsdom',
          globals: true,
          setupFiles: ['./vitest.setup.ts'],
          include: ['web/src/**/*.test.{ts,tsx}'],
        },
      },
    ],
  },
})
