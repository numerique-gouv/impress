import type { Model } from "@ironcalc/wasm";
import { type KeyboardEvent, type RefObject, useCallback } from "react";
import { rangeToStr } from "../util";
import type { WorkbookState } from "../workbookState";
import { isInReferenceMode } from "./util";

interface Options {
  model: Model;
  onEditEnd: () => void;
  onTextUpdated: () => void;
  workbookState: WorkbookState;
  textareaRef: RefObject<HTMLTextAreaElement>;
}

export const useKeyDown = (
  options: Options,
): { onKeyDown: (event: KeyboardEvent) => void } => {
  const { model, onEditEnd, onTextUpdated, workbookState, textareaRef } =
    options;
  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { key, shiftKey, altKey } = event;
      const textarea = textareaRef.current;
      const cell = workbookState.getEditingCell();
      if (!textarea || !cell) {
        return;
      }
      switch (key) {
        case "Enter": {
          if (altKey) {
            // new line
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const value = textarea.value;
            const newText = `${value.slice(0, start)}\n${value.slice(end)}`;
            cell.text = newText;
            workbookState.setEditingCell(cell);
            setTimeout(() => {
              textarea.setSelectionRange(start + 1, start + 1);
            }, 0);
            event.stopPropagation();
            event.preventDefault();
            onTextUpdated();
            return;
          }
          event.stopPropagation();
          event.preventDefault();
          // end edit and select cell bellow (or above if shiftKey)
          model.setUserInput(
            cell.sheet,
            cell.row,
            cell.column,
            cell.text + (cell.referencedRange?.str || ""),
          );
          const sign = shiftKey ? -1 : 1;
          model.setSelectedSheet(cell.sheet);
          model.setSelectedCell(cell.row + sign, cell.column);
          workbookState.clearEditingCell();
          onEditEnd();
          return;
        }
        case "Tab": {
          // end edit and select cell to the right (or left if ShiftKey)
          workbookState.clearEditingCell();
          model.setUserInput(
            cell.sheet,
            cell.row,
            cell.column,
            cell.text + (cell.referencedRange?.str || ""),
          );
          const sign = shiftKey ? -1 : 1;
          model.setSelectedSheet(cell.sheet);
          model.setSelectedCell(cell.row, cell.column + sign);
          if (textareaRef.current) {
            textareaRef.current.value = "";
          }
          event.stopPropagation();
          event.preventDefault();

          onEditEnd();
          return;
        }
        case "Escape": {
          // quit editing without modifying the cell
          const cell = workbookState.getEditingCell();
          if (cell) {
            model.setSelectedSheet(cell.sheet);
          }
          workbookState.clearEditingCell();
          onEditEnd();
          return;
        }
        // TODO: Arrow keys navigate in Excel
        case "ArrowRight": {
          if (cell.mode === "edit") {
            // just edit
            return;
          }
          event.stopPropagation();
          event.preventDefault();

          if (cell.referencedRange) {
            // There is already a reference range we move it to the right
            // (or expand if shift is pressed)
            const sheetNames = model
              .getWorksheetsProperties()
              .map((s) => s.name);
            const range = cell.referencedRange.range;
            if (shiftKey) {
              range.columnEnd += 1;
            } else {
              const column = range.columnStart + 1;
              const row = range.rowStart;
              range.columnStart = column;
              range.columnEnd = column;
              range.rowEnd = row;
            }
            cell.referencedRange = {
              range,
              str: rangeToStr(range, cell.sheet, sheetNames[range.sheet]),
            };
            workbookState.setEditingCell(cell);
            onTextUpdated();
            return;
          }
          if (isInReferenceMode(cell.text, cell.cursorStart)) {
            // there is not a referenced Range but we are in reference mode
            // we select the next cell
            const sheetNames = model
              .getWorksheetsProperties()
              .map((s) => s.name);
            const range = {
              sheet: cell.sheet,
              rowStart: cell.row,
              rowEnd: cell.row,
              columnStart: cell.column + 1,
              columnEnd: cell.column + 1,
            };
            cell.referencedRange = {
              range,
              str: rangeToStr(range, cell.sheet, sheetNames[range.sheet]),
            };
            workbookState.setEditingCell(cell);
            onTextUpdated();
            return;
          }
          // at this point we finish editing and select the cell to the right
          // (or left if ShiftKey is pressed)
          workbookState.clearEditingCell();
          model.setUserInput(cell.sheet, cell.row, cell.column, cell.text);
          model.setSelectedSheet(cell.sheet);
          if (shiftKey) {
            // TODO: ShiftKey
          } else {
            model.setSelectedCell(cell.row, cell.column + 1);
          }
          if (textareaRef.current) {
            textareaRef.current.value = "";
          }

          onEditEnd();
          return;
        }
        case "ArrowLeft": {
          if (cell.mode === "edit") {
            return;
          }
          event.stopPropagation();
          event.preventDefault();
          if (cell.referencedRange) {
            // There is already a reference range we move it to the right
            // (or expand if shift is pressed)
            const sheetNames = model
              .getWorksheetsProperties()
              .map((s) => s.name);
            const range = cell.referencedRange.range;
            if (shiftKey) {
              range.columnEnd -= 1;
            } else {
              const column = range.columnStart - 1;
              const row = range.rowStart;
              range.columnStart = column;
              range.columnEnd = column;
              range.rowEnd = row;
            }
            cell.referencedRange = {
              range,
              str: rangeToStr(range, cell.sheet, sheetNames[range.sheet]),
            };
            workbookState.setEditingCell(cell);
            onTextUpdated();
            return;
          }
          if (isInReferenceMode(cell.text, cell.cursorStart)) {
            // there is not a referenced Range but we are in reference mode
            // we select the next cell
            const sheetNames = model
              .getWorksheetsProperties()
              .map((s) => s.name);
            const range = {
              sheet: cell.sheet,
              rowStart: cell.row,
              rowEnd: cell.row,
              columnStart: cell.column - 1,
              columnEnd: cell.column - 1,
            };
            cell.referencedRange = {
              range,
              str: rangeToStr(range, cell.sheet, sheetNames[range.sheet]),
            };
            workbookState.setEditingCell(cell);
            onTextUpdated();
            return;
          }
          // at this point we finish editing and select the cell to the right
          // (or left if ShiftKey is pressed)
          workbookState.clearEditingCell();
          model.setUserInput(cell.sheet, cell.row, cell.column, cell.text);
          model.setSelectedSheet(cell.sheet);
          if (shiftKey) {
            // TODO: ShiftKey
          } else {
            model.setSelectedCell(cell.row, cell.column - 1);
          }
          if (textareaRef.current) {
            textareaRef.current.value = "";
          }

          onEditEnd();
          return;
        }
        case "ArrowUp": {
          if (cell.mode === "edit") {
            return;
          }
          event.stopPropagation();
          event.preventDefault();
          if (cell.referencedRange) {
            // There is already a reference range we move it to the right
            // (or expand if shift is pressed)
            const sheetNames = model
              .getWorksheetsProperties()
              .map((s) => s.name);
            const range = cell.referencedRange.range;
            if (shiftKey) {
              if (range.rowEnd > range.rowStart) {
                range.rowEnd -= 1;
              } else {
                range.rowStart -= 1;
              }
            } else {
              const column = range.columnStart;
              const row = range.rowStart - 1;
              range.columnStart = column;
              range.columnEnd = column;
              range.rowStart = row;
              range.rowEnd = row;
            }
            cell.referencedRange = {
              range,
              str: rangeToStr(range, cell.sheet, sheetNames[range.sheet]),
            };
            workbookState.setEditingCell(cell);
            onTextUpdated();
            return;
          }
          if (isInReferenceMode(cell.text, cell.cursorStart)) {
            // there is not a referenced Range but we are in reference mode
            // we select the next cell
            const sheetNames = model
              .getWorksheetsProperties()
              .map((s) => s.name);
            const range = {
              sheet: cell.sheet,
              rowStart: cell.row - 1,
              rowEnd: cell.row - 1,
              columnStart: cell.column,
              columnEnd: cell.column,
            };
            cell.referencedRange = {
              range,
              str: rangeToStr(range, cell.sheet, sheetNames[range.sheet]),
            };
            workbookState.setEditingCell(cell);
            onTextUpdated();
            return;
          }
          // at this point we finish editing and select the cell to the right
          // (or left if ShiftKey is pressed)
          workbookState.clearEditingCell();
          model.setUserInput(cell.sheet, cell.row, cell.column, cell.text);
          model.setSelectedSheet(cell.sheet);
          if (shiftKey) {
            // TODO: ShiftKey
          } else {
            model.setSelectedCell(cell.row - 1, cell.column);
          }
          if (textareaRef.current) {
            textareaRef.current.value = "";
          }

          onEditEnd();
          return;
        }
        case "ArrowDown": {
          if (cell.mode === "edit") {
            return;
          }
          event.stopPropagation();
          event.preventDefault();
          if (cell.referencedRange) {
            // There is already a reference range we move it to the right
            // (or expand if shift is pressed)
            const sheetNames = model
              .getWorksheetsProperties()
              .map((s) => s.name);
            const range = cell.referencedRange.range;
            if (shiftKey) {
              range.rowEnd += 1;
            } else {
              const column = range.columnStart;
              const row = range.rowStart + 1;
              range.columnStart = column;
              range.columnEnd = column;
              range.rowStart = row;
              range.rowEnd = row;
            }
            cell.referencedRange = {
              range,
              str: rangeToStr(range, cell.sheet, sheetNames[range.sheet]),
            };
            workbookState.setEditingCell(cell);
            onTextUpdated();
            return;
          }
          if (isInReferenceMode(cell.text, cell.cursorStart)) {
            // there is not a referenced Range but we are in reference mode
            // we select the next cell
            const sheetNames = model
              .getWorksheetsProperties()
              .map((s) => s.name);
            const range = {
              sheet: cell.sheet,
              rowStart: cell.row + 1,
              rowEnd: cell.row + 1,
              columnStart: cell.column,
              columnEnd: cell.column,
            };
            cell.referencedRange = {
              range,
              str: rangeToStr(range, cell.sheet, sheetNames[range.sheet]),
            };
            workbookState.setEditingCell(cell);
            onTextUpdated();
            return;
          }
          // at this point we finish editing and select the cell to the right
          // (or left if ShiftKey is pressed)
          workbookState.clearEditingCell();
          model.setUserInput(cell.sheet, cell.row, cell.column, cell.text);
          model.setSelectedSheet(cell.sheet);
          if (shiftKey) {
            // TODO: ShiftKey
          } else {
            model.setSelectedCell(cell.row + 1, cell.column);
          }
          if (textareaRef.current) {
            textareaRef.current.value = "";
          }

          onEditEnd();
          return;
        }
        case "Shift": {
          return;
        }
        case "PageDown":
        case "PageUp": {
          // TODO: We can do something similar to what we do with navigation keys
          event.stopPropagation();
          event.preventDefault();
          return;
        }
        case "End":
        case "Home": {
          // Excel does something similar to what we do with navigation keys
          cell.mode = "edit";
          workbookState.setEditingCell(cell);
          return;
        }
        default: {
          // noop
        }
      }
    },
    [model, onEditEnd, onTextUpdated, workbookState, textareaRef.current],
  );
  return { onKeyDown };
};

export default useKeyDown;
