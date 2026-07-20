/**
 * 仓储方法统一使用稳定的请求信封。
 * `input` 仅描述持久化操作意图，`context` 承载可信的调用元数据。
 */
export interface RepositoryRequest<TInput, TContext extends RepositoryContext = RepositoryContext> {
    /** 本次读取或写入操作的明确参数。 */
    input: TInput;
    /** 由调用层传递的可信上下文。 */
    context: TContext;
}

/**
 * `output` 是调用方可依赖的稳定结果；`profile` 是可选诊断信息，
 * 不得用于业务决策。
 */
export interface RepositoryResponse<TOutput, TProfile = undefined> {
    /** 操作结果。 */
    output: TOutput;
    /** 可选的持久化诊断信息，调用方必须能处理其字段缺失。 */
    profile: TProfile;
}

/** 可信操作者信息；仓储可用于写入审计字段，但不负责授权判断。 */
export interface ActorContext {
    /** 操作者唯一标识。 */
    id: string;
    /** 操作者角色快照，供应用层或领域策略进行授权判断。 */
    roles: readonly string[];
}

/** 请求关联信息，用于追踪和审计，而非业务查询条件。 */
export interface RequestContext {
    /** 用于关联日志、链路追踪和审计记录的请求标识。 */
    requestId: string;
    /** 客户端 IP 地址。 */
    ip?: string;
    /** 客户端 User-Agent。 */
    userAgent?: string;
}

/** 调用方按需开启的持久化诊断选项。 */
export interface RepositoryOptions {
    /** 是否在 profile 中返回方法阶段耗时。 */
    collectTiming?: boolean;
    /** 是否在更新 profile 中返回修改前后的字段差异。 */
    collectChanges?: boolean;
}

/**
 * 应用层负责授权和事务边界。仓储只能使用此处传入的事务，
 * 不得根据请求元数据隐式创建事务。
 */
export interface RepositoryContext {
    /** 可信操作者；由认证后的调用层填充。 */
    actor?: ActorContext;
    /** 请求追踪与审计信息。 */
    request?: RequestContext;
    /** 由应用层开启并向下传播的事务。 */
    transaction?: RepositoryTransaction;
    /** 影响 profile 采集的显式选项。 */
    options?: RepositoryOptions;
}

/** 持久化适配器之间传递事务时使用的最小抽象。 */
export interface RepositoryTransaction {
    /** 适配器生成的事务身份标识。 */
    readonly id: symbol;
}

/** 可选性能诊断信息。 */
export interface TimingProfile {
    /** 从方法开始到结束的总耗时，单位为毫秒。 */
    totalMs: number;
    /** 各持久化阶段的耗时，单位为毫秒。 */
    stages: Readonly<Record<string, number>>;
}

/** 写操作可返回的诊断信息。 */
export interface WriteProfile {
    /** 按 collectTiming 选项采集的耗时。 */
    timing?: TimingProfile;
}

/** 读操作可返回的诊断信息。 */
export interface ReadProfile {
    /** 按 collectTiming 选项采集的耗时。 */
    timing?: TimingProfile;
}

/** 单个字段的更新前后差异。 */
export interface FieldChange {
    /** 被修改的公开字段名。 */
    field: string;
    /** 修改前的值。 */
    before: unknown;
    /** 修改后的值。 */
    after: unknown;
}

/** 更新操作可返回的诊断信息。 */
export interface UpdateProfile extends WriteProfile {
    /** 按 collectChanges 选项采集的字段差异。 */
    changes?: readonly FieldChange[];
}

/** 基于页码的分页请求。 */
export interface PageRequest {
    /** 从 1 开始的页码。 */
    number: number;
    /** 单页记录数。 */
    size: number;
}

/** 分页查询的稳定输出结构。 */
export interface Page<T> {
    /** 当前页记录。 */
    items: readonly T[];
    /** 满足筛选条件的记录总数。 */
    total: number;
    /** 本次查询实际使用的分页参数。 */
    page: PageRequest;
}