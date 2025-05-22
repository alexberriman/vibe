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
 * Extract metadata from a route file by analyzing its content
 */
export async function extractRouteMetadata({
  filePath,
  logger = createLogger(),
}: MetadataExtractorOptions): Promise<RouteMetadata> {
  logger.debug(`Extracting metadata from: ${filePath}`);

  try {
    // Read the file content
    const content = await fs.readFile(filePath, "utf8");

    // Initialize metadata with defaults
    let metadata: RouteMetadata = {
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

    // Check for "use client" directive
    if (content.includes('"use client"') || content.includes("'use client'")) {
      metadata = {
        ...metadata,
        isClientComponent: true,
        isServerComponent: false,
      };
      metadata.directives.push("use client");
    }

    // Check for "use server" directive
    if (content.includes('"use server"') || content.includes("'use server'")) {
      metadata.directives.push("use server");
    }

    // Check for default export
    if (content.match(/export\s+default/)) {
      metadata = { ...metadata, hasDefaultExport: true };
    }

    // Extract named exports
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

    if (namedExports.length > 0) {
      metadata = { ...metadata, namedExports };
    }

    // For API routes, check for HTTP method exports
    const httpMethods = HTTP_METHODS.filter((method) => {
      const regex = new RegExp(`export\\s+(?:async\\s+)?function\\s+${method}`, "i");
      return regex.test(content);
    });

    if (httpMethods.length > 0) {
      metadata = { ...metadata, httpMethods };
    }

    // Extract key imports
    const importMatches = content.match(/import\s+.+\s+from\s+['"`]([^'"`]+)['"`]/g);
    if (importMatches) {
      const imports = importMatches
        .map((match) => {
          const moduleMatch = match.match(/from\s+['"`]([^'"`]+)['"`]/);
          return moduleMatch ? moduleMatch[1] : null;
        })
        .filter(Boolean) as string[];

      // Filter for significant imports (frameworks, libraries, not relative paths)
      const significantImports = imports.filter(
        (imp) => !imp.startsWith(".") && !imp.startsWith("/")
      );

      metadata = { ...metadata, imports: significantImports };
    }

    // Check for middleware usage
    if (
      content.includes("middleware") ||
      content.includes("NextRequest") ||
      content.includes("NextResponse")
    ) {
      metadata = { ...metadata, hasMiddleware: true };
    }

    // Check for error handling patterns
    const hasErrorHandling =
      (content.includes("try") && content.includes("catch")) ||
      content.includes("ErrorBoundary") ||
      content.includes("error.tsx") ||
      content.includes("error.jsx");

    if (hasErrorHandling) {
      metadata = { ...metadata, errorHandling: true };
    }

    // Check for data fetching patterns
    const dataFetchingPatterns = [];

    if (content.includes("fetch(")) {
      dataFetchingPatterns.push("fetch");
    }
    if (content.includes("getServerSideProps")) {
      dataFetchingPatterns.push("getServerSideProps");
    }
    if (content.includes("getStaticProps")) {
      dataFetchingPatterns.push("getStaticProps");
    }
    if (content.includes("getStaticPaths")) {
      dataFetchingPatterns.push("getStaticPaths");
    }
    if (content.includes("generateStaticParams")) {
      dataFetchingPatterns.push("generateStaticParams");
    }
    if (content.includes("generateMetadata")) {
      dataFetchingPatterns.push("generateMetadata");
    }

    if (dataFetchingPatterns.length > 0) {
      metadata = { ...metadata, dataFetching: dataFetchingPatterns };
    }

    logger.debug(`Extracted metadata for ${path.basename(filePath)}:`, metadata);

    return metadata;
  } catch (error) {
    logger.warn(
      `Failed to extract metadata from ${filePath}: ${error instanceof Error ? error.message : "Unknown error"}`
    );

    // Return minimal metadata on error
    return {
      hasDefaultExport: false,
      namedExports: [],
      isClientComponent: false,
      isServerComponent: true,
      hasMiddleware: false,
      imports: [],
      directives: [],
      errorHandling: false,
      dataFetching: [],
    };
  }
}
