import pino from "pino";

type LoggerOptions = {
  readonly pretty?: boolean;
  readonly level?: string;
};

/**
 * Create a logger instance
 */
export function createLogger(options: LoggerOptions = {}): pino.Logger {
  const { pretty = true, level = "info" } = options;

  return pino({
    level,
    transport: pretty
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
          },
        }
      : undefined,
  });
}
