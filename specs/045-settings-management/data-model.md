# Data Model: settings-management

No new persistence is introduced. The module reads shared settings through the
injected settings provider.

Regional language settings reuse the existing user profile language field
through the `user-management` profile edit flow. Timezone and regional default
persistence are not introduced by this spec.
