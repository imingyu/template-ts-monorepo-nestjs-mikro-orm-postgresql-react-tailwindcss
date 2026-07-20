import {
    EntityManager,
    type FilterQuery,
    type QueryOrderMap,
    type RequiredEntityData,
    type EntityData,
    type FromEntityType,
    type EntityClass,
    type ObjectQuery,
    type Loaded,
    ReferenceKind,
} from '@mikro-orm/core';
import {
    NotFoundLogicException,
    NotUniqueLogicException,
    FieldInfo,
    isValidNormalizeValue,
    normalizeObject,
    type ObjectDifference,
    compareObjects,
} from '@mono-ts/shared';
import { omit, pick } from 'lodash-es';
import { BaseEntity } from './entity.js';
import { nowDate } from '../helper/date.js';
import { serializeEntity } from '../helper/serialize.js';
import type {
    DeleteEntityInput,
    FindByPrimaryKeyInput,
    IPaginationParams,
    IPaginationResult,
    IUpdateInputBase,
} from '@mono-ts/types';
import { User } from '../common/entity/user.entity.js';

export type RepositoryMethodArg<
    TMethodArg,
    TMethodInputArg,
    TMethodInputAllowUndefined extends boolean = false,
> = TMethodArg & (TMethodInputAllowUndefined extends true ? { input?: TMethodInputArg } : { input: TMethodInputArg });

export interface DataComparisonDetail {
    entityName: string;
    entityId: string;
    diffFields: Record<string, ObjectDifference>;
}

export interface UpdateTransactionalBeforeState {
    dataComparisonDetails?: DataComparisonDetail[];
}

export interface IRepositoryBase<
    TMethodArg extends object = any,
    TCreateInput extends object = any,
    TUpdateInput extends IUpdateInputBase = IUpdateInputBase,
> {
    /**
     * 是否需要执行唯一性约束检查
     */
    isNeedCheckUniqueness<F extends 'create' | 'update'>(
        from: F,
        input: F extends 'create' ? TCreateInput : TUpdateInput,
    ): boolean;
    /**
     * 检查唯一性约束（创建和更新时将根据isNeedCheckUniqueness的结果执行约束检查）
     */
    uniquenessValidator<F extends 'create' | 'update'>(
        from: F,
        arg: F extends 'create'
            ? RepositoryMethodArg<TMethodArg, TCreateInput>
            : RepositoryMethodArg<TMethodArg, TUpdateInput>,
    ): Promise<void>;
    /** 创建记录 */
    create(arg: RepositoryMethodArg<TMethodArg, TCreateInput>): Promise<string>;
    /** 创建校验器 */
    createValidator(arg: RepositoryMethodArg<TMethodArg, TCreateInput>): Promise<void>;
    /** 获取用于数据对比的字段列表 */
    getDataComparisonFields(): undefined | string[];
    /** 更新记录 */
    updateById(arg: RepositoryMethodArg<TMethodArg, TUpdateInput>): Promise<void>;
    /** 更新校验器 */
    updateValidator(arg: RepositoryMethodArg<TMethodArg, TUpdateInput>): Promise<void>;
    /** 根据ID查找记录，查找不到将报错 */
    findById(arg: RepositoryMethodArg<TMethodArg, FindByPrimaryKeyInput>): Promise<unknown>;
    /** 分页查询 */
    findPaginated(arg: RepositoryMethodArg<TMethodArg, IPaginationParams, true>): Promise<IPaginationResult<unknown>>;
    /** 软删除记录 */
    deleteById(arg: RepositoryMethodArg<TMethodArg, DeleteEntityInput>): Promise<void>;
    /** 删除校验器 - 返回查询到的实体（如果已查询），避免重复查询 */
    deleteValidator(arg: RepositoryMethodArg<TMethodArg, DeleteEntityInput>): Promise<unknown>;
    /** 检查是否是创建者 */
    isCreater(
        arg: RepositoryMethodArg<
            TMethodArg,
            {
                id: string;
                creater: string;
            }
        >,
    ): Promise<boolean>;
    /** 根据ID查找同时检查是否是创建者，不是将报错 */
    findByIdAndCheckCreater(
        arg: RepositoryMethodArg<TMethodArg, FindByPrimaryKeyInput & { creater: string }>,
    ): Promise<unknown>;
}

/**
 * MikroORM 查询条件类型（包含软删除）
 */
export type SafeFilterQuery<T> = ObjectQuery<T> & Partial<{ deleted: boolean | null }>;

/**
 * 排除 id 的查询条件
 */
type QueryWithoutId<T> = Omit<ObjectQuery<T>, 'id'> & Partial<{ id: { $ne: string } }>;

export interface IRequestInfo {
    ip: string;
    userAgent: string;
    url: string;
    referer: string;
}

export interface RepositoryMethodArgInfo {
    em?: EntityManager;
    loginUserId?: string;
    /** api层调用repo层时，应该传递该数据，代表客户端请求api时的信息 */
    req?: IRequestInfo;
    /** 更新时是否启用数据对比（仅对更新操作有效） */
    whenUpdateEnabledDataComparison?: boolean;
    /** 方法从运行开始到结束的额外状态数据 */
    methodRunLifeState?: Record<string, unknown>;
}

export interface RequiredEmRepositoryMethodArgInfo extends RepositoryMethodArgInfo {
    em: EntityManager;
}

export interface RepositoryTransactionalCreateMethodArgInfo<T = any> {
    onBefore?(arg: RequiredEmRepositoryMethodArgInfo): Promise<T> | T;
    onAfter?(arg: RequiredEmRepositoryMethodArgInfo & { createdKey: string; beforeState: T }): Promise<void> | void;
}

export interface RepositoryTransactionalMethodArgInfo<T = any> {
    onBefore?(arg: RequiredEmRepositoryMethodArgInfo): Promise<T> | T;
    onAfter?(arg: RequiredEmRepositoryMethodArgInfo & { beforeState: T }): Promise<void> | void;
}

export abstract class CoreRepository<
    TEntityClass extends object = any,
    TMethodArg extends RepositoryMethodArgInfo = RepositoryMethodArgInfo,
> {
    constructor(protected readonly _em: EntityManager) {}

    protected getEntityManager(arg: TMethodArg) {
        return arg.em || this._em;
    }

    /**
     * 将实体转换为普通对象（递归序列化）
     * 优化：批量检查第一个元素，假设数组元素类型一致，避免每个元素都执行类型检查
     * @param entity 实体或实体数组
     * @returns 普通对象或普通对象数组
     */
    protected toPlainObject<T extends object>(entity: T): TEntityClass;
    protected toPlainObject<T extends object>(entity: T[]): TEntityClass[];
    protected toPlainObject<T extends object>(entity: T | T[]): TEntityClass | TEntityClass[] {
        return serializeEntity(entity) as TEntityClass;
    }

    /**
     * 将分页结果转换为普通对象
     * @param result 分页结果
     * @returns 转换后的分页结果
     */
    protected toPaginationPlainObject(result: IPaginationResult<any>): IPaginationResult<TEntityClass> {
        return {
            ...result,
            data: serializeEntity(result.data) as TEntityClass[],
        };
    }

    protected getOperator(arg: RepositoryMethodArg<TMethodArg, any>) {
        if (arg.loginUserId) {
            return this.getEntityManager(arg).getReference(User, arg.loginUserId) as User;
        }
        if (arg.input && typeof arg.input === 'object' && 'createdBy' in arg.input && arg.input.createdBy) {
            return this.getEntityManager(arg).getReference(User, (arg.input as any).createdBy) as User;
        }
    }
}

const equalEntityKey = (a: unknown, b: unknown) => {
    const aKey = typeof a === 'string' ? a : typeof a === 'object' && a && 'id' in a ? (a as any).id : undefined;
    const bKey = typeof b === 'string' ? b : typeof b === 'object' && b && 'id' in b ? (b as any).id : undefined;
    return aKey === bKey;
};

const isEntityKey = (a: unknown, b: unknown) => {
    return (
        (typeof a === 'string' && typeof b === 'string') ||
        (typeof a === 'object' && a && 'id' in a && typeof b === 'object' && b && 'id' in b) ||
        (typeof a === 'string' && typeof b === 'object' && b && 'id' in b) ||
        (typeof b === 'string' && typeof a === 'object' && a && 'id' in a)
    );
};

/**
 * 基础 Repository 抽象类
 * 提供通用的 CRUD 操作
 */
export abstract class BaseRepository<
    TEntityClass extends BaseEntity<string>,
    TMethodArg extends RepositoryMethodArgInfo = RepositoryMethodArgInfo,
    TCreateInput extends Partial<TEntityClass> = Partial<TEntityClass>,
    TUpdateInput extends IUpdateInputBase = IUpdateInputBase & Partial<TCreateInput>,
>
    extends CoreRepository<TEntityClass, TMethodArg>
    implements IRepositoryBase<TMethodArg, TCreateInput, TUpdateInput>
{
    protected readonly allowUpdateFields: Readonly<Array<keyof TEntityClass>>;
    protected readonly noAllowUpdateFields: Readonly<Array<keyof TEntityClass>>;
    private relationFields: (keyof TEntityClass)[] | undefined;
    private allFields: (keyof TEntityClass)[] | undefined;

    constructor(
        protected readonly _EntityClass: EntityClass<TEntityClass>,
        protected readonly _em: EntityManager,
    ) {
        super(_em);
        this.allowUpdateFields = this.getAllowUpdateFields();
        this.noAllowUpdateFields = this.getNoAllowUpdateFields();
    }

    async checkCreater(
        arg: RepositoryMethodArg<TMethodArg, FindByPrimaryKeyInput & { creater: string }, false>,
    ): Promise<void> {
        const em = this.getEntityManager(arg);

        const count = await em.count(this._EntityClass, {
            id: arg.input.id,
            creater: arg.input.creater,
            deleted: false,
        } as FilterQuery<TEntityClass>);
        if (!count) {
            throw new NotFoundLogicException(`非创建者无权访问`, [new FieldInfo('id', arg.input.id)]);
        }
    }

    async findByIdAndCheckCreater(
        arg: RepositoryMethodArg<TMethodArg, FindByPrimaryKeyInput & { creater: string }, false>,
    ): Promise<TEntityClass> {
        const em = this.getEntityManager(arg);

        const entity = await em.findOne(this._EntityClass, {
            id: arg.input.id,
            creater: arg.input.creater,
            deleted: false,
        } as FilterQuery<TEntityClass>);
        if (!entity) {
            throw new NotFoundLogicException(`非创建者无权访问`, [new FieldInfo('id', arg.input.id)]);
        }

        return this.toPlainObject(entity);
    }
    /** 检查是否是创建者
     * 查找当前TEntityClass.id= arg.input.id 的记录，
     * 并检查 creater 字段是否与 arg.input.creater 相同
     * 如果是，则返回 true，否则返回 false
     */
    async isCreater(arg: RepositoryMethodArg<TMethodArg, { id: string; creater: string }, false>): Promise<boolean> {
        const em = this.getEntityManager(arg);

        const count = await em.count(this._EntityClass, {
            id: arg.input.id,
            creater: arg.input.creater,
        } as FilterQuery<TEntityClass>);
        return count > 0;
    }

    /**
     * 获取允许更新的字段列表
     * 子类应该重写此方法
     */
    protected getAllowUpdateFields(): Readonly<Array<keyof TEntityClass>> {
        return [] as Array<keyof TEntityClass>;
    }

    /**
     * 获取不允许更新的字段列表
     * 子类应该重写此方法
     */
    protected getNoAllowUpdateFields(): Readonly<Array<keyof TEntityClass>> {
        return ['id', 'createdAt', 'updatedAt', 'deletedAt'] as Array<keyof TEntityClass>;
    }

    /**
     * 构建关键字查询条件
     * 子类应该重写此方法来定义具体的搜索字段
     */
    protected buildKeywordQuery(keyword: string): FilterQuery<TEntityClass>[] {
        return [];
    }

    /**
     * 构建查询条件
     */
    protected buildQuery(params: any, appendDefaultCondition = true): SafeFilterQuery<TEntityClass> {
        const query: SafeFilterQuery<TEntityClass> = appendDefaultCondition
            ? ({ deleted: false } as SafeFilterQuery<TEntityClass>)
            : ({} as SafeFilterQuery<TEntityClass>);

        Object.entries(params).forEach(([key, value]) => {
            if (
                (['keyword', 'page', 'limit', 'sortBy', 'sortOrder'] as Array<keyof IPaginationParams>).includes(
                    key as any,
                )
            ) {
                return;
            }

            if (isValidNormalizeValue(value)) {
                if (value !== null) {
                    if (Array.isArray(value)) {
                        // 如果是数组，使用 $in 查询
                        (query as Record<string, unknown>)[key] = { $in: normalizeObject(value) };
                    } else {
                        // 否则直接赋值
                        (query as Record<string, unknown>)[key] =
                            typeof value === 'object' ? normalizeObject(value) : value;
                    }
                } else {
                    // 如果值为 null，则查询该字段 IS NULL
                    (query as Record<string, unknown>)[key] = { $eq: null };
                }
            }
        });

        return query;
    }

    /**
     * 构建排序条件
     */
    protected buildSort(params: Pick<IPaginationParams, 'sortBy' | 'sortOrder'>): QueryOrderMap<TEntityClass> {
        if (!params.sortBy) {
            return { createdAt: 'desc' } as QueryOrderMap<TEntityClass>;
        }
        return {
            [params.sortBy]: params.sortOrder === 'asc' ? 'asc' : 'desc',
        } as QueryOrderMap<TEntityClass>;
    }

    /**
     * 是否需要执行唯一性约束检查
     */
    isNeedCheckUniqueness<F extends 'create' | 'update'>(
        from: F,
        input: F extends 'create' ? TCreateInput : TUpdateInput,
    ): boolean {
        return false;
    }

    /**
     * 获取唯一性约束字段列表
     * 子类应重写此方法返回需要检查唯一性的字段名数组
     * 例如: return ['name', 'code'] 表示 name+code 组合唯一
     */
    protected getUniquenessFields(): Array<keyof TEntityClass> {
        return [];
    }

    /**
     * 检查唯一性约束（创建和更新时将根据isNeedCheckUniqueness的结果执行约束检查）
     */
    async uniquenessValidator<F extends 'create' | 'update'>(
        from: F,
        arg: F extends 'create'
            ? RepositoryMethodArg<TMethodArg, TCreateInput>
            : RepositoryMethodArg<TMethodArg, TUpdateInput>,
    ): Promise<void> {
        const uniquenessFields = this.getUniquenessFields();

        // 如果没有指定唯一性字段，使用所有字段（过滤空值但保留 null）
        let query: QueryWithoutId<TEntityClass>;
        if (uniquenessFields.length === 0) {
            query = this.buildQuery(arg.input) as QueryWithoutId<TEntityClass>;
        } else {
            // 只使用唯一性字段构建查询
            query = pick(this.buildQuery(arg.input), uniquenessFields) as QueryWithoutId<TEntityClass>;
        }

        delete query.id;

        // 如果是更新操作，排除当前记录
        if ('id' in arg.input && arg.input.id) {
            query.id = { $ne: arg.input.id };
        }

        const exists = await this.getEntityManager(arg).count(this._EntityClass, query as FilterQuery<TEntityClass>);
        if (exists > 0) {
            throw new NotUniqueLogicException('唯一性校验失败', FieldInfo.fromObject(query as Record<string, unknown>));
        }
    }

    /**
     * 检查是否可被删除
     * @returns 返回查询到的实体（如果已查询），避免 deleteById 中重复查询
     */
    async deleteValidator(
        arg: RepositoryMethodArg<TMethodArg, DeleteEntityInput>,
    ): Promise<Loaded<TEntityClass, never> | null> {
        // 子类实现
        return null;
    }

    /**
     * 检查是否可被更新
     */
    async updateValidator(
        arg: RepositoryMethodArg<TMethodArg & { findedEntity?: TEntityClass }, TUpdateInput>,
    ): Promise<void> {
        // 子类实现
    }

    /**
     * 检查是否可被创建
     */
    async createValidator(arg: RepositoryMethodArg<TMethodArg, TCreateInput>): Promise<void> {
        // 子类实现
    }

    /** 事务性创建前的钩子，子类可重写此方法以在创建前后执行自定义逻辑，如果这个值不为undefined，则create方法将使用事务执行 */
    protected transactionalCreate(
        arg: RepositoryMethodArg<TMethodArg, TCreateInput>,
    ): RepositoryTransactionalCreateMethodArgInfo | undefined {
        return undefined;
    }

    /** 事务性更新前的钩子，子类可重写此方法以在更新前后执行自定义逻辑，如果这个值不为undefined，则update方法将使用事务执行 */
    protected transactionalUpdate(
        arg: RepositoryMethodArg<TMethodArg & { findedEntity: TEntityClass }, TUpdateInput>,
    ): RepositoryTransactionalMethodArgInfo | undefined {
        return undefined;
    }

    /** 事务性删除前的钩子，子类可重写此方法以在删除前后执行自定义逻辑，如果这个值不为undefined，则delete方法将使用事务执行 */
    protected transactionalDelete(
        arg: RepositoryMethodArg<TMethodArg, DeleteEntityInput>,
    ): RepositoryTransactionalMethodArgInfo | undefined {
        return undefined;
    }

    getEntityTableName() {
        return this._em.getMetadata().get(this._EntityClass).tableName;
    }

    /**
     * 创建记录
     */
    async create(arg: RepositoryMethodArg<TMethodArg, TCreateInput>) {
        const creater = this.getOperator(arg);
        if (!creater) {
            throw new NotFoundLogicException(`找不到创建人`, [new FieldInfo('createdBy', '')]);
        }
        const createHandler = async (em: EntityManager) => {
            // 规范化输入数据（删除undefined和NaN）
            const normalizedInput = normalizeObject(arg.input) as TCreateInput;
            const normalizedArg = { ...arg, em, input: normalizedInput };

            // 唯一性检查
            if (this.isNeedCheckUniqueness('create', normalizedInput)) {
                await this.uniquenessValidator('create', normalizedArg);
            }

            // 业务验证
            await this.createValidator(normalizedArg);

            // 创建实体
            const entity = em.create(this._EntityClass, {
                ...normalizedInput,
                creater: creater,
            } as RequiredEntityData<TEntityClass, never, false>);
            await em.persist(entity).flush();

            return String(entity.id);
        };

        const transactionalCreateInfo = this.transactionalCreate(arg);
        if (!transactionalCreateInfo) {
            return await createHandler(this.getEntityManager(arg));
        }
        return await this.getEntityManager(arg).transactional(async (em) => {
            const beforeState = transactionalCreateInfo.onBefore
                ? await transactionalCreateInfo.onBefore({ ...arg, em })
                : undefined;
            const createdKey = await createHandler(em);
            if (transactionalCreateInfo.onAfter) {
                await transactionalCreateInfo.onAfter({ ...arg, em, createdKey, beforeState });
            }
            return createdKey;
        });
    }

    /**
     * 删除（逻辑删除）
     * 找不到记录时抛出异常（与 findById、updateById 行为一致）
     */
    async deleteById(arg: RepositoryMethodArg<TMethodArg, DeleteEntityInput>) {
        const deleter = this.getOperator(arg);
        if (!deleter) {
            throw new NotFoundLogicException(`找不到删除人`, [new FieldInfo('deletedBy', '')]);
        }

        const deleteHandler = async (em: EntityManager) => {
            // 业务验证 - 如果 validator 已经查询了实体，则复用
            let entity: Loaded<TEntityClass, never> | null = await this.deleteValidator({
                ...arg,
                em,
                input: arg.input,
            });

            // 如果 validator 没有返回实体，则查询
            if (!entity) {
                entity = await em.findOne(this._EntityClass, {
                    id: arg.input.id,
                    deleted: false,
                } as FilterQuery<TEntityClass>);
            }

            // 找不到记录时抛出异常（统一行为）
            if (!entity) {
                throw new NotFoundLogicException(`找不到记录`, [new FieldInfo('id', arg.input.id)]);
            }

            // 软删除
            entity.deletedAt = nowDate();
            entity.deleted = true;
            entity.deleter = deleter;
            await em.flush();
        };

        const transactionalDeleteInfo = this.transactionalDelete(arg);
        if (!transactionalDeleteInfo) {
            return await deleteHandler(this.getEntityManager(arg));
        }
        return await this.getEntityManager(arg).transactional(async (em) => {
            const beforeState = transactionalDeleteInfo.onBefore
                ? await transactionalDeleteInfo.onBefore({ ...arg, em })
                : undefined;
            await deleteHandler(em);
            if (transactionalDeleteInfo.onAfter) {
                await transactionalDeleteInfo.onAfter({ ...arg, em, beforeState });
            }
        });
    }

    pickSafeUpdateFields(input: TUpdateInput | TEntityClass | TEntityClass): Partial<TUpdateInput> {
        // 过滤允许更新的字段
        let res = this.allowUpdateFields.length ? pick(input, this.allowUpdateFields) : input;
        if (this.noAllowUpdateFields.length) {
            res = omit(res, this.noAllowUpdateFields as string[]);
        }
        return res as Partial<TUpdateInput>;
    }

    /** 子类按需返回需要进行数据对比的字段列表 */
    getDataComparisonFields(): undefined | string[] {
        return this.getAllEntityFields() as string[];
    }

    /**
     * 获取实体的所有数据库字段名
     * @returns 字段名数组
     */
    protected getAllEntityFields(): (keyof TEntityClass)[] {
        if (!this.allFields) {
            const metadata = this._em.getMetadata().get(this._EntityClass);
            const allFields: (keyof TEntityClass)[] = [];

            // 获取所有属性（properties）
            metadata.props.forEach((prop) => {
                // 排除虚拟字段（persist === false）
                if (prop.persist === false) {
                    return;
                }
                // 排除关系字段
                if (prop.kind === ReferenceKind.MANY_TO_MANY) {
                    return;
                }
                allFields.push(prop.name);
            });

            this.allFields = allFields;
        }
        return this.allFields.concat([]);
    }

    protected getRelationFields(): (keyof TEntityClass)[] {
        if (!this.relationFields) {
            const metadata = this._em.getMetadata().get(this._EntityClass);
            const relationFields: (keyof TEntityClass)[] = [];

            // 获取所有属性（properties）
            metadata.props.forEach((prop) => {
                // 仅包含关系字段
                if (
                    prop.kind === ReferenceKind.MANY_TO_MANY ||
                    prop.kind === ReferenceKind.MANY_TO_ONE ||
                    prop.kind === ReferenceKind.ONE_TO_MANY ||
                    prop.kind === ReferenceKind.ONE_TO_ONE
                ) {
                    relationFields.push(prop.name);
                }
            });

            this.relationFields = relationFields;
        }
        return this.relationFields.concat([]);
    }

    /**
     * 根据 id 更新
     */
    async updateById(arg: RepositoryMethodArg<TMethodArg, TUpdateInput>) {
        if (!arg.input.id) {
            throw new NotFoundLogicException(`找不到记录`, [new FieldInfo('id', arg.input.id)]);
        }
        const updater = this.getOperator(arg);
        if (!updater) {
            throw new NotFoundLogicException(`找不到更新人`, [new FieldInfo('updatedBy', '')]);
        }
        const em = this.getEntityManager(arg);
        // 查找实体
        const findedEntity = await em.findOne(this._EntityClass, {
            id: arg.input.id,
            deleted: false,
        } as FilterQuery<TEntityClass>);

        if (!findedEntity) {
            throw new NotFoundLogicException(`找不到记录`, [new FieldInfo('id', arg.input.id)]);
        }

        const updateHandler = async (em: EntityManager, transactionalBeforeState?: unknown) => {
            // 过滤允许更新的字段
            const safeParams = this.pickSafeUpdateFields(arg.input);

            // 唯一性检查
            if (this.isNeedCheckUniqueness('update', arg.input)) {
                // 合并当前数据和更新数据
                const mergedParams = {
                    ...this.pickSafeUpdateFields(findedEntity as TEntityClass),
                    ...safeParams,
                    id: arg.input.id,
                } as unknown as TUpdateInput;

                await this.uniquenessValidator('update', {
                    ...arg,
                    em,
                    input: mergedParams,
                });
            }

            const plainFindedEntity = this.toPlainObject(findedEntity);

            // 业务验证
            await this.updateValidator({
                ...arg,
                em,
                input: arg.input,
                findedEntity: plainFindedEntity,
            });

            const finalUpdateData = { ...safeParams, updater } as EntityData<FromEntityType<TEntityClass>, false>;
            // 更新实体
            em.assign(findedEntity as TEntityClass, finalUpdateData, {
                onlyOwnProperties: true,
            });
            await em.flush();
            const dataComparisonResults: DataComparisonDetail[] = [];
            if (
                typeof transactionalBeforeState === 'object' &&
                transactionalBeforeState !== null &&
                'dataComparisonDetails' in transactionalBeforeState
            ) {
                dataComparisonResults.push(
                    ...((transactionalBeforeState as UpdateTransactionalBeforeState).dataComparisonDetails || []),
                );
            }
            if (arg.whenUpdateEnabledDataComparison) {
                const dataComparisonFields = this.getDataComparisonFields();
                if (dataComparisonFields && dataComparisonFields.length > 0) {
                    const relationFields = this.getRelationFields();
                    dataComparisonResults.push({
                        entityName: this.getEntityTableName(),
                        entityId: String(findedEntity.id),
                        diffFields: compareObjects(plainFindedEntity, finalUpdateData, {
                            includeFields: dataComparisonFields,
                            equal(key, oldValue, newValue) {
                                if (
                                    relationFields.includes(key as keyof TEntityClass) &&
                                    isEntityKey(oldValue, newValue)
                                ) {
                                    return equalEntityKey(oldValue, newValue);
                                }
                                if (
                                    (oldValue === undefined && newValue === undefined) ||
                                    (oldValue === null && newValue === undefined) ||
                                    (oldValue === null && newValue === null)
                                ) {
                                    return true;
                                }
                            },
                        }),
                    });
                }
            }
            if (dataComparisonResults.length && arg.methodRunLifeState) {
                arg.methodRunLifeState.dataComparisonResults = dataComparisonResults;
            }
        };

        const transactionalUpdateInfo = this.transactionalUpdate({
            ...arg,
            em,
            findedEntity,
        });
        if (!transactionalUpdateInfo) {
            return await updateHandler(em);
        }
        return await em.transactional(async (em) => {
            const beforeState = transactionalUpdateInfo.onBefore
                ? await transactionalUpdateInfo.onBefore({ ...arg, em })
                : undefined;
            await updateHandler(em, beforeState);
            if (transactionalUpdateInfo.onAfter) {
                await transactionalUpdateInfo.onAfter({ ...arg, em, beforeState });
            }
        });
    }

    /**
     * 根据 id 查找
     */
    async findById(arg: RepositoryMethodArg<TMethodArg, FindByPrimaryKeyInput>): Promise<TEntityClass> {
        const entity = await this.getEntityManager(arg).findOne(
            this._EntityClass,
            arg.input.includeDeleted
                ? ({
                      id: arg.input.id,
                  } as FilterQuery<TEntityClass>)
                : ({
                      id: arg.input.id,
                      deleted: false,
                  } as FilterQuery<TEntityClass>),
        );

        if (!entity) {
            throw new NotFoundLogicException(`找不到记录`, [new FieldInfo('id', arg.input.id)]);
        }

        return this.toPlainObject(entity);
    }

    /**
     * 根据条件查找单个实体
     */
    async findOne(arg: RepositoryMethodArg<TMethodArg, FilterQuery<TEntityClass>>): Promise<TEntityClass | null> {
        const entity = await this.getEntityManager(arg).findOne(this._EntityClass, {
            ...((arg.input || {}) as ObjectQuery<TEntityClass>),
            deleted: false,
        } as FilterQuery<TEntityClass>);

        if (!entity) {
            return null;
        }

        return this.toPlainObject(entity);
    }

    /**
     * 查找或创建实体
     * 如果实体存在则返回，不存在则创建
     * 使用悲观锁（SELECT FOR UPDATE）防止并发竞态条件
     */
    async findOrCreate(
        arg: RepositoryMethodArg<TMethodArg, TCreateInput | { where: FilterQuery<TEntityClass>; create: TCreateInput }>,
    ): Promise<TEntityClass> {
        const em = this.getEntityManager(arg);

        let where: FilterQuery<TEntityClass>;
        let createData: TCreateInput;

        // 判断是简单模式还是复杂模式
        if ('where' in arg.input && 'create' in arg.input) {
            // 复杂模式：分别指定 where 和 create
            where = arg.input.where;
            createData = arg.input.create;
        } else {
            // 简单模式：input 既是查找条件也是创建数据
            where = arg.input as unknown as FilterQuery<TEntityClass>;
            createData = arg.input as TCreateInput;
        }

        // 查询是否已存在（不再使用 transactionOptions.lockMode）
        const existingEntity = await em.findOne(this._EntityClass, {
            ...((where || {}) as ObjectQuery<TEntityClass>),
            deleted: false,
        } as FilterQuery<TEntityClass>);

        if (existingEntity) {
            return this.toPlainObject(existingEntity);
        }

        // 直接调用 create（create 返回主键），然后用同一 em 查询并返回实体对象
        const pk = await this.create({
            ...arg,
            input: createData,
        });

        const created = await em.findOne(this._EntityClass, { id: pk, deleted: false } as FilterQuery<TEntityClass>);
        if (!created) {
            // 理论上不应该发生，但为了类型安全返回 NotFound 异常
            throw new NotFoundLogicException(`创建后找不到记录`, [new FieldInfo('id', pk)]);
        }

        return this.toPlainObject(created);
    }

    getPaginatedFindPopulate(where: FilterQuery<NoInfer<TEntityClass>>): string | string[] | undefined {
        return undefined;
    }

    /**
     * 分页查询
     */
    async findPaginated(
        arg: RepositoryMethodArg<TMethodArg, IPaginationParams, true>,
    ): Promise<IPaginationResult<TEntityClass>> {
        const params = arg.input || {};
        const page = params.page ?? 1;
        const limit = params.limit ?? 20;
        const offset = (page - 1) * limit;

        const em = this.getEntityManager(arg);

        // 构建基础查询条件
        const baseQuery = this.buildQuery(params);

        // 如果有 keyword 参数，添加关键字搜索条件
        let query: FilterQuery<TEntityClass>;
        if (params.keyword) {
            const keywordQueries = this.buildKeywordQuery(params.keyword);
            if (keywordQueries.length > 0) {
                // 将基础查询和关键字查询结合，使用 $and 确保所有条件都满足
                query = {
                    $and: [
                        baseQuery as FilterQuery<TEntityClass>,
                        { $or: keywordQueries } as FilterQuery<TEntityClass>,
                    ],
                } as FilterQuery<TEntityClass>;
            } else {
                query = baseQuery as FilterQuery<TEntityClass>;
            }
        } else {
            query = baseQuery as FilterQuery<TEntityClass>;
        }

        // 构建排序条件
        const orderBy = this.buildSort(params);

        const [data, total] = await em.findAndCount(this._EntityClass, query, {
            limit,
            offset,
            orderBy,
            populate: this.getPaginatedFindPopulate(query) as undefined,
        });

        const totalPages = Math.ceil(total / limit);

        return this.toPaginationPlainObject({
            data,
            total,
            page,
            limit,
            totalPages,
        });
    }
}
