/**
 * dsh-desktop-drop-path — host half.
 *
 * This plugin is client-only: the interesting work (capturing a file drop and
 * filling the composer with the absolute path) happens in the browser renderer
 * (see ./client.js). The host half exists only so the package is a valid Cordis
 * Loader entry that the ClientModuleRegistry discovers — it then serves the
 * client bundle over `/plugins/dsh-desktop-drop-path/client.js`.
 *
 * Declaring `name` here makes the plugin state fully resolvable and gives the
 * boot audit a stable, searchable plugin id.
 */
export const name = "dsh-desktop-drop-path";

/** No host-side services are required. */
export const inject = [];

/** No host-side behavior; the client half registers the drop capture. */
export function apply() {}
