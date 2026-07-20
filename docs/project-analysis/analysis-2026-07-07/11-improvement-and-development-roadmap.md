# 11 - Improvement and Development Roadmap

## Immediate Track

| Order | Work | Purpose |
| ---: | --- | --- |
| 1 | Finish Spec #058 | Prevent unknown/pending visitors from seeing or executing internal capabilities. |
| 2 | Cleanup confirmed constitutional violations | Remove stale source artifact, `eslint-disable`, and active non-English developer-facing content. |
| 3 | Implement Spec #059 | Make methodology violations automatically blocking. |
| 4 | Complete Spec #057 staging evidence | Prove the signed image and operational recovery in external staging. |

## Documentation Track

### D001 - Rebuild the architecture spec

`docs/architecture/tempot_architecture.md` should be rewritten in English as a practical current source of truth. It should reference ADRs instead of duplicating all historical detail.

### D002 - Classify localized product docs

The project needs an explicit rule for `docs/product/ar/`. If these are localized end-user docs, they should be governed as product localization and exempted from developer-facing Rule XL checks. If not, they should be translated or removed.

### D003 - Drain historical analysis debt

The 2026-06-10 and 2026-06-23 analysis folders should be translated, summarized in English, or archived with a time-boxed exception.

### D004 - Update cleanup plan

`docs/developer/documentation-cleanup-plan.md` should include the 2026-07-07 findings, especially architecture mojibake and methodology-lint dependency on cleanup specs.

## Engineering Track

### E001 - Access gate and membership hardening

Finish #058 and keep the implementation narrow. Do not expand into marketplace, billing, tenant, or dashboard concerns.

### E002 - Staging automation

Turn Spec #057 manual evidence steps into repeatable scripts where practical:

- selected digest capture;
- migration smoke;
- webhook smoke;
- rollback or forward-fix rehearsal;
- evidence file template.

### E003 - Local toolchain consistency

Make the shell and nested scripts consistently resolve `pnpm@10.33.3`. This reduces release friction and warning noise.

## Governance Track

### G001 - Create cleanup specs referenced by Spec #059

If Spec #059 continues to use #060 and #061 ownership metadata, create those spec directories before implementing the allowlist.

### G002 - Add methodology-lint to branch protection

After #059 merges, make the CI methodology job required on `main`.

### G003 - Keep roadmap merge-only

Continue updating `docs/ROADMAP.md` after merges, not for unmerged local work. This preserves its source-of-truth value.

## Suggested Timeline

| Horizon | Target |
| --- | --- |
| 0-3 days | Finish remaining Spec #058 implementation/test/doc/review tasks. |
| 3-5 days | Fix source artifact, `eslint-disable`, and active English-language violations needed for merge. |
| 1 week | Merge #058, then start #059 implementation. |
| 1-2 weeks | Complete methodology-lint and documentation cleanup specs. |
| 2 weeks | Execute external staging smoke and rollback rehearsal for #057. |
| After evidence | Make production go/no-go decision. |

## Conclusion

The best roadmap is not to add more product scope. The project should close access control, methodology enforcement, documentation reliability, and production evidence in that order.

