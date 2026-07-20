import type { MikroORM, Options } from '@mikro-orm/core';

/** 当前包内建支持的数据库方言。 */
export type BuiltInMikroOrmDialect = 'mysql' | 'postgresql';

/**
 * 可注册的 MikroORM 数据库适配器。
 * 新数据库驱动通过实现此接口接入，仓储模块不应出现方言分支。
 */
export interface MikroOrmDatabaseAdapter {
    /** 用于选择适配器的稳定方言名称，例如 `postgresql` 或 `mysql`。 */
    readonly dialect: string;
    /** 根据调用层提供的 ORM 配置初始化对应驱动。 */
    initialize(options: Partial<Options>): Promise<MikroORM>;
}

/** 请求了尚未注册的数据库方言时抛出。 */
export class MikroOrmDialectNotRegisteredError extends Error {
    constructor(dialect: string) {
        super(`No MikroORM database adapter is registered for dialect: ${dialect}`);
        this.name = 'MikroOrmDialectNotRegisteredError';
    }
}

/**
 * 数据库驱动注册表。内建适配器使用动态导入，避免初始化某一方言时加载另一方言的驱动。
 */
export class MikroOrmAdapterRegistry {
    private readonly adapters = new Map<string, MikroOrmDatabaseAdapter>();

    constructor(adapters: readonly MikroOrmDatabaseAdapter[] = []) {
        adapters.forEach((adapter) => this.register(adapter));
    }

    /** 注册或替换一个方言适配器；自定义驱动可通过此扩展点接入。 */
    register(adapter: MikroOrmDatabaseAdapter): void {
        this.adapters.set(adapter.dialect, adapter);
    }

    /** 初始化指定方言的 MikroORM 实例。 */
    async initialize(dialect: string, options: Partial<Options>): Promise<MikroORM> {
        const adapter = this.adapters.get(dialect);

        if (!adapter) {
            throw new MikroOrmDialectNotRegisteredError(dialect);
        }

        return adapter.initialize(options);
    }

    /** 返回当前可用的方言名称，便于启动配置校验与诊断。 */
    getDialects(): readonly string[] {
        return [...this.adapters.keys()];
    }
}

/** PostgreSQL 内建适配器。 */
export const postgresqlMikroOrmAdapter: MikroOrmDatabaseAdapter = {
    dialect: 'postgresql',
    async initialize(options) {
        const { MikroORM } = await import('@mikro-orm/postgresql');
        return MikroORM.init(options);
    },
};

/** MySQL 内建适配器。 */
export const mysqlMikroOrmAdapter: MikroOrmDatabaseAdapter = {
    dialect: 'mysql',
    async initialize(options) {
        const { MikroORM } = await import('@mikro-orm/mysql');
        return MikroORM.init(options);
    },
};

/** 创建包含 PostgreSQL 与 MySQL 内建适配器的注册表。 */
export const createMikroOrmAdapterRegistry = (): MikroOrmAdapterRegistry => {
    return new MikroOrmAdapterRegistry([postgresqlMikroOrmAdapter, mysqlMikroOrmAdapter]);
};
