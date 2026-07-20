import type {
    ReadProfile,
    RepositoryRequest,
    RepositoryResponse,
    UpdateProfile,
    WriteProfile,
} from '../../../core/contracts.js';
import type { CreateUserProfileInput, UpdateUserProfileInput, UserProfileRecord } from './user-profile.types.js';

/** 用户资料的公开持久化契约；资料必须关联到一个未软删除的用户。 */
export interface UserProfileRepository {
    getByUserId(request: RepositoryRequest<{ userId: string }>): Promise<RepositoryResponse<UserProfileRecord | null, ReadProfile>>;
    create(request: RepositoryRequest<CreateUserProfileInput>): Promise<RepositoryResponse<UserProfileRecord, WriteProfile>>;
    update(request: RepositoryRequest<UpdateUserProfileInput>): Promise<RepositoryResponse<UserProfileRecord, UpdateProfile>>;
}