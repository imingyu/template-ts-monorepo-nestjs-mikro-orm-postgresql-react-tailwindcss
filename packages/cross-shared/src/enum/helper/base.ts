type ObjectValueOf<T> = T extends Record<string, infer V> ? V : never;

export type EnumInstance<
    TLabelValueMap extends Record<string, string | number> = Record<string, string | number>,
    TKeyValueMap extends Record<string, ObjectValueOf<TLabelValueMap>> = Record<string, ObjectValueOf<TLabelValueMap>>,
> = Readonly<TKeyValueMap> &
    Readonly<{
        readonly _ENUM: TLabelValueMap;
        readonly _KEYS: TKeyValueMap;
        hasValue: (val: unknown) => boolean;
        getKey: (val: ObjectValueOf<TLabelValueMap>) => keyof TKeyValueMap;
        getValues: () => ObjectValueOf<TLabelValueMap>[];
        getLabel: (val: TLabelValueMap[keyof TLabelValueMap]) => keyof TLabelValueMap;
        getOptions: () => Array<{ label: keyof TLabelValueMap; value: TLabelValueMap[keyof TLabelValueMap] }>;
        getOptionsAndIncludeAll: <A = string>(
            allOptionLabel?: A,
        ) => Array<
            { label: A; value: '' } | { label: keyof TLabelValueMap; value: TLabelValueMap[keyof TLabelValueMap] }
        >;
        asFilledObject: <V>(propFilledVal: V) => Record<ObjectValueOf<TLabelValueMap>, V>;
    }>;

const DefaultAllOptionLabel = '全部';

export const createEnum = <
    TLabelValueMap extends Record<string, string | number>,
    TKeyValueMap extends Record<string, ObjectValueOf<TLabelValueMap>>,
>(
    values: TLabelValueMap,
    keys: TKeyValueMap,
): EnumInstance<TLabelValueMap, TKeyValueMap> => {
    const getEnumOptions = () => {
        return Object.keys(values).map((key) => {
            return {
                label: key as keyof TLabelValueMap,
                value: values[key] as TLabelValueMap[keyof TLabelValueMap],
            };
        });
    };
    return Object.freeze({
        ...keys,
        _KEYS: keys,
        _ENUM: Object.values(values) as ObjectValueOf<TLabelValueMap>,
        hasValue: (val: unknown) => {
            return Object.values(values).includes(val as any);
        },
        getKey: (val: ObjectValueOf<TLabelValueMap>) => {
            return Object.keys(keys).find((item) => keys[item] === val) as keyof TKeyValueMap;
        },
        getValues: () => Object.values(values) as ObjectValueOf<TLabelValueMap>[],
        getLabel: (val: TLabelValueMap[keyof TLabelValueMap]) => {
            return Object.keys(values).find((item) => values[item] === val) as keyof TLabelValueMap;
        },
        getOptions: getEnumOptions,
        getOptionsAndIncludeAll: <A = string>(allOptionLabel?: A) => {
            return (
                [{ value: '', label: allOptionLabel ?? DefaultAllOptionLabel }] as Array<
                    | { value: ''; label: A }
                    | { value: TLabelValueMap[keyof TLabelValueMap]; label: keyof TLabelValueMap }
                >
            ).concat(getEnumOptions());
        },
        asFilledObject<V>(val: V) {
            return (Object.values(values) as ObjectValueOf<TLabelValueMap>[]).reduce(
                (sum, ov) => {
                    sum[ov] = val;
                    return sum;
                },
                {} as Record<ObjectValueOf<TLabelValueMap>, V>,
            );
        },
    }) as unknown as EnumInstance<TLabelValueMap, TKeyValueMap>;
};

export type EnumValueOf<T extends { _ENUM: Record<string, string | number> }> = ObjectValueOf<T['_ENUM']>;
export type EnumKeyOf<T extends { _KEYS: Record<string, string | number> }> = keyof T['_KEYS'];
