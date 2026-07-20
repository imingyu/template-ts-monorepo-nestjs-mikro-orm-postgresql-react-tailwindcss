import { EntityManager } from '@mikro-orm/core';
import type { RepositoryContext, RepositoryTransaction } from '../../core/contracts.js';

export interface MikroOrmTransaction extends RepositoryTransaction {
    readonly em: EntityManager;
}

/**
 * 应用层在此显式开启事务边界。仓储只解析 context 中传入的 EntityManager，
 * 从而让跨仓储事务组合始终在用例层可见。
 */
export class MikroOrmUnitOfWork {
    constructor(private readonly em: EntityManager) {}

    async transactional<T>(work: (context: RepositoryContext) => Promise<T>): Promise<T> {
        return this.em.transactional(async (transactionalEm) => {
            const transaction: MikroOrmTransaction = {
                id: Symbol('mikro-orm-transaction'),
                em: transactionalEm,
            };

            return work({ transaction });
        });
    }
}

export const resolveEntityManager = (defaultEm: EntityManager, context: RepositoryContext): EntityManager => {
    const transaction = context.transaction;

    if (!transaction) {
        return defaultEm;
    }

    if (!('em' in transaction)) {
        throw new TypeError('Repository context contains a transaction from another persistence adapter.');
    }

    return (transaction as MikroOrmTransaction).em;
};