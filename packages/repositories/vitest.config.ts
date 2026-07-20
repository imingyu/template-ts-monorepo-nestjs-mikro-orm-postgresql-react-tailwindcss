import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // 测试环境
        environment: 'node',

        // 全局配置
        globals: true,

        // 测试文件匹配模式
        include: ['./test/unit/**/*.ts', './test/integration/**/*.ts'],

        // 排除目录
        exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],

        // 超时时间（集成测试可能需要更长时间）
        testTimeout: 30000,
        hookTimeout: 30000,

        // 覆盖率配置
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            exclude: ['node_modules/', 'dist/', './test/**/*.*', '**/*.config.ts'],
        },

        // 串行执行测试（避免数据库竞争条件）
        sequence: {
            concurrent: false,
        },

        // 禁用文件并行（关键：防止多个测试文件同时运行）
        fileParallelism: false,

        // 在每个测试文件之间隔离环境
        isolate: true,

        // 最大并发数（集成测试建议使用串行）
        maxConcurrency: 1,

        // 设置文件（在测试运行前执行）
        setupFiles: ['./test/setup.ts'],
    },
});
