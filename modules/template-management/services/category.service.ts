import { AppError } from '@tempot/shared';
import { type Result } from 'neverthrow';
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../types/category.types.js';
import type { CategoryRepository } from '../repositories/category.repository.js';

export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async create(input: CreateCategoryInput): Promise<Result<Category, AppError>> {
    return this.categoryRepository.createCategory(input);
  }

  async update(id: string, input: UpdateCategoryInput): Promise<Result<Category, AppError>> {
    return this.categoryRepository.updateCategory(id, input);
  }

  async delete(id: string): Promise<Result<void, AppError>> {
    return this.categoryRepository.softDeleteCategory(id);
  }

  async getById(id: string): Promise<Result<Category, AppError>> {
    return this.categoryRepository.findById(id);
  }

  async getBySlug(slug: string): Promise<Result<Category, AppError>> {
    return this.categoryRepository.findBySlug(slug);
  }

  async listHierarchy(): Promise<Result<Category[], AppError>> {
    return this.categoryRepository.listHierarchy();
  }

  async listRoots(): Promise<Result<Category[], AppError>> {
    return this.categoryRepository.listByParent(null);
  }

  async listChildren(parentId: string): Promise<Result<Category[], AppError>> {
    return this.categoryRepository.listByParent(parentId);
  }
}
