import { describe, it, expect } from "vitest";
import { docsNav, getAllSlugs, getDocTitle } from "../docs-nav";

describe("docs-nav", () => {
  it("should have 4 sections", () => {
    expect(docsNav).toHaveLength(4);
  });

  it("should have 15 total documents", () => {
    const slugs = getAllSlugs();
    expect(slugs).toHaveLength(15);
  });

  it("should have unique slugs", () => {
    const slugs = getAllSlugs();
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
  });

  it("should return correct titles", () => {
    expect(getDocTitle("introduction")).toBe("Introduction");
    expect(getDocTitle("quick-start")).toBe("Quick Start");
    expect(getDocTitle("api-protocol")).toBe("API Protocol (Connect-RPC)");
    expect(getDocTitle("nonexistent")).toBeUndefined();
  });

  it("should include all required sections", () => {
    const sectionTitles = docsNav.map((s) => s.title);
    expect(sectionTitles).toContain("Getting Started");
    expect(sectionTitles).toContain("Architecture");
    expect(sectionTitles).toContain("Guides");
    expect(sectionTitles).toContain("Development");
  });
});
