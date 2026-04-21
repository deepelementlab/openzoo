import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@openzoo/core", () => ({
  useAuthStore: () => ({
    sendCode: vi.fn().mockResolvedValue(true),
    verifyCode: vi.fn().mockResolvedValue({ token: "test-token", user: { id: "1", email: "test@test.com" } }),
  }),
}));

vi.mock("@openzoo/ui", () => ({
  Button: ({ children, onClick, disabled, className, variant }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} data-variant={variant}>
      {children}
    </button>
  ),
  Input: ({ value, onChange, placeholder, type, onKeyDown, autoFocus }: any) => (
    <input value={value} onChange={onChange} placeholder={placeholder} type={type} onKeyDown={onKeyDown} autoFocus={autoFocus} />
  ),
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}));

import { LoginPage } from "../auth/login-page";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders sign in title", () => {
    render(<LoginPage />);
    expect(screen.getByText("Sign in to OpenZoo")).toBeTruthy();
  });

  it("shows email input initially", () => {
    render(<LoginPage />);
    const emailInput = screen.getByPlaceholderText("Email address");
    expect(emailInput).toBeTruthy();
  });

  it("shows send verification code button", () => {
    render(<LoginPage />);
    expect(screen.getByText("Send Verification Code")).toBeTruthy();
  });

  it("disables button when email is empty", () => {
    render(<LoginPage />);
    const button = screen.getByText("Send Verification Code");
    expect(button).toBeDisabled();
  });
});
