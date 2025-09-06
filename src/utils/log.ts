import * as core from '@actions/core';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private level: LogLevel = 'info';

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      core.debug(this.formatMessage(message, args));
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      core.info(this.formatMessage(message, args));
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      core.warning(this.formatMessage(message, args));
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      core.error(this.formatMessage(message, args));
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level]! >= levels[this.level]!;
  }

  private formatMessage(message: string, args: unknown[]): string {
    if (args.length === 0) return message;

    const timestamp = new Date().toISOString();
    const argsStr = args
      .map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
      .join(' ');

    return `[${timestamp}] ${message} ${argsStr}`;
  }
}

export const logger = new Logger();
