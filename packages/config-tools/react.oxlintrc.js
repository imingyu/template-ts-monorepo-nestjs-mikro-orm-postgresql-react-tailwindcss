import { defineConfig } from 'oxlint';
import baseConfig from './base-oxlintrc.js';

export default defineConfig({
    extends: [baseConfig],
    plugins: ['typescript', 'unicorn', 'oxc', 'promise', 'import', 'react'],
});
