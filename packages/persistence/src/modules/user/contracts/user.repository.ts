import type {
    Page,
    ReadProfile,
    RepositoryRequest,
    RepositoryResponse,
    UpdateProfile,
    WriteProfile,
} from '../../../core/contracts.js';
import type { CreateUserInput, DeleteUserOutput, UpdateUserInput, UserListInput, UserRecord } from './user.types.js';

/** 用户聚合的公开持久化契约，不依赖具体 ORM。 */
export interface UserRepository {
    getById(request: RepositoryRequest<{ id: string }>): Promise<RepositoryResponse<UserRecord | null, ReadProfile>>;
    list(request: RepositoryRequest<UserListInput>): Promise<RepositoryResponse<Page<UserRecord>, ReadProfile>>;
    create(request: RepositoryRequest<CreateUserInput>): Promise<RepositoryResponse<UserRecord, WriteProfile>>;
    update(request: RepositoryRequest<UpdateUserInput>): Promise<RepositoryResponse<UserRecord, UpdateProfile>>;
    softDelete(request: RepositoryRequest<{ id: string }>): Promise<RepositoryResponse<DeleteUserOutput, WriteProfile>>;
}