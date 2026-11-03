/**
 * Sequential record codes following the existing conventions
 * (students: STU-0001, teachers: EMP-0001). Codes in other formats are ignored.
 */
export function nextSequentialCode(prefix: string, existing: string[], width = 4): string {
  const re = new RegExp(`^${prefix}-(\\d+)$`);
  let max = 0;
  for (const code of existing) {
    const m = re.exec(code.trim());
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${prefix}-${String(max + 1).padStart(width, "0")}`;
}

/** Splits "Amina Hassan Ali" into first "Amina" and last "Hassan Ali". */
export function splitFullName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: parts[0] };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}
