import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("platform privilege signup regression", () => {
  const migration = readFileSync(
    "drizzle/migrations/0004_prevent_signup_platform_privileges.sql",
    "utf8",
  );

  it("retains profile creation without email-derived platform role grants", () => {
    expect(migration).toContain("INSERT INTO public.profiles");
    expect(migration).not.toMatch(/INSERT\s+INTO\s+public\.user_roles/i);
    expect(migration).not.toContain("super_admin_seeds");
  });

  it("does not delete existing administrator roles", () => {
    expect(migration).not.toMatch(/DELETE\s+FROM|TRUNCATE/i);
  });
});