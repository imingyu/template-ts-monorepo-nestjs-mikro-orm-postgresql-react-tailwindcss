/**
 * 院校业务逻辑层 - 通用类型定义
 */

import { type IEnumPaginationLimit } from '@mono-ts/cross-shared';
import { type IPrimaryKey } from './base.js';

/**
 * 分页查询参数
 */
export interface IPaginationParams {
    /** 查询关键字（用于模糊搜索） */
    keyword?: string;
    /** 页码，从1开始 */
    page?: number;
    /** 每页数量 */
    limit?: IEnumPaginationLimit;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

/**
 * 分页查询结果
 */
export interface IPaginationResult<T> {
    /** 数据列表 */
    data: T[];
    /** 总数量 */
    total: number;
    /** 当前页码 */
    page: number;
    /** 每页数量 */
    limit: IEnumPaginationLimit;
    /** 总页数 */
    totalPages: number;
}

/**
 * 查询条件基类
 */
export type IBaseQueryParams = IPaginationParams;

/**
 * 创建实体时的基础接口（不包含系统自动生成字段）
 */
export type CreateEntityInput<T> = Omit<
    T,
    'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'creater' | 'updater' | 'deleter'
>;

export interface PrimaryKeyInput {
    id: IPrimaryKey;
}

export interface FindByPrimaryKeyInput {
    id: IPrimaryKey;
    includeDeleted?: boolean;
}

/**
 * 更新实体时的基础接口
 */
export type UpdateEntityInput<T> = Partial<
    Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'creater' | 'updater' | 'deleter'>
> &
    PrimaryKeyInput;

/**
 * 软删除实体时的基础接口
 */
export type DeleteEntityInput = PrimaryKeyInput;
