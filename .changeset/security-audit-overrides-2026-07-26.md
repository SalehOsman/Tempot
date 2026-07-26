---
'@tempot/cms-engine': patch
'@tempot/i18n-core': patch
'bot-server': patch
'docs': patch
---

Pin patched transitive PostCSS and brace-expansion versions through workspace
overrides so the high-severity dependency audit and Docker image scan gates pass.
