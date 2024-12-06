import type { Area, Cell } from "./types";

import { columnNameFromNumber } from "@ironcalc/wasm";

/**
 *  Returns true if the keypress should start editing
 */
export function isEditingKey(key: string): boolean {
  if (key.length !== 1) {
    return false;
  }
  const code = key.codePointAt(0) ?? 0;
  if (code > 0 && code < 255) {
    return true;
  }
  return false;
}

export type NavigationKey =
  | "ArrowRight"
  | "ArrowLeft"
  | "ArrowDown"
  | "ArrowUp"
  | "Home"
  | "End";

export const isNavigationKey = (key: string): key is NavigationKey =>
  ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"].includes(
    key,
  );

export const getCellAddress = (selectedArea: Area, selectedCell: Cell) => {
  const isSingleCell =
    selectedArea.rowStart === selectedArea.rowEnd &&
    selectedArea.columnEnd === selectedArea.columnStart;

  return isSingleCell
    ? `${columnNameFromNumber(selectedCell.column)}${selectedCell.row}`
    : `${columnNameFromNumber(selectedArea.columnStart)}${
        selectedArea.rowStart
      }:${columnNameFromNumber(selectedArea.columnEnd)}${selectedArea.rowEnd}`;
};

export function rangeToStr(
  range: {
    sheet: number;
    rowStart: number;
    rowEnd: number;
    columnStart: number;
    columnEnd: number;
  },
  referenceSheet: number,
  referenceName: string,
): string {
  const { sheet, rowStart, rowEnd, columnStart, columnEnd } = range;
  const sheetName = sheet === referenceSheet ? "" : `'${referenceName}'!`;
  if (rowStart === rowEnd && columnStart === columnEnd) {
    return `${sheetName}${columnNameFromNumber(columnStart)}${rowStart}`;
  }
  return `${sheetName}${columnNameFromNumber(
    columnStart,
  )}${rowStart}:${columnNameFromNumber(columnEnd)}${rowEnd}`;
}
