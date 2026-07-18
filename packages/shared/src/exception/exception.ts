export class FieldInfo {
    constructor(public readonly name: string, public readonly value: any) {}

    static fromObject(obj: any) {
        const res = [] as FieldInfo[];

        if (typeof obj === 'object' && obj) {
            Object.keys(obj).forEach((key) => {
                const val = obj[key];
                const type = typeof val;
                const fieldVal =
                    type !== 'number' && type !== 'string' && type !== 'boolean' ? JSON.stringify(val) : val;
                res.push(new FieldInfo(key, fieldVal));
            });
        }
        return res;
    }
}

/** 唯一性校验失败异常 */
export class NotUniqueLogicException extends Error {
    constructor(message: string, public readonly fields: FieldInfo[]) {
        super(message);
        this.name = 'NotUniqueLogicException';
        if (Error.captureStackTrace) Error.captureStackTrace(this, NotUniqueLogicException);
    }
}

/** 找不到资源异常 */
export class NotFoundLogicException extends Error {
    constructor(message: string, public readonly fields: FieldInfo[]) {
        super(message);
        this.name = 'NotFoundLogicException';
        if (Error.captureStackTrace) Error.captureStackTrace(this, NotFoundLogicException);
    }
}

/** 违反的约束类型：
 * - HAS_CHILDREN: 存在子节点
 * - SELF_FIELD_RELATION_CONFLICT: 自身字段关系冲突（如 parentId 指向自己，或等级冲突等）
 */
export type ConstraintViolationType = 'HAS_CHILDREN' | 'SELF_FIELD_RELATION_CONFLICT';

/** 操作后将违反数据库约束（存在子节点、关联关系等）异常 */
export class ConstraintViolationLogicException extends Error {
    constructor(
        message: string,
        public readonly constraintType: ConstraintViolationType,
        public readonly source: FieldInfo[],
    ) {
        super(message);
        this.name = 'ConstraintViolationLogicException';

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ConstraintViolationLogicException);
        }
    }
}

/** 字段校验异常 */
export class ValidateFieldLogicException extends Error {
    constructor(message: string, public readonly fields: FieldInfo[]) {
        super(message);
        this.name = 'ValidateFieldLogicException';
        if (Error.captureStackTrace) Error.captureStackTrace(this, ValidateFieldLogicException);
    }
}

/** 必选字段为空异常 */
export class RequiredFieldEmptyLogicException extends Error {
    constructor(message: string, public readonly fieldName: string) {
        super(message);
        this.name = 'RequiredFieldEmptyLogicException';
        if (Error.captureStackTrace) Error.captureStackTrace(this, RequiredFieldEmptyLogicException);
    }
}

/** 数据库唯一约束冲突异常 */
export class DatabaseUniqueConstraintException extends Error {
    constructor(
        message: string,
        public readonly constraintName: string,
        public readonly fieldName: string,
        public readonly fieldValue: unknown,
    ) {
        super(message);
        this.name = 'DatabaseUniqueConstraintException';
        if (Error.captureStackTrace) Error.captureStackTrace(this, DatabaseUniqueConstraintException);
    }
}

/** 数据库外键约束冲突异常 */
export class DatabaseForeignKeyConstraintException extends Error {
    constructor(message: string, public readonly constraintName: string, public readonly details?: string) {
        super(message);
        this.name = 'DatabaseForeignKeyConstraintException';
        if (Error.captureStackTrace) Error.captureStackTrace(this, DatabaseForeignKeyConstraintException);
    }
}

/** 数据库操作异常（通用） */
export class DatabaseOperationException extends Error {
    constructor(message: string, public readonly operation: string, public readonly originalError?: Error) {
        super(message);
        this.name = 'DatabaseOperationException';
        if (Error.captureStackTrace) Error.captureStackTrace(this, DatabaseOperationException);
    }
}
