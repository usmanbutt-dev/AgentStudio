type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITY: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const LEVEL_COLORS: Record<LogLevel, string> = { debug: '\x1b[36m', info: '\x1b[32m', warn: '\x1b[33m', error: '\x1b[31m' };
const RESET = '\x1b[0m';

let minLevel: LogLevel = 'debug';

export function setLogLevel(level: LogLevel) {
  minLevel = level;
}

function log(level: LogLevel, context: string, message: string, data?: unknown) {
  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[minLevel]) return;

  const time = new Date().toISOString().slice(11, 23);
  const color = LEVEL_COLORS[level];
  const prefix = `${color}[${time}] [${level.toUpperCase()}] [${context}]${RESET}`;

  if (data !== undefined) {
    console.log(prefix, message, typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
  } else {
    console.log(prefix, message);
  }
}

export function createLogger(context: string) {
  return {
    debug: (msg: string, data?: unknown) => log('debug', context, msg, data),
    info: (msg: string, data?: unknown) => log('info', context, msg, data),
    warn: (msg: string, data?: unknown) => log('warn', context, msg, data),
    error: (msg: string, data?: unknown) => log('error', context, msg, data),
  };
}
