import { describe, expect, it } from "vitest";
import { nextSequentialCode, splitFullName } from "./codes";

describe("nextSequentialCode", () => {
  it("starts at 0001 when no codes exist", () => {
    expect(nextSequentialCode("STU", [])).toBe("STU-0001");
  });
  it("increments the highest matching code", () => {
    expect(nextSequentialCode("STU", ["STU-0002", "STU-0010", "STU-0003"])).toBe("STU-0011");
  });
  it("ignores codes in other formats", () => {
    expect(nextSequentialCode("EMP", ["Gyy", "EMP-0004", "STU-0099"])).toBe("EMP-0005");
  });
});

describe("splitFullName", () => {
  it("splits first name from the rest", () => {
    expect(splitFullName("Amina Hassan Ali")).toEqual({ first: "Amina", last: "Hassan Ali" });
  });
});
