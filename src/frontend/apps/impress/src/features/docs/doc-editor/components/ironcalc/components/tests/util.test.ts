import { expect, test } from "vitest";
import { decreaseDecimalPlaces, increaseDecimalPlaces } from "../formatUtil";
import { isNavigationKey } from "../util";

test("checks arrow left is a navigation key", () => {
  expect(isNavigationKey("ArrowLeft")).toBe(true);
  expect(isNavigationKey("Arrow")).toBe(false);
});

test("increase decimals", () => {
  expect(increaseDecimalPlaces('"€"#,##0.00'), '"€"#,##0.000');
  expect(increaseDecimalPlaces("general"), "#,##0.000");
  expect(
    increaseDecimalPlaces('dddd"," mmmm dd"," yyyy'),
    'dddd"," mmmm dd"," yyyy',
  );
});

test("decrease decimals", () => {
  expect(decreaseDecimalPlaces('"€"#,##0.00'), '"€"#,##0.0');
  expect(decreaseDecimalPlaces("general"), "#,##0.0");
  expect(
    decreaseDecimalPlaces('dddd"," mmmm dd"," yyyy'),
    'dddd"," mmmm dd"," yyyy',
  );
});
