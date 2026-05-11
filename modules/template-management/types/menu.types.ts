export type TemplateMenuAction =
  // Navigation
  | 'tmpl:menu'
  | 'tmpl:browse'
  | 'tmpl:my'
  | 'tmpl:create'

  // Template detail and edit
  | `tmpl:view:${string}`
  | `tmpl:edit:${string}`
  | `tmpl:delete:${string}`
  | `tmpl:delete:${string}:confirm`

  // Lifecycle
  | `tmpl:submit:${string}`
  | `tmpl:publish:${string}`
  | `tmpl:reject:${string}`
  | `tmpl:archive:${string}`
  | `tmpl:reactivate:${string}`

  // Versioning
  | `tmpl:versions:${string}`
  | `tmpl:version:${string}:${string}`

  // Clone
  | `tmpl:clone:${string}`

  // Search and browse
  | 'tmpl:search'
  | 'tmpl:categories'
  | `tmpl:category:${string}`
  | `tmpl:sort:${string}`

  // Import / Export
  | `tmpl:export:${string}`
  | `tmpl:export:${string}:json`
  | `tmpl:export:${string}:pdf`
  | 'tmpl:import'

  // Category management (admin)
  | 'tmpl:cat:manage'
  | 'tmpl:cat:add'
  | `tmpl:cat:edit:${string}`
  | `tmpl:cat:delete:${string}`

  // Tags
  | `tmpl:tags:${string}`

  // Rating
  | `tmpl:rate:${string}`
  | `tmpl:rate:${string}:${string}`

  // Subscription
  | `tmpl:subscribe:${string}`
  | `tmpl:unsubscribe:${string}`

  // Pagination
  | `tmpl:page:${string}`;
