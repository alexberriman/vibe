import path from "node:path";

/**
 * Types of special files in Next.js
 */
export type NextjsFileType =
  | "page"
  | "layout"
  | "route"
  | "loading"
  | "not-found"
  | "error"
  | "template"
  | "middleware"
  | "default"
  | "api"
  | "other";

/**
 * Special file detection result
 */
export type NextjsSpecialFileInfo = {
  readonly filePath: string;
  readonly fileName: string;
  readonly fileType: NextjsFileType;
  readonly extension: string;
  readonly isSpecialFile: boolean;
  readonly isServerComponent: boolean;
  readonly isClientComponent: boolean;
};

/**
 * List of recognized Next.js special file names (without extensions)
 */
const NEXTJS_SPECIAL_FILES = [
  "page",
  "layout",
  "route",
  "loading",
  "not-found",
  "error",
  "template",
  "default",
  "middleware",
];

/**
 * List of file extensions to consider
 */
const VALID_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx"];

/**
 * Check if a file is a special Next.js file
 */
export function isNextjsSpecialFile(filePath: string): boolean {
  const fileName = path.basename(filePath);
  const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
  const fileExt = path.extname(filePath);

  // Check if it has a valid extension
  if (!VALID_EXTENSIONS.includes(fileExt)) {
    return false;
  }

  // Check if it's a special file name
  return (
    NEXTJS_SPECIAL_FILES.includes(fileNameWithoutExt) ||
    // Consider index.* files as special files (they become route endpoints)
    fileNameWithoutExt === "index"
  );
}

/**
 * Detect if a file is a client component (indicated by "use client" directive)
 * This is a simplified detection - a real implementation would actually read the file contents
 * to check for the "use client" directive at the top of the file.
 *
 * For this implementation, we're just checking the file extension to determine if it's likely a client component
 */
function isClientComponent(filePath: string): boolean {
  const ext = path.extname(filePath);
  // JSX files are more likely to be client components
  return ext === ".jsx" || ext === ".tsx";
}

/**
 * Map a file name to its Next.js file type
 */
function getFileType(fileName: string): NextjsFileType {
  const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, "");

  if (NEXTJS_SPECIAL_FILES.includes(fileNameWithoutExt)) {
    return fileNameWithoutExt as NextjsFileType;
  }

  // Treat index files as page files for routing purposes
  if (fileNameWithoutExt === "index") {
    return "page";
  }

  return "other";
}

/**
 * Analyze a file path to detect if it's a special Next.js file and determine its type
 */
export function detectNextjsSpecialFile(filePath: string): NextjsSpecialFileInfo {
  const fileName = path.basename(filePath);
  const extension = path.extname(filePath);
  const fileType = getFileType(fileName);
  const isSpecialFile = NEXTJS_SPECIAL_FILES.includes(fileType);
  const isClientComp = isClientComponent(filePath);

  return {
    filePath,
    fileName,
    fileType,
    extension,
    isSpecialFile,
    isClientComponent: isClientComp,
    isServerComponent: isSpecialFile && !isClientComp,
  };
}

/**
 * Filter an array of file paths to only include Next.js special files
 */
export function filterNextjsSpecialFiles(filePaths: string[]): string[] {
  return filePaths.filter(isNextjsSpecialFile);
}

/**
 * Analyze an array of file paths to detect all Next.js special files
 */
export function analyzeNextjsFiles(filePaths: string[]): NextjsSpecialFileInfo[] {
  return filePaths.map(detectNextjsSpecialFile).filter((info) => info.isSpecialFile);
}
