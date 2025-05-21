import { createServer } from "node:net";
import { Result, Ok, Err } from "ts-results";
import type { Logger } from "pino";
import { setTimeout, clearTimeout } from "node:timers";

// Define ErrnoException type (Node.js system errors)
type ErrnoException = Error & {
  errno?: number;
  code?: string;
  path?: string;
  syscall?: string;
};

// Using the global fetch API from Node.js 18+
// Since TypeScript might not recognize global fetch by default,
// we'll use the type workaround below
declare const fetch: typeof globalThis.fetch;

/**
 * Options for checking port availability
 */
type CheckPortOptions = {
  readonly port: number;
  readonly host?: string;
  readonly logger?: Logger;
};

/**
 * Check if a port is available
 */
export async function isPortAvailable({
  port,
  host = "localhost",
  logger,
}: CheckPortOptions): Promise<Result<boolean, Error>> {
  return new Promise((resolve) => {
    const server = createServer();

    // Handle server errors
    server.on("error", (error: ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        logger?.debug(`Port ${port} is already in use`);
        resolve(Ok(false));
      } else {
        logger?.error(`Error checking port ${port}: ${error.message}`);
        resolve(Err(new Error(`Error checking port: ${error.message}`)));
      }
    });

    // Handle successful listening
    server.on("listening", () => {
      logger?.debug(`Port ${port} is available`);
      // Close the server and return true (port is available)
      server.close(() => {
        resolve(Ok(true));
      });
    });

    // Try to listen on the port
    try {
      server.listen(port, host);
    } catch (error) {
      logger?.error(`Error trying to listen on port ${port}: ${String(error)}`);
      resolve(Err(new Error(`Error trying to listen on port: ${String(error)}`)));
    }
  });
}

/**
 * Options for checking URL availability
 */
type CheckUrlOptions = {
  readonly url: string;
  readonly timeout?: number;
  readonly method?: string;
  readonly logger?: Logger;
};

/**
 * Check if a URL is available
 */
export async function isUrlAvailable({
  url,
  timeout = 5000,
  method = "HEAD",
  logger,
}: CheckUrlOptions): Promise<Result<boolean, Error>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      logger?.debug(`Checking URL availability: ${url}`);
      const response = await fetch(url, {
        method,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Consider 2xx and 3xx status codes as "available"
      const isAvailable = response.status >= 200 && response.status < 400;

      if (isAvailable) {
        logger?.debug(`URL ${url} is available (status: ${response.status})`);
      } else {
        logger?.debug(`URL ${url} returned status code ${response.status}`);
      }

      return Ok(isAvailable);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        logger?.debug(`Request to ${url} timed out after ${timeout}ms`);
        return Ok(false);
      }

      logger?.debug(`Error checking URL ${url}: ${String(error)}`);
      return Ok(false);
    }
  } catch (error) {
    logger?.error(`Unexpected error checking URL ${url}: ${String(error)}`);
    return Err(new Error(`Unexpected error checking URL: ${String(error)}`));
  }
}

/**
 * Wait for a port to become available
 */
export async function waitForPort({
  port,
  host = "localhost",
  timeout = 60000,
  interval = 1000,
  logger,
}: CheckPortOptions & {
  readonly timeout?: number;
  readonly interval?: number;
}): Promise<Result<boolean, Error>> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await isPortAvailable({ port, host, logger });

    if (result.err) {
      return result;
    }

    if (result.val) {
      return Ok(true);
    }

    // Wait for the next check
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  logger?.debug(`Timed out waiting for port ${port} to become available`);
  return Ok(false);
}

/**
 * Wait for a URL to become available
 */
export async function waitForUrl({
  url,
  timeout = 60000,
  interval = 1000,
  method = "HEAD",
  logger,
}: CheckUrlOptions & {
  readonly interval?: number;
}): Promise<Result<boolean, Error>> {
  const startTime = Date.now();
  const requestTimeout = Math.min(5000, interval);

  while (Date.now() - startTime < timeout) {
    const result = await isUrlAvailable({
      url,
      timeout: requestTimeout,
      method,
      logger,
    });

    if (result.err) {
      return result;
    }

    if (result.val) {
      return Ok(true);
    }

    // Wait for the next check
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  logger?.debug(`Timed out waiting for URL ${url} to become available`);
  return Ok(false);
}
