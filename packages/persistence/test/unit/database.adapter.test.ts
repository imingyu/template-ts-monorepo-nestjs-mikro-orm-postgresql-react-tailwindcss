import { describe, expect, it, vi } from 'vitest';
import {
    MikroOrmAdapterRegistry,
    MikroOrmDialectNotRegisteredError,
    createMikroOrmAdapterRegistry,
} from '../../src/adapters/mikro-orm/database.js';

describe('MikroOrmAdapterRegistry', () => {
    it('提供内建方言并允许注册未来数据库适配器', () => {
        const registry = createMikroOrmAdapterRegistry();
        const initialize = vi.fn();

        registry.register({ dialect: 'custom', initialize });

        const dialects = registry.getDialects();
        expect(dialects).toHaveLength(3);
        expect(dialects).toContain('custom');
        expect(dialects).toContain('mysql');
        expect(dialects).toContain('postgresql');
        expect(initialize).not.toHaveBeenCalled();
    });

    it('请求未注册方言时抛出明确错误', async () => {
        const registry = new MikroOrmAdapterRegistry();

        // 未注册方言会在读取配置前抛错，因此此处不需要构造有效 ORM 配置。
        await expect(registry.initialize('sqlite', undefined as never)).rejects.toThrow(
            MikroOrmDialectNotRegisteredError,
        );
    });
});
