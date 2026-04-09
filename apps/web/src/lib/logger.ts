/**
 * Structured logger. PRD Code Quality Standard #5.
 * No console.log in production code.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  module: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

function formatEntry(entry: LogEntry): string {
  const data = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
  return `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.module}] ${entry.message}${data}`;
}

function log(level: LogLevel, module: string, message: string, data?: Record<string, unknown>): void {
  const entry: LogEntry = {
    level,
    module,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  const formatted = formatEntry(entry);

  switch (level) {
    case 'debug':
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.debug(formatted);
      }
      break;
    case 'info':
      // eslint-disable-next-line no-console
      console.info(formatted);
      break;
    case 'warn':
      // eslint-disable-next-line no-console
      console.warn(formatted);
      break;
    case 'error':
      // eslint-disable-next-line no-console
      console.error(formatted);
      break;
  }
}

export function createLogger(module: string) {
  return {
    debug: (message: string, data?: Record<string, unknown>) => log('debug', module, message, data),
    info: (message: string, data?: Record<string, unknown>) => log('info', module, message, data),
    warn: (message: string, data?: Record<string, unknown>) => log('warn', module, message, data),
    error: (message: string, data?: Record<string, unknown>) => log('error', module, message, data),
  };
}
