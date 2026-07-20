/** 持久化层未找到记录时抛出的基础错误。 */
export class PersistenceNotFoundError extends Error {
    constructor(entityName: string, id: string) {
        super(`${entityName} not found: ${id}`);
        this.name = 'PersistenceNotFoundError';
    }
}

/** 数据库唯一约束冲突映射出的基础错误。 */
export class PersistenceUniqueConstraintError extends Error {
    constructor(constraint: string) {
        super(`Unique constraint violated: ${constraint}`);
        this.name = 'PersistenceUniqueConstraintError';
    }
}