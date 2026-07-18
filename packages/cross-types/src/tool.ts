export type IsNever<T> = [T] extends [never] ? true : false;
export type IsUndefined<T> = [T] extends [undefined] ? true : false;
export type IsNull<T> = [T] extends [null] ? true : false;
export type IsNil<T> = IsNever<T> extends true
    ? true
    : IsUndefined<T> extends true
    ? true
    : IsNull<T> extends true
    ? true
    : false;
export type IsAny<T> = 0 extends 1 & T ? true : false;
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export type IsPrimitive<T> = T extends string | number | boolean | symbol | bigint | null | undefined | Function
    ? true
    : false;

export type IfNil<T, S> = IsNil<T> extends true ? S : T;

export type NonNil<T> = [T] extends [never] ? never : T extends undefined | null | void ? never : T;
type PropOptionalIn<T, K extends PropertyKey> = K extends keyof T
    ? Required<Pick<T, K>> extends Pick<T, K>
        ? false
        : true
    : true;
type RequiredKeysFromTwo<A, B> = {
    [K in keyof A | keyof B]-?: PropOptionalIn<A, K> extends true ? (PropOptionalIn<B, K> extends true ? never : K) : K;
}[keyof A | keyof B];
type OptionalKeysFromTwo<A, B> = {
    [K in keyof A | keyof B]-?: PropOptionalIn<A, K> extends true
        ? PropOptionalIn<B, K> extends true
            ? K
            : never
        : never;
}[keyof A | keyof B];
type MergeObjects<A, B> = {
    [K in RequiredKeysFromTwo<A, B>]: (K extends keyof A ? A[K] : never) | (K extends keyof B ? B[K] : never);
} & {
    [K in OptionalKeysFromTwo<A, B>]?: (K extends keyof A ? A[K] : never) | (K extends keyof B ? B[K] : never);
} extends infer O
    ? {
          [K in keyof O]: O[K];
      }
    : never;
type IsPlainObject<T> = [T] extends [object] ? (T extends (...args: unknown[]) => unknown ? false : true) : false;
/**
 * 使两个对象形成联盟式的新对象结构，类似合并，但是有些特殊规则：
 * - Union<{id:string},never> -> {id:string}
 * - Union<never,{id:string}> -> {id:string}
 * - Union<{name:string},{id:string}> -> {name:string;id:string}
 * - Union<{name:string},{id?:string}> -> {name:string;id?:string}
 * - Union<{name?:string},{id?:string}> -> {name?:string;id?:string}
 * - Union<{name:string},{id?:string}|undefined> -> {name:string;id?:string}
 * - Union<{name:string},{id?:string}|undefined|null|void|never> -> {name:string;id?:string}
 */
export type Union<T, S> = NonNil<T> extends never
    ? NonNil<S>
    : NonNil<S> extends never
    ? NonNil<T>
    : IsPlainObject<NonNil<T>> extends true
    ? IsPlainObject<NonNil<S>> extends true
        ? MergeObjects<NonNil<T>, NonNil<S>>
        : NonNil<T> & NonNil<S>
    : NonNil<T> & NonNil<S>;

// type t1 = Union<{ id: string }, never>;
// type t2 = Union<never, { id: string }>;
// type t3 = Union<never, { id?: string }>;
// type t4 = Union<{ name: string }, { id?: string }>;
// type t5 = Union<{ name?: string }, { id5: string }>;
// type t6 = Union<{ name: string }, { id?: string } | undefined>;
// type t7 = Union<never, { id?: string } | undefined>;
// type t8 = Union<{ name: string } | undefined, { id?: string } | undefined>;

/** 检测T类型是否是对象，且包含必选属性 */
export type HasRequiredKeys<T> = T extends object
    ? keyof T extends keyof { [K in keyof T as T[K] extends Required<T>[K] ? K : never]: T[K] }
        ? true
        : false
    : false;

export type Constructor<T = object> = abstract new (...args: any[]) => T;
export type InstanceTypeOf<C> = C extends abstract new (...args: any[]) => infer T ? T : never;

export type PromiseValue<T> = T extends Promise<infer V> ? V : T;
