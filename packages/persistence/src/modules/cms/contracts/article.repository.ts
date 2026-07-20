import type {
    Page,
    ReadProfile,
    RepositoryRequest,
    RepositoryResponse,
    UpdateProfile,
    WriteProfile,
} from '../../../core/contracts.js';
import type {
    ArticleListInput,
    ArticleRecord,
    CreateArticleInput,
    DeleteArticleOutput,
    UpdateArticleInput,
} from './article.types.js';

/** CMS 文章的公开持久化契约，不依赖具体 ORM。 */
export interface ArticleRepository {
    getById(request: RepositoryRequest<{ id: string }>): Promise<RepositoryResponse<ArticleRecord | null, ReadProfile>>;
    list(request: RepositoryRequest<ArticleListInput>): Promise<RepositoryResponse<Page<ArticleRecord>, ReadProfile>>;
    create(request: RepositoryRequest<CreateArticleInput>): Promise<RepositoryResponse<ArticleRecord, WriteProfile>>;
    update(request: RepositoryRequest<UpdateArticleInput>): Promise<RepositoryResponse<ArticleRecord, UpdateProfile>>;
    softDelete(
        request: RepositoryRequest<{ id: string }>,
    ): Promise<RepositoryResponse<DeleteArticleOutput, WriteProfile>>;
}
