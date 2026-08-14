import type { KnowledgeMenuSurface } from '../menus/knowledge-menu.factory.js';
import type {
  KnowledgeProviderSettingsSnapshot,
  KnowledgeSourceProfile,
} from '../contracts/knowledge-operations.types.js';
import type { KnowledgeViewService } from '../services/knowledge-view.service.js';

export interface KnowledgeView {
  readonly text: string;
  readonly surface: KnowledgeMenuSurface;
  readonly token?: string;
  readonly profileId?: string;
  readonly profiles?: readonly KnowledgeSourceProfile[];
  readonly providerSettings?: KnowledgeProviderSettingsSnapshot;
}

export interface ResolveContext {
  readonly t: (key: string, options?: Record<string, unknown>) => string;
  readonly actorId: string;
  readonly service: KnowledgeViewService;
}
