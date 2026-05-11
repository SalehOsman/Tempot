export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  icon: string | null;
  parentId: string | null;
  sortOrder: number;
  depth: number;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

export interface CreateCategoryInput {
  nameAr: string;
  nameEn: string;
  icon?: string;
  parentId?: string;
  sortOrder?: number;
}

export interface UpdateCategoryInput {
  nameAr?: string;
  nameEn?: string;
  icon?: string | null;
  sortOrder?: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  usageCount: number;
  createdAt: Date;
}

export interface TemplateRating {
  id: string;
  templateId: string;
  userId: string;
  stars: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateSubscription {
  id: string;
  templateId: string;
  userId: string;
  createdAt: Date;
}

export const MAX_CATEGORY_DEPTH = 2;
export const MAX_RATING_STARS = 5;
export const MIN_RATING_STARS = 1;
