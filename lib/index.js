// dsh-session-rename — host half.
//
// Deliberately a no-op seat. Renaming a session is already a first-class Host
// capability (session/title log events behind the `session.rename` wire
// contract): a user-sourced title is durable, propagates to every title
// projection (header crumb, sidebar rows, search), and pins the session so
// automatic first-prompt titling never overwrites it. This plugin only
// contributes the browser-side editing surface, so the host half exists
// solely to give the Loader row a module to load.

/** Stable cordis plugin name (matches cordis.patch.yml insert id). */
export const name = 'ui-session-rename'

/** No host services required, no routes registered. */
export function apply() {}
