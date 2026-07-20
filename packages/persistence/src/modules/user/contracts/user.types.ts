import type { PageRequest } from '../../../core/contracts.js';

/** 用户仓储对外返回的稳定记录结构，不暴露受管理 ORM 实体。 */
export interface UserRecord {
    id: string;
    nickname: string;
    disabled: boolean;
    createdAt: Date;
    updatedAt: Date | null;
    deletedAt: Date | null;
}

/** 用户列表允许的显式筛选、分页与排序条件。 */
export interface UserListInput {
    filter?: {
        disabled?: boolean;
        keyword?: string;
    };
    page: PageRequest;
    sort?: {
        field: 'createdAt' | 'nickname';
        direction: 'asc' | 'desc';
    };
}

/** 创建用户所需的持久化参数。 */
export interface CreateUserInput {
    id: string;
    nickname: string;
    disabled: boolean;
}

/** 用户更新白名单；未列出的字段不能通过此仓储更新。 */
export interface UpdateUserInput {
    id: string;
    patch: {
        nickname?: string;
        disabled?: boolean;
    };
}

/** 软删除成功后的最小确认结果。 */
export interface DeleteUserOutput {
    id: string;
    deletedAt: Date;
}