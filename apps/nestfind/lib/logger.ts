type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
}

function formatEntry(entry: LogEntry): string {
  const base = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`;
  if (entry.context) {
    return `${base} ${JSON.stringify(entry.context)}`;
  }
  return base;
}

function createLogger(context?: Record<string, unknown>) {
  const log = (level: LogLevel, message: string, extra?: Record<string, unknown>) => {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: { ...context, ...extra },
    };
    console[level === 'error' ? 'error' : 'log'](formatEntry(entry));
  };

  return {
    debug: (message: string, extra?: Record<string, unknown>) => log('debug', message, extra),
    info: (message: string, extra?: Record<string, unknown>) => log('info', message, extra),
    warn: (message: string, extra?: Record<string, unknown>) => log('warn', message, extra),
    error: (message: string, error?: Error, extra?: Record<string, unknown>) =>
      log('error', message, { ...extra, error: error?.message, stack: error?.stack }),
  };
}

export const logger = createLogger({ module: 'nestfind' });
export { createLogger };
