/**
 * 对象差异对比结果
 */
export interface ObjectDifference {
    old: unknown;
    new: unknown;
}

/**
 * 对象差异对比配置
 */
export interface ObjectComparisonOptions {
    /** 需要排除的字段列表 */
    excludeFields?: string[];
    /** 仅对比包含的字段列表（如果设置，则只对比这些字段） */
    includeFields?: string[];
    /** 是否忽略 undefined 值 */
    ignoreUndefined?: boolean;
    /** 是否深度比较嵌套对象 */
    deep?: boolean;
    equal?: (key: string, oldValue: any, newValue: any) => boolean | void;
}

/**
 * 比较两个对象的差异
 * @param oldObj 旧对象
 * @param newObj 新对象
 * @param options 配置选项
 * @returns 有差异的字段结果
 * @example
 * ```typescript
 * const old = { name: 'John', age: 30, email: 'john@example.com' };
 * const newObj = { name: 'John', age: 31, email: 'john@example.com', city: 'NYC' };
 * const diff = compareObjects(old, newObj);
 * // 结果: { age: { old: 30, new: 31 }, city: { old: undefined, new: 'NYC' } }
 *
 * // 只对比指定字段
 * const diff2 = compareObjects(old, newObj, { includeFields: ['age', 'name'] });
 * // 结果: { age: { old: 30, new: 31 } }
 *
 * // 排除指定字段
 * const diff3 = compareObjects(old, newObj, { excludeFields: ['email'] });
 * // 结果: { age: { old: 30, new: 31 }, city: { old: undefined, new: 'NYC' } }
 * ```
 */
export function compareObjects(
    oldObj: Record<string, any>,
    newObj: Record<string, any>,
    options: ObjectComparisonOptions = {},
): Record<string, ObjectDifference> {
    const { excludeFields = [], includeFields, ignoreUndefined = false, deep = true, equal } = options;

    const differences: Record<string, ObjectDifference> = {};

    // 获取所有字段（包括新增和删除的字段）
    const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);

    for (const key of allKeys) {
        // 如果设置了 includeFields，只对比包含的字段
        if (includeFields && includeFields.length > 0) {
            if (!includeFields.includes(key)) {
                continue;
            }
        }

        // 跳过需要排除的字段
        if (excludeFields.includes(key)) {
            continue;
        }

        const oldValue = oldObj?.[key];
        const newValue = newObj?.[key];

        // 如果设置忽略 undefined，且两个值都是 undefined，则跳过
        if (
            ignoreUndefined &&
            ((oldValue === undefined && newValue === undefined) ||
                (oldValue === null && newValue === undefined) ||
                (oldValue === null && newValue === null))
        ) {
            continue;
        }
        // 如果新对象中不存在该字段，则跳过
        if (!(key in newObj)) {
            continue;
        }

        // 深度比较模式
        if (deep && isPlainObject(oldValue) && isPlainObject(newValue)) {
            // 递归比较嵌套对象
            const nestedDiff = compareObjects(oldValue, newValue, options);
            if (Object.keys(nestedDiff).length > 0) {
                // 将嵌套的差异展平，使用点号分隔
                for (const [nestedKey, nestedValue] of Object.entries(nestedDiff)) {
                    differences[`${key}.${nestedKey}`] = nestedValue;
                }
            }
            continue;
        }

        // 比较值是否相同
        let areEqual = equal ? equal(key, oldValue, newValue) : isEqual(oldValue, newValue);
        areEqual = areEqual === undefined ? isEqual(oldValue, newValue) : areEqual;
        if (!areEqual) {
            differences[key] = {
                old: oldValue,
                new: newValue,
            };
        }
    }

    return differences;
}

/**
 * 判断是否为普通对象
 */
function isPlainObject(value: any): value is Record<string, any> {
    if (value === null || typeof value !== 'object') {
        return false;
    }
    // 排除数组、日期、正则等特殊对象
    return Object.prototype.toString.call(value) === '[object Object]';
}

/**
 * 深度比较两个值是否相等
 */
function isEqual(value1: any, value2: any): boolean {
    // 基本类型比较
    if (value1 === value2) {
        return true;
    }

    // null 和 undefined 处理
    if (value1 == null || value2 == null) {
        return value1 === value2;
    }

    // 类型不同
    if (typeof value1 !== typeof value2) {
        return false;
    }

    // 日期比较
    if (value1 instanceof Date && value2 instanceof Date) {
        return value1.getTime() === value2.getTime();
    }

    // 数组比较
    if (Array.isArray(value1) && Array.isArray(value2)) {
        if (value1.length !== value2.length) {
            return false;
        }
        return value1.every((item, index) => isEqual(item, value2[index]));
    }

    // 对象比较（使用 JSON 序列化）
    if (typeof value1 === 'object' && typeof value2 === 'object') {
        try {
            return JSON.stringify(value1) === JSON.stringify(value2);
        } catch {
            return false;
        }
    }

    return false;
}
