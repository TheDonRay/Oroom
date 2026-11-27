import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

// ESLint flat config for the backend (plain JS, ES modules, Node).
// Formatting is Prettier's job; eslint-config-prettier turns off rules that would clash with it.
export default [
    { ignores: ['node_modules/', 'coverage/'] },
    js.configs.recommended,
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: globals.node,
        },
        rules: {
            // Allow unused args/vars that start with _ (e.g. Express's `next` in error handlers)
            'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        },
    },
    {
        files: ['tests/**/*.js', '**/*.test.js'],
        languageOptions: { globals: { ...globals.node, ...globals.vitest } },
    },
    prettier,
];
