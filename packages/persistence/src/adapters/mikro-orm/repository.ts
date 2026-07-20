import type { EntityManager } from '@mikro-orm/core';
import type { RepositoryContext, TimingProfile } from '../../core/contracts.js';
import { resolveEntityManager } from './unit-of-work.js';

/**
 * 仅供适配器内部复用的技术基类。它刻意不提供通用 CRUD：
 * 公开仓储必须声明聚合专属的入参与出参。
 */
export abstract class MikroOrmRepository {
    constructor(private readonly defaultEm: EntityManager) {}

    protected entityManager(context: RepositoryContext): EntityManager {
        return resolveEntityManager(this.defaultEm, context);
    }

    protected async measure<T>(
        enabled: boolean | undefined,
        stage: string,
        operation: () => Promise<T>,
    ): Promise<{ result: T; timing?: TimingProfile }> {
        if (!enabled) {
            return { result: await operation() };
        }

        const startedAt = performance.now();
        const result = await operation();
        const elapsed = performance.now() - startedAt;

        return {
            result,
            timing: {
                totalMs: elapsed,
                stages: { [stage]: elapsed },
            },
        };
    }
}