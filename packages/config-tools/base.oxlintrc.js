import { defineConfig } from 'oxlint';

export default defineConfig({
    plugins: ['typescript', 'unicorn', 'oxc', 'promise', 'import'],
    ignorePatterns: ['dist/**', 'coverage/**'],
    options: {
        typeAware: true,
        typeCheck: true,
        maxWarnings: 10,
    },
    rules: {
        'import/no-cycle': ['error', { maxDepth: 3 }],
    },
    categories: {
        correctness: 'error',
    },
    env: {
        builtin: true,
    },
});
