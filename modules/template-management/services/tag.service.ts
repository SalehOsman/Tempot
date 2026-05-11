import { AppError } from '@tempot/shared';
import { ok, err, type Result } from 'neverthrow';
import type { Tag } from '../types/category.types.js';
import type { TagRepository } from '../repositories/tag.repository.js';

export class TagService {
  constructor(private readonly tagRepository: TagRepository) {}

  async createOrFind(name: string): Promise<Result<Tag, AppError>> {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      return err(new AppError('template-management.tag_name_empty'));
    }
    if (trimmed.length > 100) {
      return err(new AppError('template-management.tag_name_too_long'));
    }
    return this.tagRepository.createOrFind(trimmed);
  }

  async resolveMany(names: string[]): Promise<Result<Tag[], AppError>> {
    const tags: Tag[] = [];
    for (const name of names) {
      const result = await this.createOrFind(name);
      if (result.isErr()) return err(result.error);
      tags.push(result.value);
    }
    return ok(tags);
  }

  async listPopular(limit: number = 20): Promise<Result<Tag[], AppError>> {
    return this.tagRepository.listPopular(limit);
  }
}
