import { describe, it, expect } from "vitest";
import { getTitleForPath } from "../stores/tab-store";

describe("getTitleForPath", () => {
  it("should return correct title for known paths", () => {
    expect(getTitleForPath("/")).toBe("Dashboard");
    expect(getTitleForPath("/issues")).toBe("Issues");
    expect(getTitleForPath("/agents")).toBe("Agents");
    expect(getTitleForPath("/inbox")).toBe("Inbox");
    expect(getTitleForPath("/projects")).toBe("Projects");
    expect(getTitleForPath("/settings")).toBe("Settings");
  });

  it("should extract issue ID for issue detail paths", () => {
    expect(getTitleForPath("/issues/123")).toBe("Issue 123");
    expect(getTitleForPath("/issues/abc-def")).toBe("Issue abc-def");
  });

  it("should extract project ID for project detail paths", () => {
    expect(getTitleForPath("/projects/my-project")).toBe("Project my-project");
  });

  it("should return last segment for unknown paths", () => {
    expect(getTitleForPath("/some/unknown/path")).toBe("path");
  });
});
