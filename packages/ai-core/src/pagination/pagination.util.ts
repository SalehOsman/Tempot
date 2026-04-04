import type { PaginatedResult, PaginationOptions } from '../ai-core.types.js';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/** Paginate an array of items */
export function paginate<T>(items: T[], options?: PaginationOptions): PaginatedResult<T> {
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);

  if (total === 0) {
    return { items: [], total: 0, page: 1, pageSize, totalPages: 0 };
  }

  const rawPage = options?.page ?? DEFAULT_PAGE;
  const page = Math.max(1, Math.min(rawPage, totalPages));
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    items: items.slice(start, end),
    total,
    page,
    pageSize,
    totalPages,
  };
}
