export const TABLE_PRESENCE_QUERY = `
SELECT
  to_regclass('"UserProfile"') IS NOT NULL AS "userProfileTable",
  to_regclass('"user_management_profile"') IS NOT NULL AS "legacyUserProfileTable",
  to_regclass('"AuditLog"') IS NOT NULL AS "auditLogTable"
`;

export const USER_PROFILE_QUERY = `
SELECT
  COUNT(*)::text AS "totalRows",
  COUNT("email")::text AS "emailPopulated",
  COUNT("nationalId")::text AS "nationalIdPopulated",
  COUNT("mobileNumber")::text AS "mobileNumberPopulated",
  COUNT("birthDate")::text AS "birthDatePopulated",
  COUNT(*) FILTER (WHERE "email" IS NULL)::text AS "emailNulls",
  COUNT(*) FILTER (WHERE "nationalId" IS NULL)::text AS "nationalIdNulls",
  COUNT(*) FILTER (WHERE "mobileNumber" IS NULL)::text AS "mobileNumberNulls",
  COUNT(*) FILTER (WHERE "birthDate" IS NULL)::text AS "birthDateNulls",
  (
    SELECT COUNT(*)::text
    FROM (
      SELECT LOWER(BTRIM("email"))
      FROM "UserProfile"
      WHERE "email" IS NOT NULL AND BTRIM("email") <> ''
      GROUP BY LOWER(BTRIM("email"))
      HAVING COUNT(*) > 1
    ) AS duplicate_email_groups
  ) AS "emailDuplicateGroups",
  (
    SELECT COUNT(*)::text
    FROM (
      SELECT BTRIM("nationalId")
      FROM "UserProfile"
      WHERE "nationalId" IS NOT NULL AND BTRIM("nationalId") <> ''
      GROUP BY BTRIM("nationalId")
      HAVING COUNT(*) > 1
    ) AS duplicate_national_id_groups
  ) AS "nationalIdDuplicateGroups",
  (
    SELECT COUNT(*)::text
    FROM (
      SELECT REGEXP_REPLACE(BTRIM("mobileNumber"), '[^0-9+]', '', 'g')
      FROM "UserProfile"
      WHERE "mobileNumber" IS NOT NULL AND BTRIM("mobileNumber") <> ''
      GROUP BY REGEXP_REPLACE(BTRIM("mobileNumber"), '[^0-9+]', '', 'g')
      HAVING COUNT(*) > 1
    ) AS duplicate_mobile_groups
  ) AS "mobileNumberDuplicateGroups",
  COUNT(*) FILTER (
    WHERE "email" IS NOT NULL AND "email" <> LOWER(BTRIM("email"))
  )::text AS "emailNormalizationConflicts",
  COUNT(*) FILTER (
    WHERE "nationalId" IS NOT NULL AND "nationalId" <> BTRIM("nationalId")
  )::text AS "nationalIdNormalizationConflicts",
  COUNT(*) FILTER (
    WHERE "mobileNumber" IS NOT NULL
      AND "mobileNumber" <> REGEXP_REPLACE(BTRIM("mobileNumber"), '[^0-9+]', '', 'g')
  )::text AS "mobileNumberNormalizationConflicts"
FROM "UserProfile"
`;

export const LEGACY_USER_PROFILE_QUERY = `
SELECT
  COUNT(*)::text AS "totalRows",
  COUNT("email")::text AS "emailPopulated",
  (
    SELECT COUNT(*)::text
    FROM (
      SELECT LOWER(BTRIM("email"))
      FROM "user_management_profile"
      WHERE "email" IS NOT NULL AND BTRIM("email") <> ''
      GROUP BY LOWER(BTRIM("email"))
      HAVING COUNT(*) > 1
    ) AS duplicate_email_groups
  ) AS "emailDuplicateGroups",
  COUNT(*) FILTER (
    WHERE "email" IS NOT NULL AND "email" <> LOWER(BTRIM("email"))
  )::text AS "emailNormalizationConflicts"
FROM "user_management_profile"
`;

export const AUDIT_LOG_QUERY = `
SELECT
  COUNT(*)::text AS "totalRows",
  COUNT(*) FILTER (
    WHERE LOWER(COALESCE("before"::text, '')) ~
      '"(email|nationalid|national_id|mobilenumber|mobile_number|mobile|phone|birthdate|birth_date)"[[:space:]]*:'
  )::text AS "beforeProtectedKeyRecords",
  COUNT(*) FILTER (
    WHERE LOWER(COALESCE("after"::text, '')) ~
      '"(email|nationalid|national_id|mobilenumber|mobile_number|mobile|phone|birthdate|birth_date)"[[:space:]]*:'
  )::text AS "afterProtectedKeyRecords",
  COUNT(*) FILTER (
    WHERE LOWER(COALESCE("before"::text, '') || COALESCE("after"::text, '')) ~
      '"(email|nationalid|national_id|mobilenumber|mobile_number|mobile|phone|birthdate|birth_date)"[[:space:]]*:'
  )::text AS "protectedKeyRecords"
FROM "AuditLog"
`;
