// Flat ESLint config for the single TripAssist app (story + dashboard entries,
// both under src/). Type-aware against the app's tsconfigs; `pnpm lint` runs it.
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

export default tseslint.config(
  {
    // `tooling/` is TS run directly via tsx and lives outside the app tsconfigs,
    // so it stays out of the type-aware lint (as it did under the old per-app setup).
    ignores: ['dist', 'node_modules', '_site', 'tooling'],
  },

  // Base JS + TS recommended
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Type-aware linting against the app's own tsconfigs.
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Vite/Tailwind config files aren't in a browser tsconfig — Node globals, no type map.
  {
    files: ['*.{js,ts}'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // The React app itself: browser globals + React rules.
  {
    files: ['src/**/*.{ts,tsx}'],
    ...react.configs.flat.recommended,
    languageOptions: {
      ...react.configs.flat.recommended.languageOptions,
      globals: { ...globals.browser },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // The classic hook rules stay on; the newer React-Compiler lints in the v7
      // recommended set flag intentional patterns in these demos, so keep them off.
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/immutability': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },

  // Prettier last — turn off formatting rules that would fight Prettier.
  prettier,
)
