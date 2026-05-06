# Data Model: Document Engine Package

## DocumentExportRequest

| Field | Type | Description |
| --- | --- | --- |
| `exportId` | string | Unique export identifier |
| `requestedBy` | string | User or actor identifier |
| `moduleId` | string | Requesting module |
| `format` | enum | `pdf` or `spreadsheet` |
| `templateId` | string | Template identifier |
| `locale` | string | Locale used for labels and layout |
| `payload` | structured object | Template data |

## DocumentExportJob

| Field | Type | Description |
| --- | --- | --- |
| `exportId` | string | Job identity |
| `request` | DocumentExportRequest | Original request |
| `attempt` | number | Queue attempt metadata |

## DocumentTemplate

| Field | Type | Description |
| --- | --- | --- |
| `templateId` | string | Template identifier |
| `format` | enum | Supported output format |
| `labelKeys` | string list | i18n labels used by the template |
| `layoutDirection` | enum | `ltr` or `rtl` |
| `fields` | field definition list | Template field definitions |

## DocumentExportResult

| Field | Type | Description |
| --- | --- | --- |
| `exportId` | string | Export identifier |
| `storageKey` | string | Uploaded file key |
| `downloadUrl` | optional string | Download URL if storage exposes one |
| `contentType` | string | Output MIME type |
| `sizeBytes` | number | Uploaded size |

## DocumentExportFailure

| Field | Type | Description |
| --- | --- | --- |
| `exportId` | string | Export identifier |
| `errorCode` | string | AppError code |
| `messageKey` | string | i18n status key |
| `retryable` | boolean | Whether the job can be retried |
