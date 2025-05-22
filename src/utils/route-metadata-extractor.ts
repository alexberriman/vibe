import fs from "node:fs/promises";
import path from "node:path";
import type { Logger } from "pino";
import { createLogger } from "./logger.js";

/**
 * Metadata extracted from a Next.js route file
 */
export type RouteMetadata = {
  readonly httpMethods?: string[]; // For API routes (GET, POST, etc.)
  readonly hasDefaultExport: boolean; // Does the file have a default export?
  readonly namedExports: string[]; // Named exports from the file
  readonly isClientComponent: boolean; // Has "use client" directive
  readonly isServerComponent: boolean; // Is a server component (default in App Router)
  readonly hasMiddleware: boolean; // Uses middleware
  readonly imports: string[]; // Key imports (frameworks, libraries)
  readonly directives: string[]; // All "use ..." directives found
  readonly errorHandling: boolean; // Has error boundaries or try/catch
  readonly dataFetching: string[]; // Data fetching patterns (fetch, getServerSideProps, etc.)
};

/**
 * Options for metadata extraction
 */
type MetadataExtractorOptions = {
  readonly filePath: string;
  readonly logger?: Logger;
};

/**
 * HTTP methods commonly used in Next.js API routes
 */
const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];

/**
 * Default metadata values
 */
const DEFAULT_METADATA: RouteMetadata = {
  hasDefaultExport: false,
  namedExports: [],
  isClientComponent: false,
  isServerComponent: true, // Default in Next.js App Router
  hasMiddleware: false,
  imports: [],
  directives: [],
  errorHandling: false,
  dataFetching: [],
};

/**
 * Extract directives from file content
 */
function extractDirectives(content: string): { directives: string[]; isClient: boolean } {
  const directives: string[] = [];
  let isClient = false;

  if (content.includes('"use client"') || content.includes("'use client'")) {
    directives.push("use client");
    isClient = true;
  }

  if (content.includes('"use server"') || content.includes("'use server'")) {
    directives.push("use server");
  }

  return { directives, isClient };
}

/**
 * Extract named exports from file content
 */
function extractNamedExports(content: string): string[] {
  const namedExports: string[] = [];

  // Match export function declarations
  const functionExports = content.match(/export\s+(?:async\s+)?function\s+(\w+)/g);
  if (functionExports) {
    functionExports.forEach((match) => {
      const nameMatch = match.match(/export\s+(?:async\s+)?function\s+(\w+)/);
      if (nameMatch) {
        namedExports.push(nameMatch[1]);
      }
    });
  }

  // Match export const/let/var declarations
  const constExports = content.match(/export\s+(?:const|let|var)\s+(\w+)/g);
  if (constExports) {
    constExports.forEach((match) => {
      const nameMatch = match.match(/export\s+(?:const|let|var)\s+(\w+)/);
      if (nameMatch) {
        namedExports.push(nameMatch[1]);
      }
    });
  }

  // Match direct named exports
  const directExports = content.match(/export\s+\{\s*([^}]+)\s*\}/g);
  if (directExports) {
    directExports.forEach((match) => {
      const nameMatch = match.match(/export\s+\{\s*([^}]+)\s*\}/);
      if (nameMatch) {
        const names = nameMatch[1].split(",").map((name) => name.trim().split(" as ")[0].trim());
        namedExports.push(...names);
      }
    });
  }

  return namedExports;
}

/**
 * Extract HTTP methods for API routes
 */
function extractHttpMethods(content: string): string[] {
  return HTTP_METHODS.filter((method) => {
    const regex = new RegExp(`export\\s+(?:async\\s+)?function\\s+${method}`, "i");
    return regex.test(content);
  });
}

/**
 * Extract significant imports (not relative paths)
 */
function extractImports(content: string): string[] {
  const importMatches = content.match(/import\s+.+\s+from\s+['"`]([^'"`]+)['"`]/g);
  if (!importMatches) {
    return [];
  }

  const imports = importMatches
    .map((match) => {
      const moduleMatch = match.match(/from\s+['"`]([^'"`]+)['"`]/);
      return moduleMatch ? moduleMatch[1] : null;
    })
    .filter(Boolean) as string[];

  return imports.filter((imp) => !imp.startsWith(".") && !imp.startsWith("/"));
}

/**
 * Check for middleware usage
 */
function hasMiddleware(content: string): boolean {
  return (
    content.includes("middleware") ||
    content.includes("NextRequest") ||
    content.includes("NextResponse")
  );
}

/**
 * Check for error handling patterns
 */
function hasErrorHandling(content: string): boolean {
  return (
    (content.includes("try") && content.includes("catch")) ||
    content.includes("ErrorBoundary") ||
    content.includes("error.tsx") ||
    content.includes("error.jsx")
  );
}

/**
 * Extract data fetching patterns
 */
function extractDataFetchingPatterns(content: string): string[] {
  const patterns = [
    { pattern: "fetch(", name: "fetch" },
    { pattern: "getServerSideProps", name: "getServerSideProps" },
    { pattern: "getStaticProps", name: "getStaticProps" },
    { pattern: "getStaticPaths", name: "getStaticPaths" },
    { pattern: "generateStaticParams", name: "generateStaticParams" },
    { pattern: "generateMetadata", name: "generateMetadata" },
  ];

  return patterns.filter(({ pattern }) => content.includes(pattern)).map(({ name }) => name);
}

/**
 * Extract metadata from a route file by analyzing its content
 */
export async function extractRouteMetadata({
  filePath,
  logger = createLogger(),
}: MetadataExtractorOptions): Promise<RouteMetadata> {
  logger.debug(`Extracting metadata from: ${filePath}`);

  try {
    const content = await fs.readFile(filePath, "utf8");

    // Extract different metadata components
    const { directives, isClient } = extractDirectives(content);
    const namedExports = extractNamedExports(content);
    const httpMethods = extractHttpMethods(content);
    const imports = extractImports(content);
    const dataFetching = extractDataFetchingPatterns(content);

    const metadata: RouteMetadata = {
      ...DEFAULT_METADATA,
      hasDefaultExport: /export\s+default/.test(content),
      namedExports,
      isClientComponent: isClient,
      isServerComponent: !isClient,
      hasMiddleware: hasMiddleware(content),
      imports,
      directives,
      errorHandling: hasErrorHandling(content),
      dataFetching,
      ...(httpMethods.length > 0 && { httpMethods }),
    };

    logger.debug(`Extracted metadata for ${path.basename(filePath)}:`, metadata);

    return metadata;
  } catch (error) {
    logger.warn(
      `Failed to extract metadata from ${filePath}: ${error instanceof Error ? error.message : "Unknown error"}`
    );

    return DEFAULT_METADATA;
  }
}
