export interface TemplateWizardState {
  step: 'name' | 'description' | 'category' | 'language' | 'tags' | 'done';
  data: Partial<{
    name: string;
    description: string;
    categoryId: string;
    language: string;
    tags: string[];
  }>;
  timestamp: number;
}

export interface TemplateNavigationState {
  action: string;
  templateId?: string;
  wizard?: TemplateWizardState;
  searchQuery?: string;
  rejectionReason?: string;
  timestamp: number;
}
