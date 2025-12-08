// ====================================================================
// SIMON42 VERSION UTILITY
// ====================================================================
// Centralized version management
// Update VERSION file in project root when releasing a new version
// Format: "1.1.0" for stable releases, "1.1.0-dev" for dev/prerelease
// ====================================================================

// Version is read from VERSION file during build/deployment
// IMPORTANT: Keep this in sync with the VERSION file in project root
// The GitHub workflow reads from VERSION file to create releases
export const VERSION = '2.1.2-dev';

/**
 * Check if the current version is a dev/prerelease version
 * @returns {boolean} True if version ends with "-dev" or contains dev indicators
 */
export function isDevVersion() {
  return VERSION.includes('-dev') || VERSION.includes('-beta') || VERSION.includes('-alpha') || VERSION.includes('-rc');
}

/**
 * Get the base version without dev/prerelease suffix
 * @returns {string} Base version (e.g., "1.1.0" from "1.1.0-dev")
 */
export function getBaseVersion() {
  return VERSION.split('-')[0];
}

