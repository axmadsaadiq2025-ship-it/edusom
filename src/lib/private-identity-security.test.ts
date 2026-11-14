import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("private identity security", () => {
  const sql = readFileSync("drizzle/migrations/0005_scope_private_identity_helpers.sql", "utf8");
  for (const name of ["has_role", "get_teacher_id", "get_parent_id", "get_student_id", "get_user_school", "is_school_admin", "is_parent_of_student"]) {
    it(`${name} binds lookups to the caller`, () => {
      const statement = sql.split("\n").find(line => line.startsWith(`CREATE OR REPLACE FUNCTION public.${name}(`));
      expect(statement).toContain("_user_id=auth.uid()");
      expect(statement).toContain("SET search_path=public");
    });
  }
  it("does not log approval recipients", () => {
    const source = readFileSync("src/lib/registration.functions.ts", "utf8");
    expect(source).not.toMatch(/console\.(?:log|info|warn|error)\([^;]*(?:admin_email|admin_phone)/);
  });
});