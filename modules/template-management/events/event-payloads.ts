import type { TemplateStatus } from '../types/template.types.js';

export interface TemplateCreatedEvent {
  templateId: string;
  authorId: string;
  name: string;
  timestamp: Date;
}

export interface TemplateStatusChangedEvent {
  templateId: string;
  oldStatus: TemplateStatus;
  newStatus: TemplateStatus;
  changedBy: string;
  reason?: string;
  timestamp: Date;
}

export interface TemplateVersionPublishedEvent {
  templateId: string;
  versionId: string;
  version: string;
  publishedBy: string;
  timestamp: Date;
}

export interface TemplateDeletedEvent {
  templateId: string;
  deletedBy: string;
  timestamp: Date;
}

export interface TemplateClonedEvent {
  sourceTemplateId: string;
  cloneTemplateId: string;
  userId: string;
  timestamp: Date;
}

export interface TemplateRatedEvent {
  templateId: string;
  userId: string;
  stars: number;
  newAverage: number;
  timestamp: Date;
}
