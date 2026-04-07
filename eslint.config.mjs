import globals from 'globals'
import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  { languageOptions: { globals: globals.browser } },
  {
    rules: {
      'no-unused-vars': 'error',
      'no-unused-expressions': 'error',
      'no-console': 'warn',
      'no-undef': 'error',
      'prefer-const': 'error'
      // 'typescript-eslint/no-explicit-any': 'warn'
    }
  },
  {
    languageOptions: {
      globals: {
        process: 'readonly'
      }
    }
  },
  {
    ignores: ['.node_modules/*', 'dist']
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended
]