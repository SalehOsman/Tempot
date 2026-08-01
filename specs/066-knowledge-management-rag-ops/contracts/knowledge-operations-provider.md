# Contract: KnowledgeOperationsProvider

`modules/knowledge-management` receives this provider from `bot-server`.

All fallible methods return a Result-shaped object or project `Result<T,
AppError>` depending on the final integration point. Provider errors must be
mapped to safe codes before rendering.

## Methods

### getReadiness(actorId)

Returns a `RAGReadinessSnapshot`.

### listSourceProfiles(actorId)

Returns approved `KnowledgeSourceProfile` records. The result must never include
unapproved filesystem paths.

### requestDryRun(input)

Creates or starts a dry-run ingestion job for one approved profile.

Input:

- `actorId`
- `profileId`

Output:

- `IngestionJob`

### requestWriteConfirmation(input)

Creates an expiring confirmation after validating a recent successful dry-run
for the same profile.

Input:

- `actorId`
- `profileId`
- `dryRunJobId`

Output:

- `IngestionConfirmation`

### confirmWrite(input)

Starts write ingestion after confirmation validation.

Input:

- `actorId`
- `confirmationToken`

Output:

- `IngestionJob`

### requestFullReindexConfirmation(input)

Creates the first or second confirmation for full reindex.

Input:

- `actorId`
- `profileId`
- `stage`

Output:

- `IngestionConfirmation`

### listJobs(input)

Returns a bounded list of recent ingestion jobs.

### getJob(input)

Returns safe job details.

### testQuery(input)

Runs a super-admin RAG retrieval test against indexed knowledge.

Input:

- `actorId`
- `question`
- `profileId`

Output:

- `RAGTestQueryResult`

## Security Requirements

- Reject unknown profile ids.
- Reject path traversal and non-mounted roots.
- Reject non-super-admin access before any provider call.
- Do not expose raw provider errors, environment variables, database URLs, API
  keys, or file contents in returned error payloads.
