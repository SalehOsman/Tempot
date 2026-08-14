export const TemplateStatus = {
  DRAFT: 'DRAFT',
  REVIEW: 'REVIEW',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type TemplateStatus = (typeof TemplateStatus)[keyof typeof TemplateStatus];

export interface TemplateCommandDef {
  name: string;
  description: string;
  handler?: string;
}

export interface TemplateMessageDef {
  key: string;
  defaultText: Record<string, string>;
  placeholders?: string[];
}

export interface TemplateFormStep {
  field: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  label: string;
  validation?: string;
  options?: string[];
}

export interface TemplateInputFormDef {
  name: string;
  steps: TemplateFormStep[];
}

export interface TemplatePermissionDef {
  action: string;
  subject: string;
  minRole: string;
}

export interface TemplateSettingDef {
  key: string;
  type: 'string' | 'number' | 'boolean';
  defaultValue: unknown;
  description: string;
}

export interface TemplateContent {
  commands: TemplateCommandDef[];
  messages: TemplateMessageDef[];
  inputForms?: TemplateInputFormDef[];
  permissions?: TemplatePermissionDef[];
  settings?: TemplateSettingDef[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  slug: string;
  status: TemplateStatus;
  content: TemplateContent;
  categoryId: string | null;
  authorId: string;
  clonedFrom: string | null;
  language: string;
  usageCount: number;
  ratingAvg: number;
  ratingCount: number;
  currentVersion: string | null;
  isOfficial: boolean;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: string | null;
}

export interface TemplateVersionMetadata {
  name: string;
  description: string;
  categorySlug: string | null;
  tags: string[];
  language: string;
  isOfficial: boolean;
}

export interface TemplateVersion {
  id: string;
  templateId: string;
  version: string;
  content: TemplateContent;
  metadata: TemplateVersionMetadata;
  changeSummary: string | null;
  publishedBy: string;
  createdAt: Date;
}

export interface CreateTemplateInput {
  name: string;
  description: string;
  categoryId?: string;
  language: string;
  tags?: string[];
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  categoryId?: string | null;
  language?: string;
  content?: TemplateContent;
}

export interface TemplateSearchFilters {
  query?: string;
  categoryId?: string;
  tags?: string[];
  status?: TemplateStatus;
  authorId?: string;
  minRating?: number;
}

export type TemplateSortField = 'relevance' | 'rating' | 'usage' | 'created' | 'updated';

export interface TemplateSearchParams {
  filters: TemplateSearchFilters;
  sort: TemplateSortField;
  page: number;
  pageSize: number;
}

export interface TemplateSearchResult {
  templates: Template[];
  totalCount: number;
  page: number;
  pageSize: number;
}
