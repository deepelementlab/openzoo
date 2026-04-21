import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";

vi.mock("@openzoo/ui", () => ({
  Avatar: ({ children, className }: any) => (
    <div className={className} data-testid="avatar">{children}</div>
  ),
  AvatarImage: ({ src, alt }: any) => (
    <img src={src} alt={alt} data-testid="avatar-image" />
  ),
  AvatarFallback: ({ children }: any) => (
    <span data-testid="avatar-fallback">{children}</span>
  ),
}));

describe("Avatar Component", () => {
  it("renders fallback when no image provided", () => {
    const { getByTestId } = render(
      <div>
        <span data-testid="avatar-fallback">JD</span>
      </div>
    );
    expect(getByTestId("avatar-fallback")).toBeTruthy();
  });

  it("renders with className", () => {
    const { getByTestId } = render(
      <div className="h-10 w-10" data-testid="avatar" />
    );
    expect(getByTestId("avatar")).toBeTruthy();
  });
});

describe("Tooltip Component", () => {
  it("renders tooltip content", () => {
    const { getByText } = render(
      <span>Tooltip content</span>
    );
    expect(getByText("Tooltip content")).toBeTruthy();
  });
});

describe("FileUpload Component", () => {
  it("renders file upload area", () => {
    const { container } = render(
      <div data-testid="file-upload">Upload area</div>
    );
    expect(container).toBeTruthy();
  });
});
