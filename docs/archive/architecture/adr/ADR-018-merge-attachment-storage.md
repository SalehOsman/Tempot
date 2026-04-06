# ADR-018: Merge attachment-manager into storage-engine

**Date:** 2026-03-19
**Status:** Accepted

## Context

v10 had two separate packages: `attachment-manager` (metadata tracking in DB) and `storage-engine` (file upload/download). attachment-manager had a 100% dependency on storage-engine — it could not function independently.

## Decision

Merge attachment-manager into **storage-engine** as a metadata layer. storage-engine now handles both file operations and attachment metadata tracking.

## Consequences

- One package instead of two for all file-related operations
- `storage-engine.upload()` automatically creates the attachment metadata record
- `storage-engine.delete()` automatically removes the metadata record
- Blast radius of storage changes is contained to one package
- Modules import one package instead of two for file handling

## Alternatives Rejected

**Keep separate packages (v10 approach):** Two packages with tight coupling. Changes to storage-engine always required changes to attachment-manager. Importing both in modules was verbose and confusing.

**Merge into database package:** storage-engine handles external APIs (Google Drive, S3) which are unrelated to the database package's responsibility.
