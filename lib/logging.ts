type LogContext = Record<string, string | number | boolean | undefined>;

export function logInfo(message: string, context: LogContext = {}) {
  console.log(JSON.stringify({ level: "info", message, ...context }));
}

export function logError(message: string, error: unknown, context: LogContext = {}) {
  console.error(
    JSON.stringify({
      level: "error",
      message,
      error: error instanceof Error ? error.message : String(error),
      ...context
    })
  );
}
