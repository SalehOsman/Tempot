# Local Data Protection Regulations

> Reference: Spec v11, Section 31 — Privacy Module

---

## Overview

Tempot's Privacy Module (Section 31) implements GDPR-compatible privacy controls. This document maps those controls to local regulations in Egypt, Saudi Arabia, and the UAE.

---

## Egypt — Personal Data Protection Law (PDPL)

**Law:** Law No. 151 of 2020 — Personal Data Protection Law
**Enforcement:** National Telecom Regulatory Authority (NTRA)
**Effective:** July 2023 (enforcement)

### Key Requirements

| Requirement | GDPR Equivalent | Tempot Implementation |
|-------------|----------------|----------------------|
| Lawful basis for processing | Art. 6 | Consent collected at first interaction |
| Data subject rights | Arts. 15–22 | `/my-data`, `/export-data`, `/delete-account` commands |
| Data minimisation | Art. 5(1)(c) | Only essential fields collected per module |
| Storage limitation | Art. 5(1)(e) | Configurable retention per data type (Section 31.4) |
| Security measures | Art. 32 | AES-256, HTTPS, bcrypt, audit logging |
| Breach notification | Art. 33 | SUPER_ADMIN alerted immediately; NTRA notification within 72 hours |
| Cross-border transfer | Art. 12 | Data stored in Egypt or EU-adequate countries only |

### Egypt-Specific Notes

- **Arabic language:** Consent notices and privacy policy must be available in Arabic (already enforced by i18n-only rule)
- **Data localisation:** Egyptian law requires certain data to be stored locally. When deploying for Egyptian users, use a server in Egypt or the EU (not US)
- **Sensitive data:** Egyptian law defines health, financial, and biometric data as sensitive — requires explicit consent and enhanced security

### Recommended Server Locations for Egypt

- Hetzner Falkenstein (Germany) — EU-adequate, GDPR compliant
- AWS eu-south-1 (Milan) — EU, GDPR compliant
- Any Egyptian data centre (full local compliance)

---

## Saudi Arabia — PDPL

**Law:** Personal Data Protection Law (PDPL)
**Authority:** National Data Management Office (NDMO) / Saudi Data and AI Authority (SDAIA)
**Effective:** September 2023 (enforcement)

### Key Requirements

| Requirement | GDPR Equivalent | Tempot Implementation |
|-------------|----------------|----------------------|
| Consent | Art. 6 | Explicit consent at onboarding |
| Purpose limitation | Art. 5(1)(b) | Purpose documented in module.config.ts `privacy.dataTypes` |
| Data subject rights | Arts. 15–21 | `/my-data`, `/export-data`, `/delete-account` |
| Data localisation | — | Personal data of Saudi residents must be stored in Saudi Arabia |
| Cross-border transfer | Art. 29 | Requires SDAIA approval or adequate protection |
| Breach notification | Art. 20 | SDAIA notification within 72 hours of discovery |

### Saudi Arabia-Specific Notes

- **Data localisation is strict:** Personal data about Saudi residents must be stored on servers physically located in Saudi Arabia, unless SDAIA grants an exception
- **Recommended provider:** AWS me-south-1 (Bahrain) or AWS ap-southeast-1 is not sufficient — use `me-central-1` (UAE) as an interim or a local Saudi provider
- **Financial data:** Additional regulations under SAMA (Saudi Central Bank) apply for payment-related data

### Deployment Configuration for Saudi Arabia

```env
# .env (Saudi Arabia deployment)
DEFAULT_COUNTRY=SA
DEFAULT_LANGUAGE=ar
# Use Saudi or GCC server
DATABASE_URL=postgresql://...@saudi-server:5432/tempot_db
```

---

## United Arab Emirates — PDPL and DIFC

**Laws:**
- UAE Federal Decree-Law No. 45 of 2021 (Personal Data Protection Law)
- Dubai International Financial Centre (DIFC) Data Protection Law 2020 (for DIFC entities)

**Authority:** UAE Telecommunications and Digital Government Regulatory Authority (TDRA)

### Key Requirements

| Requirement | GDPR Equivalent | Tempot Implementation |
|-------------|----------------|----------------------|
| Consent | Art. 6 | Explicit consent at onboarding |
| Data subject rights | Arts. 15–22 | Full rights implemented |
| Data retention | Art. 5(1)(e) | Configurable per module |
| Cross-border transfer | Chapter 5 | Requires TDRA approval |
| Breach notification | Art. 26 | TDRA notification within 72 hours |
| Health data | — | Enhanced consent and security required |

### UAE-Specific Notes

- **DIFC entities** operate under a separate, more stringent framework — consult legal counsel before deploying for DIFC businesses
- **Recommended server location:** AWS me-central-1 (UAE) for full compliance

---

## Comparison Table

| Requirement | GDPR | Egypt PDPL | Saudi PDPL | UAE PDPL |
|-------------|------|-----------|-----------|---------|
| Explicit consent | ✅ | ✅ | ✅ | ✅ |
| Right to access | ✅ | ✅ | ✅ | ✅ |
| Right to deletion | ✅ | ✅ | ✅ | ✅ |
| Data localisation | ❌ (transfers allowed) | Partial | ✅ Strict | Partial |
| Breach notification | 72 hours | 72 hours | 72 hours | 72 hours |
| DPO requirement | Large orgs | Large orgs | Large orgs | Large orgs |
| Children's data | 16 years | 18 years | 18 years | 18 years |

---

## Tempot Privacy Module Configuration

For each deployment region, configure `module.config.ts`:

```typescript
// For Egyptian deployment
privacy: {
  collectsData: true,
  dataTypes: ['name', 'phone', 'telegram_id'],
  retentionDays: 365,
  sharesData: false,
  jurisdiction: 'EG',
  consentVersion: '1.0',
}
```

The Privacy Module's consent flow automatically presents the privacy notice in the user's language (Arabic for `ar-EG`, `ar-SA`, `ar-AE`).

---

## Disclaimer

This document provides a general overview for guidance purposes only. It does not constitute legal advice. Consult a qualified legal professional familiar with the applicable jurisdiction before deploying Tempot to collect personal data from users in any country.
