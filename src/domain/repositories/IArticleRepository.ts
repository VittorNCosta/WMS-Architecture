import { Article } from '../entities/Article';

/** Persistence contract for articles (implemented in the Infrastructure layer). */
export interface IArticleRepository {
  save(article: Article): Promise<void>;
  update(article: Article): Promise<void>;
  findById(id: string): Promise<Article | null>;
  findBySku(sku: string): Promise<Article | null>;
  findAll(): Promise<Article[]>;
}
