// Flat ESLint config for the demo (an isolated workspace member). The root config
// deliberately `ignores: ['apps']` — its type-aware project map only covers the
// MVP's tsconfig.server/web — so the demo carries its own lint here, mirroring the
// root's frontend rules but pointed at the demo's own tsconfig.
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

export default tseslint.config(
  {
    ignores: ['dist', 'node_modules'],
  },

  // Base JS + TS recommended
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Type-aware linting against the demo's own tsconfigs.
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
      // recommended set flag intentional patterns in this demo, so keep them off.
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/immutability': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },

  // Prettier last — turn off formatting rules that would fight Prettier.
  prettier,
)
