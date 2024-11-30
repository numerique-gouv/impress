import type { Model } from "@ironcalc/wasm";
import { type PointerEvent, type RefObject, useCallback, useRef } from "react";
import type WorksheetCanvas from "./WorksheetCanvas/worksheetCanvas";
import {
  headerColumnWidth,
  headerRowHeight,
} from "./WorksheetCanvas/worksheetCanvas";
import { isInReferenceMode } from "./editor/util";
import type { Cell } from "./types";
import { rangeToStr } from "./util";
import type { WorkbookState } from "./workbookState";

interface PointerSettings {
  canvasElement: RefObject<HTMLCanvasElement>;
  worksheetCanvas: RefObject<WorksheetCanvas | null>;
  worksheetElement: RefObject<HTMLDivElement>;
  onCellSelected: (cell: Cell, event: React.MouseEvent) => void;
  onAreaSelecting: (cell: Cell) => void;
  onAreaSelected: () => void;
  onExtendToCell: (cell: Cell) => void;
  onExtendToEnd: () => void;
  model: Model;
  workbookState: WorkbookState;
  refresh: () => void;
}

interface PointerEvents {
  onPointerDown: (event: PointerEvent) => void;
  onPointerMove: (event: PointerEvent) => void;
  onPointerUp: (event: PointerEvent) => void;
  onPointerHandleDown: (event: PointerEvent) => void;
}

const usePointer = (options: PointerSettings): PointerEvents => {
  const isSelecting = useRef(false);
  const isExtending = useRef(false);
  const isInsertingRef = useRef(false);

  const onPointerMove = useCallback(
    (event: PointerEvent): void => {
      // Range selections are disabled on non-mouse devices. Use touch move only
      // to scroll for now.
      if (event.pointerType !== "mouse") {
        return;
      }

      if (
        !(isSelecting.current || isExtending.current || isInsertingRef.current)
      ) {
        return;
      }
      const { canvasElement, model, worksheetCanvas } = options;
      const canvas = canvasElement.current;
      const worksheet = worksheetCanvas.current;
      // Silence the linter
      if (!worksheet || !canvas) {
        return;
      }
      const canvasRect = canvas.getBoundingClientRect();
      const x = event.clientX - canvasRect.x;
      const y = event.clientY - canvasRect.y;

      const cell = worksheet.getCellByCoordinates(x, y);
      if (!cell) {
        return;
      }

      if (isSelecting.current) {
        options.onAreaSelecting(cell);
      } else if (isExtending.current) {
        options.onExtendToCell(cell);
      } else if (isInsertingRef.current) {
        const { refresh, workbookState } = options;
        const editingCell = workbookState.getEditingCell();
        if (!editingCell || !editingCell.referencedRange) {
          return;
        }
        const range = editingCell.referencedRange.range;
        range.rowEnd = cell.row;
        range.columnEnd = cell.column;

        const sheetNames = model.getWorksheetsProperties().map((s) => s.name);

        editingCell.referencedRange.str = rangeToStr(
          range,
          editingCell.sheet,
          sheetNames[range.sheet],
        );
        workbookState.setEditingCell(editingCell);
        refresh();
      }
    },
    [options],
  );

  const onPointerUp = useCallback(
    (event: PointerEvent): void => {
      if (isSelecting.current) {
        const { worksheetElement } = options;
        isSelecting.current = false;
        worksheetElement.current?.releasePointerCapture(event.pointerId);
        options.onAreaSelected();
      } else if (isExtending.current) {
        const { worksheetElement } = options;
        isExtending.current = false;
        worksheetElement.current?.releasePointerCapture(event.pointerId);
        options.onExtendToEnd();
      } else if (isInsertingRef.current) {
        const { worksheetElement } = options;
        isInsertingRef.current = false;
        worksheetElement.current?.releasePointerCapture(event.pointerId);
      }
    },
    [options],
  );

  const onPointerDown = useCallback(
    (event: PointerEvent) => {
      let x = event.clientX;
      let y = event.clientY;
      const {
        canvasElement,
        model,
        refresh,
        worksheetElement,
        worksheetCanvas,
        workbookState,
      } = options;
      const worksheet = worksheetCanvas.current;
      const canvas = canvasElement.current;
      const worksheetWrapper = worksheetElement.current;
      // Silence the linter
      if (!canvas || !worksheet || !worksheetWrapper) {
        return;
      }
      const canvasRect = canvas.getBoundingClientRect();
      x -= canvasRect.x;
      y -= canvasRect.y;
      // Makes sure is in the sheet area
      if (
        x > canvasRect.width ||
        x < headerColumnWidth ||
        y < headerRowHeight ||
        y > canvasRect.height
      ) {
        if (
          x > 0 &&
          x < headerColumnWidth &&
          y > headerRowHeight &&
          y < canvasRect.height
        ) {
          // Click on a row number
          const cell = worksheet.getCellByCoordinates(headerColumnWidth, y);
          if (cell) {
            // TODO
            // Row selected
          }
        }
        return;
      }

      const editingCell = workbookState.getEditingCell();
      const cell = worksheet.getCellByCoordinates(x, y);
      if (cell) {
        if (editingCell) {
          if (
            cell.row === editingCell.row &&
            cell.column === editingCell.column
          ) {
            // We are clicking on the cell we are editing
            // we do nothing
            return;
          }
          // now we are editing one cell and we click in another one
          // If we can insert a range we do that
          const text = editingCell.text;
          if (isInReferenceMode(text, editingCell.cursorEnd)) {
            const range = {
              sheet: model.getSelectedSheet(),
              rowStart: cell.row,
              rowEnd: cell.row,
              columnStart: cell.column,
              columnEnd: cell.column,
            };
            const sheetNames = model
              .getWorksheetsProperties()
              .map((s) => s.name);
            editingCell.referencedRange = {
              range,
              str: rangeToStr(
                range,
                editingCell.sheet,
                sheetNames[range.sheet],
              ),
            };
            workbookState.setEditingCell(editingCell);
            event.stopPropagation();
            event.preventDefault();
            isInsertingRef.current = true;
            worksheetWrapper.setPointerCapture(event.pointerId);
            refresh();
            return;
          }
          // We are clicking away but we are not in reference mode
          // We finish the editing
          workbookState.clearEditingCell();
          model.setUserInput(
            editingCell.sheet,
            editingCell.row,
            editingCell.column,
            editingCell.text,
          );
          // we continue to select the new cell
        }
        options.onCellSelected(cell, event);
        isSelecting.current = true;
        worksheetWrapper.setPointerCapture(event.pointerId);
      }
    },
    [options],
  );

  const onPointerHandleDown = useCallback(
    (event: PointerEvent) => {
      const worksheetWrapper = options.worksheetElement.current;
      // Silence the linter
      if (!worksheetWrapper) {
        return;
      }
      isExtending.current = true;
      worksheetWrapper.setPointerCapture(event.pointerId);
      event.stopPropagation();
      event.preventDefault();
    },
    [options],
  );

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerHandleDown,
    // onContextMenu,
  };
};

export default usePointer;
