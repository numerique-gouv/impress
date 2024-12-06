import { readFile } from "node:fs/promises";
import { Model, initSync } from "@ironcalc/wasm";
import { expect, test } from "vitest";

// This is a simple test that showcases how to load the wasm module in the tests

test("simple calculation", async () => {
  const buffer = await readFile("node_modules/@ironcalc/wasm/wasm_bg.wasm");
  initSync(buffer);
  const model = new Model("workbook", "en", "UTC");
  model.setUserInput(0, 1, 1, "=21*2");
  expect(model.getFormattedCellValue(0, 1, 1)).toBe("42");
});
