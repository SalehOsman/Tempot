# Data Model: Import Engine Package

## ImportRequest

| Field | Type | Description |
| --- | --- | --- |
| `importId` | string | Import process identifier |
| `requestedBy` | string | User or actor identifier |
| `moduleId` | string | Destination module |
| `fileKey` | string | Uploaded file reference |
| `format` | enum | `csv` or `spreadsheet` |
| `locale` | string | Locale for lifecycle message keys |
| `batchSize` | number | Number of valid rows per batch |
| `schemaKey` | string | Validation schema adapter key |

## ImportJob

| Field | Type | Description |
| --- | --- | --- |
| `importId` | string | Job identity |
| `request` | ImportRequest | Original request |
| `attempt` | number | Queue attempt metadata |

## ImportRowResult

| Field | Type | Description |
| --- | --- | --- |
| `rowNumber` | number | Source row number |
| `status` | enum | `valid` or `invalid` |
| `data` | optional structured object | Normalized valid row |
| `errors` | optional list | Validation error descriptors |

## ImportBatchReady

| Field | Type | Description |
| --- | --- | --- |
| `importId` | string | Import process identifier |
| `moduleId` | string | Destination module |
| `batchNumber` | number | Batch sequence number |
| `rows` | readonly list | Valid normalized rows |

## ImportProcessSummary

| Field | Type | Description |
| --- | --- | --- |
| `importId` | string | Import process identifier |
| `totalRows` | number | Parsed row count |
| `validRows` | number | Valid row count |
| `invalidRows` | number | Invalid row count |
| `errorReport` | optional object | Document export metadata for invalid rows |
| `status` | enum | `completed`, `completed-with-errors`, or `failed` |
