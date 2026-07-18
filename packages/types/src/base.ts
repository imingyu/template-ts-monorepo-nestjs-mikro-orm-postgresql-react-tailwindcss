/**
 * 基础类型定义
 */

/** 主键 */
export type IPrimaryKey = string;

/**
 * 公共字段接口
 */
export interface IEntityBase {
    /** 主键ID */
    id: IPrimaryKey;
    /** 软删除时间戳 (null 表示未删除) */
    deletedAt: Date | null;
    /** 创建时间 */
    createdAt: Date;
    /** 更新时间 */
    updatedAt: Date | null;
}

/** 通用更新输入 */
export interface IUpdateInputBase {
    /** 主键ID */
    id: IPrimaryKey;
}
