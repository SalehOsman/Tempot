# Implementation Plan: settings-management

Implement an active Tempot module that reuses the existing settings provider
exposed by bot-server and owns settings navigation.

The regional settings surface exposes only implemented actions. Account language
changes are delegated to the existing `profile:edit:language` flow owned by
`user-management`; timezone and default regional controls remain hidden until a
dedicated implementation exists.
