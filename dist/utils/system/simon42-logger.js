// ====================================================================
// LOGGER UTILITY - Centralized Logging System
// ====================================================================
// Provides a centralized logging system with configurable log levels
// Supports: error, warn, info, debug
// ====================================================================

/**
 * Log levels enum
 * @enum {number}
 */
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

/**
 * Log level names for display
 * @type {Object<string, number>}
 */
const LOG_LEVEL_NAMES = {
  'error': LOG_LEVELS.ERROR,
  'warn': LOG_LEVELS.WARN,
  'info': LOG_LEVELS.INFO,
  'debug': LOG_LEVELS.DEBUG
};

/**
 * Current log level (default: WARN for production)
 * @type {number}
 */
let currentLogLevel = LOG_LEVELS.WARN;

/**
 * Sets the current log level
 * @param {string|number} level - Log level name ('error', 'warn', 'info', 'debug') or numeric level
 */
export function setLogLevel(level) {
  if (typeof level === 'string') {
    const normalizedLevel = level.toLowerCase();
    if (LOG_LEVEL_NAMES[normalizedLevel] !== undefined) {
      currentLogLevel = LOG_LEVEL_NAMES[normalizedLevel];
    } else {
      console.warn(`[Simon42 Logger] Unknown log level: ${level}, using 'warn'`);
      currentLogLevel = LOG_LEVELS.WARN;
    }
  } else if (typeof level === 'number' && level >= LOG_LEVELS.ERROR && level <= LOG_LEVELS.DEBUG) {
    currentLogLevel = level;
  } else {
    console.warn(`[Simon42 Logger] Invalid log level: ${level}, using 'warn'`);
    currentLogLevel = LOG_LEVELS.WARN;
  }
}

/**
 * Gets the current log level
 * @returns {number} Current log level
 */
export function getLogLevel() {
  return currentLogLevel;
}

/**
 * Gets the current log level name
 * @returns {string} Current log level name ('error', 'warn', 'info', 'debug')
 */
export function getLogLevelName() {
  for (const [name, level] of Object.entries(LOG_LEVEL_NAMES)) {
    if (level === currentLogLevel) {
      return name;
    }
  }
  return 'warn';
}

/**
 * Checks if a log level should be logged
 * @param {number} level - Log level to check
 * @returns {boolean} True if the level should be logged
 */
function shouldLog(level) {
  return level <= currentLogLevel;
}

/**
 * Formats log message with prefix
 * @param {string} level - Log level name
 * @param {...any} args - Arguments to log
 * @returns {Array} Formatted arguments
 */
function formatLog(level, ...args) {
  return [`[${level.toUpperCase()}]`, ...args];
}

/**
 * Logs an error message
 * @param {...any} args - Arguments to log
 */
export function logError(...args) {
  if (shouldLog(LOG_LEVELS.ERROR)) {
    console.error(...formatLog('error', ...args));
  }
}

/**
 * Logs a warning message
 * @param {...any} args - Arguments to log
 */
export function logWarn(...args) {
  if (shouldLog(LOG_LEVELS.WARN)) {
    console.warn(...formatLog('warn', ...args));
  }
}

/**
 * Logs an info message
 * @param {...any} args - Arguments to log
 */
export function logInfo(...args) {
  if (shouldLog(LOG_LEVELS.INFO)) {
    console.info(...formatLog('info', ...args));
  }
}

/**
 * Logs a debug message
 * @param {...any} args - Arguments to log
 */
export function logDebug(...args) {
  if (shouldLog(LOG_LEVELS.DEBUG)) {
    console.debug(...formatLog('debug', ...args));
  }
}

/**
 * Initializes the logger with a log level from config
 * @param {Object} config - Dashboard configuration
 */
export function initLogger(config) {
  if (config?.log_level) {
    setLogLevel(config.log_level);
    // Use console.debug directly here to avoid circular dependency issues during initialization
    if (shouldLog(LOG_LEVELS.DEBUG)) {
      console.debug(...formatLog('debug', 'Logger initialized with level:', getLogLevelName()));
    }
  } else {
    // Default to WARN if not specified
    setLogLevel(LOG_LEVELS.WARN);
  }
}

/**
 * Gets available log level names
 * @returns {Array<string>} Array of log level names
 */
export function getAvailableLogLevels() {
  return Object.keys(LOG_LEVEL_NAMES);
}

// Make logger available globally for lazy loading scenarios
if (typeof window !== 'undefined') {
  window.Simon42Logger = {
    logDebug,
    logInfo,
    logWarn,
    logError,
    setLogLevel,
    getLogLevel,
    getLogLevelName,
    initLogger
  };
}

