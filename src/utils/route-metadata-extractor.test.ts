import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs/promises";
import { extractRouteMetadata } from "./route-metadata-extractor.js";

// Mock fs
vi.mock("node:fs/promises");
const mockFs = vi.mocked(fs);

// Mock logger
vi.mock("./logger.js", () => ({
  createLogger: vi.fn().mockReturnValue({
    debug: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("extractRouteMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should extract metadata from a client component", async () => {
    const content = `
"use client"
import React from "react"
import { useState } from "react"

export default function HomePage() {
  return <div>Hello World</div>
}
    `;

    mockFs.readFile.mockResolvedValue(content);

    const metadata = await extractRouteMetadata({ filePath: "/test/page.tsx" });

    expect(metadata.isClientComponent).toBe(true);
    expect(metadata.isServerComponent).toBe(false);
    expect(metadata.hasDefaultExport).toBe(true);
    expect(metadata.directives).toContain("use client");
    expect(metadata.imports).toContain("react");
  });

  it("should extract metadata from an API route", async () => {
    const content = `
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "Hello" })
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
    `;

    mockFs.readFile.mockResolvedValue(content);

    const metadata = await extractRouteMetadata({ filePath: "/test/route.ts" });

    expect(metadata.httpMethods).toContain("GET");
    expect(metadata.httpMethods).toContain("POST");
    expect(metadata.namedExports).toContain("GET");
    expect(metadata.namedExports).toContain("POST");
    expect(metadata.hasMiddleware).toBe(true);
    expect(metadata.errorHandling).toBe(true);
    expect(metadata.imports).toContain("next/server");
  });

  it("should extract metadata from a server component with data fetching", async () => {
    const content = `
import { generateMetadata } from "next"

export async function generateMetadata() {
  return {
    title: "Dynamic Title"
  }
}

export async function generateStaticParams() {
  const data = await fetch("https://api.example.com/posts")
  const posts = await data.json()
  return posts.map(post => ({ slug: post.slug }))
}

export default async function PostPage({ params }) {
  const post = await fetch(\`https://api.example.com/posts/\${params.slug}\`)
  const data = await post.json()
  
  return <div>{data.title}</div>
}
    `;

    mockFs.readFile.mockResolvedValue(content);

    const metadata = await extractRouteMetadata({ filePath: "/test/page.tsx" });

    expect(metadata.isServerComponent).toBe(true);
    expect(metadata.isClientComponent).toBe(false);
    expect(metadata.hasDefaultExport).toBe(true);
    expect(metadata.namedExports).toContain("generateMetadata");
    expect(metadata.namedExports).toContain("generateStaticParams");
    expect(metadata.dataFetching).toContain("generateMetadata");
    expect(metadata.dataFetching).toContain("generateStaticParams");
    expect(metadata.dataFetching).toContain("fetch");
  });

  it("should extract metadata from a pages router component", async () => {
    const content = `
import { GetServerSideProps, GetStaticProps } from "next"

export const getServerSideProps: GetServerSideProps = async (context) => {
  const data = await fetch("https://api.example.com/data")
  return {
    props: {
      data: await data.json()
    }
  }
}

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {},
    revalidate: 60
  }
}

export default function Page({ data }) {
  return <div>{data.title}</div>
}
    `;

    mockFs.readFile.mockResolvedValue(content);

    const metadata = await extractRouteMetadata({ filePath: "/test/page.tsx" });

    expect(metadata.hasDefaultExport).toBe(true);
    expect(metadata.namedExports).toContain("getServerSideProps");
    expect(metadata.namedExports).toContain("getStaticProps");
    expect(metadata.dataFetching).toContain("getServerSideProps");
    expect(metadata.dataFetching).toContain("getStaticProps");
    expect(metadata.dataFetching).toContain("fetch");
    expect(metadata.imports).toContain("next");
  });

  it("should handle file read errors gracefully", async () => {
    mockFs.readFile.mockRejectedValue(new Error("File not found"));

    const metadata = await extractRouteMetadata({ filePath: "/nonexistent/file.tsx" });

    expect(metadata.hasDefaultExport).toBe(false);
    expect(metadata.isServerComponent).toBe(true);
    expect(metadata.isClientComponent).toBe(false);
    expect(metadata.namedExports).toEqual([]);
  });

  it("should detect use server directive", async () => {
    const content = `
"use server"

export async function createUser(formData: FormData) {
  // Server action
}
    `;

    mockFs.readFile.mockResolvedValue(content);

    const metadata = await extractRouteMetadata({ filePath: "/test/actions.ts" });

    expect(metadata.directives).toContain("use server");
    expect(metadata.namedExports).toContain("createUser");
  });

  it("should detect error handling patterns", async () => {
    const content = `
import { ErrorBoundary } from "react-error-boundary"

export default function Layout({ children }) {
  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      {children}
    </ErrorBoundary>
  )
}
    `;

    mockFs.readFile.mockResolvedValue(content);

    const metadata = await extractRouteMetadata({ filePath: "/test/layout.tsx" });

    expect(metadata.errorHandling).toBe(true);
    expect(metadata.imports).toContain("react-error-boundary");
  });
});
