# dsh-session-rename

[中文](README.zh.md)

Custom session titles for the dsh web GUI (DeepSeek Harness Desktop).

## What it does

- **Click the title at the top of the current conversation** (or the pencil button beside it) to edit the session name in place. `Enter` saves, `Escape` cancels, and an empty name shows a clear hint instead of saving.
- Saving uses the built-in `session.rename` contract — the same path as the sidebar's native **Rename** row action — so the custom name is:
  - synced to the conversation header, the sidebar history list, and every other title surface;
  - persisted as a user-sourced `session/title` log event (survives restarts and session switching);
  - **pinned**: once you rename a session, automatic first-prompt titling never overwrites your name.
- Keeps the existing automatic naming intact: sessions you never rename are still titled from the first prompt (deterministic fallback + optional LLM refinement).

## What it never touches

Session type, conversation modes (standard / Think / Bash), the selected model, agent execution logic, and message content. A rename is a title-only, log-only event.

## Install

```sh
dsh plugin --profile web add <path-to-this-package>
```

Then add the insert row (already in `cordis.patch.yml` when the package is listed in the profile's `dsh.profile.bundles`) or paste it into `$DSH_HOME/profiles/web/cordis.patch.yml`:

```yaml
- insert:
    - id: ui-session-rename
      name: dsh-session-rename
```

Restart the desktop app (or `dsh web`) afterwards. Uninstall: `dsh plugin --profile web remove dsh-session-rename` and remove the row.

## Notes

- The sidebar history list already ships a native rename (row `...` menu → 重命名); this plugin adds the missing top-of-conversation entry point and shares the same backend, so both stay in sync.
- Title text is normalized by the Host (whitespace collapsed, control characters stripped, truncated to the configured UTF-8 byte budget).
