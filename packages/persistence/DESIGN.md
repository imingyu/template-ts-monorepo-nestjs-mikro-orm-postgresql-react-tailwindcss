# 持久化层设计

## 定位

`@mono-ts/persistence` 是持久化适配器包。它刻意不负责 HTTP 关注点、NestJS 依赖、授权决策或应用用例编排。

## 目录结构

源码采用“业务模块优先、技术能力复用”的结构：

```text
src/
	core/
		contracts.ts                 # 所有适配器无关的请求、响应、上下文与分页契约
		errors.ts                    # 通用持久化错误
	adapters/
		mikro-orm/
			database.ts                # PostgreSQL/MySQL 驱动选择与未来方言扩展注册表
			repository.ts              # 仅复用 EntityManager 与诊断采集等 ORM 机械代码
			unit-of-work.ts            # 显式事务边界与事务上下文传播
	modules/
		user/
			entities/
				user.entity.ts            # users 账户主信息表
				user-profile.entity.ts    # user_profile 一对一资料扩展表
			contracts/
				user.*                    # 用户公开 DTO 与 ORM 无关仓储接口
				user-profile.*            # 用户资料公开 DTO 与 ORM 无关仓储接口
			mappers/                    # 受管理实体到公开记录的内部映射
			repositories/               # 各仓储的 MikroORM 实现
			index.ts                    # 用户模块公开导出与启动实体集合
	index.ts                       # 包的稳定公开入口
```

新增实体时，在 `modules/<实体名>/` 下创建同样的垂直切片。只有确实被多个模块共享且不含业务语义的代码才能进入 `core` 或 `adapters`；不得按全局 `entities/`、`repositories/`、`mappers/` 目录分散同一模块的实现。

用户模块当前包含 `users` 和 `user_profile` 两张表。`user_profile.user_id` 是数据库唯一的一对一外键，`email` 也由数据库唯一约束保护；资料查询必须通过未软删除的 `users` 记录，避免已删除账户的资料重新暴露。

## 数据库方言

`adapters/mikro-orm/database.ts` 提供 PostgreSQL 和 MySQL 的内建适配器。应用启动时通过 `MikroOrmAdapterRegistry` 显式选择方言并初始化 ORM；用户仓储、公共契约和 `MikroOrmUnitOfWork` 不得根据方言分支。

未来接入 SQLite、MongoDB 或其他 MikroORM 驱动时，应实现并注册 `MikroOrmDatabaseAdapter`，而不是修改仓储模块：

```ts
registry.register({
  dialect: "sqlite",
  async initialize(options) {
    const { MikroORM } = await import("@mikro-orm/sqlite");
    return MikroORM.init(options);
  },
});
```

适配器依赖可以按需作为包依赖加入；注册表使用动态导入，因此选择 PostgreSQL 时不会在运行时初始化 MySQL 驱动，反之亦然。

## 公共方法契约

每个公开仓储方法均采用以下结构：

```ts
{ input, context } -> { output, profile }
```

- `input` 仅包含本次操作明确的读取或写入意图。
- `context` 包含可信的横切元数据：操作者身份、请求关联信息、由应用层提供的事务，以及按需启用的诊断选项。
- `output` 是调用方可以依赖的稳定结果。
- `profile` 是强类型的可选诊断信息。它不得影响业务决策，调用方也必须能处理字段缺失的情况。

## 规则

1. 公开仓储的入参与出参不得暴露 `FilterQuery`、`EntityManager`、受管理实体等 MikroORM 类型。
2. 每个仓储必须声明明确的筛选和排序字段。API 入参绝不能直接变成任意数据库谓词。
3. 每个具体仓储默认排除软删除记录。访问已删除数据必须使用单独命名的方法和用例。
4. 授权属于 NestJS 服务层或领域策略。仓储可以使用可信操作者写入审计字段，但不得决定该操作者是否有权执行某项业务操作。
5. 应用层通过 `MikroOrmUnitOfWork` 开启并提交事务。仓储只能使用 `context` 中传递下来的事务。
6. 数据库唯一约束负责保证正确性。预检查可以改善错误提示，但不能成为唯一性的唯一保障。
7. 适配器基类只能消除 ORM 机械性代码，不能继续扩张出通用 CRUD 方法、校验器钩子、授权钩子或业务生命周期钩子。
8. `profile` 可以暴露按需采集的耗时、变更字段等持久化事实；不得包含 HTTP 展示数据、授权结果或无关副作用。
9. `modules/<实体名>/index.ts` 只导出模块的公开 DTO、仓储契约及可被应用层实例化的适配器实现；映射器等内部细节不从包根入口导出。
10. 数据库方言选择只能发生在 `adapters/mikro-orm/database.ts` 的启动适配边界；仓储、映射器和公共契约必须保持方言无关。
11. 账户主信息与可扩展个人资料应拆分为独立实体。`user_profile` 必须通过唯一 `user_id` 关联 `users`，资料仓储不得接受或修改关联用户标识。

## 测试要求

- 契约映射测试必须验证公开筛选与排序字段无法逃逸其白名单。
- 集成测试必须验证软删除可见性、事务回滚与数据库唯一约束。
- 并发测试应覆盖使用唯一键创建记录的用例，并断言数据库始终是最终正确性来源。
