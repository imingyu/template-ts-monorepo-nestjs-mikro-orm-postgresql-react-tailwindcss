import { createEnum, type EnumValueOf } from '../helper/base.js';

/**
 * 分页查询的每页数量
 */
export const EnumPaginationLimit = createEnum(
    { 10: 10, 20: 20, 50: 50, 100: 100 } as const,
    {
        10: 10,
        20: 20,
        50: 50,
        100: 100,
    } as const,
);

/**
 * 分页查询的每页数量(编译期类型)
 */
export type IEnumPaginationLimit = EnumValueOf<typeof EnumPaginationLimit>;
