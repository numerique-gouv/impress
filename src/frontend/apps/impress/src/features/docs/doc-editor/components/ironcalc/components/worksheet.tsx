import type { Model } from "@ironcalc/wasm";
import { styled } from "@mui/material/styles";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  COLUMN_WIDTH_SCALE,
  ROW_HEIGH_SCALE,
  outlineBackgroundColor,
  outlineColor,
} from "./WorksheetCanvas/constants";
import WorksheetCanvas from "./WorksheetCanvas/worksheetCanvas";
import {
  FORMULA_BAR_HEIGH,
  NAVIGATION_HEIGH,
  TOOLBAR_HEIGH,
} from "./constants";
import Editor from "./editor/editor";
import type { Cell } from "./types";
import usePointer from "./usePointer";
import { AreaType, type WorkbookState } from "./workbookState";

function useWindowSize() {
  const [size, setSize] = useState([0, 0]);
  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);
  return size;
}

function Worksheet(props: {
  model: Model;
  workbookState: WorkbookState;
  refresh: () => void;
}) {
  const canvasElement = useRef<HTMLCanvasElement>(null);

  const worksheetElement = useRef<HTMLDivElement>(null);
  const scrollElement = useRef<HTMLDivElement>(null);

  const editorElement = useRef<HTMLDivElement>(null);
  const spacerElement = useRef<HTMLDivElement>(null);
  const cellOutline = useRef<HTMLDivElement>(null);
  const areaOutline = useRef<HTMLDivElement>(null);
  const cellOutlineHandle = useRef<HTMLDivElement>(null);
  const extendToOutline = useRef<HTMLDivElement>(null);
  const columnResizeGuide = useRef<HTMLDivElement>(null);
  const rowResizeGuide = useRef<HTMLDivElement>(null);
  const columnHeaders = useRef<HTMLDivElement>(null);
  const worksheetCanvas = useRef<WorksheetCanvas | null>(null);

  const ignoreScrollEventRef = useRef(false);

  const { model, workbookState, refresh } = props;
  const [clientWidth, clientHeight] = useWindowSize();

  useEffect(() => {
    const canvasRef = canvasElement.current;
    const columnGuideRef = columnResizeGuide.current;
    const rowGuideRef = rowResizeGuide.current;
    const columnHeadersRef = columnHeaders.current;
    const worksheetRef = worksheetElement.current;

    const outline = cellOutline.current;
    const handle = cellOutlineHandle.current;
    const area = areaOutline.current;
    const extendTo = extendToOutline.current;
    const editor = editorElement.current;

    if (
      !canvasRef ||
      !columnGuideRef ||
      !rowGuideRef ||
      !columnHeadersRef ||
      !worksheetRef ||
      !outline ||
      !handle ||
      !area ||
      !extendTo ||
      !scrollElement.current ||
      !editor
    )
      return;
    // FIXME: This two need to be computed.
    model.setWindowWidth(clientWidth - 37);
    model.setWindowHeight(clientHeight - 190);
    const canvas = new WorksheetCanvas({
      width: worksheetRef.clientWidth,
      height: worksheetRef.clientHeight,
      model,
      workbookState,
      elements: {
        canvas: canvasRef,
        columnGuide: columnGuideRef,
        rowGuide: rowGuideRef,
        columnHeaders: columnHeadersRef,
        cellOutline: outline,
        cellOutlineHandle: handle,
        areaOutline: area,
        extendToOutline: extendTo,
        editor: editor,
      },
      onColumnWidthChanges(sheet, column, width) {
        model.setColumnWidth(sheet, column, width);
        worksheetCanvas.current?.renderSheet();
      },
      onRowHeightChanges(sheet, row, height) {
        model.setRowHeight(sheet, row, height);
        worksheetCanvas.current?.renderSheet();
      },
    });
    const scrollX = model.getScrollX();
    const scrollY = model.getScrollY();
    const [sheetWidth, sheetHeight] = [scrollX + 100_000, scrollY + 500_000];
    if (spacerElement.current) {
      spacerElement.current.style.height = `${sheetHeight}px`;
      spacerElement.current.style.width = `${sheetWidth}px`;
    }
    const left = scrollElement.current.scrollLeft;
    const top = scrollElement.current.scrollTop;
    if (scrollX !== left) {
      ignoreScrollEventRef.current = true;
      scrollElement.current.scrollLeft = scrollX;
      setTimeout(() => {
        ignoreScrollEventRef.current = false;
      }, 0);
    }

    if (scrollY !== top) {
      ignoreScrollEventRef.current = true;
      scrollElement.current.scrollTop = scrollY;
      setTimeout(() => {
        ignoreScrollEventRef.current = false;
      }, 0);
    }

    canvas.renderSheet();
    worksheetCanvas.current = canvas;
  });

  const {
    onPointerMove,
    onPointerDown,
    onPointerHandleDown,
    onPointerUp,
    // onContextMenu,
  } = usePointer({
    model,
    workbookState,
    refresh,
    onCellSelected: (cell: Cell, event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      model.setSelectedCell(cell.row, cell.column);
      refresh();
    },
    onAreaSelecting: (cell: Cell) => {
      const canvas = worksheetCanvas.current;
      if (!canvas) {
        return;
      }
      const { row, column } = cell;
      model.onAreaSelecting(row, column);
      canvas.renderSheet();
      refresh();
    },
    onAreaSelected: () => {
      const styles = workbookState.getCopyStyles();
      if (styles?.length) {
        model.onPasteStyles(styles);
        const canvas = worksheetCanvas.current;
        if (!canvas) {
          return;
        }
        canvas.renderSheet();
      }
      workbookState.setCopyStyles(null);
      if (worksheetElement.current) {
        worksheetElement.current.style.cursor = "auto";
      }
      refresh();
    },
    onExtendToCell: (cell) => {
      const canvas = worksheetCanvas.current;
      if (!canvas) {
        return;
      }
      const { row, column } = cell;
      const {
        range: [rowStart, columnStart, rowEnd, columnEnd],
      } = model.getSelectedView();
      // We are either extending by rows or by columns
      // And we could be doing it in the positive direction (downwards or right)
      // or the negative direction (upwards or left)

      if (
        row > rowEnd &&
        ((column <= columnEnd && column >= columnStart) ||
          (column < columnStart && columnStart - column < row - rowEnd) ||
          (column > columnEnd && column - columnEnd < row - rowEnd))
      ) {
        // rows downwards
        const area = {
          type: AreaType.rowsDown,
          rowStart: rowEnd + 1,
          rowEnd: row,
          columnStart,
          columnEnd,
        };
        workbookState.setExtendToArea(area);
        canvas.renderSheet();
      } else if (
        row < rowStart &&
        ((column <= columnEnd && column >= columnStart) ||
          (column < columnStart && columnStart - column < rowStart - row) ||
          (column > columnEnd && column - columnEnd < rowStart - row))
      ) {
        // rows upwards
        const area = {
          type: AreaType.rowsUp,
          rowStart: row,
          rowEnd: rowStart,
          columnStart,
          columnEnd,
        };
        workbookState.setExtendToArea(area);
        canvas.renderSheet();
      } else if (
        column > columnEnd &&
        ((row <= rowEnd && row >= rowStart) ||
          (row < rowStart && rowStart - row < column - columnEnd) ||
          (row > rowEnd && row - rowEnd < column - columnEnd))
      ) {
        // columns right
        const area = {
          type: AreaType.columnsRight,
          rowStart,
          rowEnd,
          columnStart: columnEnd + 1,
          columnEnd: column,
        };
        workbookState.setExtendToArea(area);
        canvas.renderSheet();
      } else if (
        column < columnStart &&
        ((row <= rowEnd && row >= rowStart) ||
          (row < rowStart && rowStart - row < columnStart - column) ||
          (row > rowEnd && row - rowEnd < columnStart - column))
      ) {
        // columns left
        const area = {
          type: AreaType.columnsLeft,
          rowStart,
          rowEnd,
          columnStart: column,
          columnEnd: columnStart,
        };
        workbookState.setExtendToArea(area);
        canvas.renderSheet();
      }
    },
    onExtendToEnd: () => {
      const canvas = worksheetCanvas.current;
      if (!canvas) {
        return;
      }
      const { sheet, range } = model.getSelectedView();
      const extendedArea = workbookState.getExtendToArea();
      if (!extendedArea) {
        return;
      }
      const rowStart = Math.min(range[0], range[2]);
      const height = Math.abs(range[2] - range[0]) + 1;
      const width = Math.abs(range[3] - range[1]) + 1;
      const columnStart = Math.min(range[1], range[3]);

      const area = { sheet, row: rowStart, column: columnStart, width, height };

      switch (extendedArea.type) {
        case AreaType.rowsDown:
          model.autoFillRows(area, extendedArea.rowEnd);
          break;
        case AreaType.rowsUp: {
          model.autoFillRows(area, extendedArea.rowStart);
          break;
        }
        case AreaType.columnsRight: {
          model.autoFillColumns(area, extendedArea.columnEnd);
          break;
        }
        case AreaType.columnsLeft: {
          model.autoFillColumns(area, extendedArea.columnStart);
          break;
        }
      }
      model.setSelectedRange(
        Math.min(rowStart, extendedArea.rowStart),
        Math.min(columnStart, extendedArea.columnStart),
        Math.max(rowStart + height - 1, extendedArea.rowEnd),
        Math.max(columnStart + width - 1, extendedArea.columnEnd),
      );
      workbookState.clearExtendToArea();
      canvas.renderSheet();
    },
    canvasElement,
    worksheetElement,
    worksheetCanvas,
  });

  const onScroll = (): void => {
    if (!scrollElement.current || !worksheetCanvas.current) {
      return;
    }
    if (ignoreScrollEventRef.current) {
      // Programmatic scroll ignored
      return;
    }
    const left = scrollElement.current.scrollLeft;
    const top = scrollElement.current.scrollTop;

    worksheetCanvas.current.setScrollPosition({ left, top });
    worksheetCanvas.current.renderSheet();
  };

  return (
    <Wrapper ref={scrollElement} onScroll={onScroll} className="scroll">
      <Spacer ref={spacerElement} />
      <SheetContainer
        className="sheet-container"
        ref={worksheetElement}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onDoubleClick={(event) => {
          // Starts editing cell
          const { sheet, row, column } = model.getSelectedView();
          const text = model.getCellContent(sheet, row, column);
          const editorWidth =
            model.getColumnWidth(sheet, column) * COLUMN_WIDTH_SCALE;
          const editorHeight = model.getRowHeight(sheet, row) * ROW_HEIGH_SCALE;
          workbookState.setEditingCell({
            sheet,
            row,
            column,
            text,
            cursorStart: text.length,
            cursorEnd: text.length,
            focus: "cell",
            referencedRange: null,
            activeRanges: [],
            mode: "accept",
            editorWidth,
            editorHeight,
          });
          event.stopPropagation();
          // event.preventDefault();
          props.refresh();
        }}
      >
        <SheetCanvas ref={canvasElement} />
        <CellOutline ref={cellOutline} />
        <EditorWrapper ref={editorElement}>
          <Editor
            originalText={workbookState.getEditingText()}
            onEditEnd={(): void => {
              props.refresh();
            }}
            onTextUpdated={(): void => {
              props.refresh();
            }}
            model={model}
            workbookState={workbookState}
            type={"cell"}
          />
        </EditorWrapper>
        <AreaOutline ref={areaOutline} />
        <ExtendToOutline ref={extendToOutline} />
        <CellOutlineHandle
          ref={cellOutlineHandle}
          onPointerDown={onPointerHandleDown}
        />
        <ColumnResizeGuide ref={columnResizeGuide} />
        <RowResizeGuide ref={rowResizeGuide} />
        <ColumnHeaders ref={columnHeaders} />
      </SheetContainer>
    </Wrapper>
  );
}

const Spacer = styled("div")`
  position: absolute;
  height: 5000px;
  width: 5000px;
`;

const SheetContainer = styled("div")`
  position: sticky;
  top: 0px;
  left: 0px;
  height: 100%;

  .column-resize-handle {
    position: absolute;
    top: 0px;
    width: 3px;
    opacity: 0;
    background: ${outlineColor};
    border-radius: 5px;
    cursor: col-resize;
  }

  .column-resize-handle:hover {
    opacity: 1;
  }
  .row-resize-handle {
    position: absolute;
    left: 0px;
    height: 3px;
    opacity: 0;
    background: ${outlineColor};
    border-radius: 5px;
    cursor: row-resize;
  }

  .row-resize-handle:hover {
    opacity: 1;
  }
`;

const Wrapper = styled("div")({
  position: "absolute",
  overflow: "scroll",
  top: TOOLBAR_HEIGH + FORMULA_BAR_HEIGH + 1,
  left: 0,
  right: 0,
  bottom: NAVIGATION_HEIGH + 1,
  overscrollBehavior: "none",
});

const SheetCanvas = styled("canvas")`
  position: relative;
  top: 0px;
  left: 0px;
  right: 0px;
  bottom: 40px;
`;

const ColumnResizeGuide = styled("div")`
  position: absolute;
  top: 0px;
  display: none;
  height: 100%;
  width: 0px;
  border-left: 1px dashed ${outlineColor};
`;

const ColumnHeaders = styled("div")`
  position: absolute;
  left: 0px;
  top: 0px;
  overflow: hidden;
  display: flex;
  & .column-header {
    display: inline-block;
    text-align: center;
    overflow: hidden;
    height: 100%;
    user-select: none;
  }
`;

const RowResizeGuide = styled("div")`
  position: absolute;
  display: none;
  left: 0px;
  height: 0px;
  width: 100%;
  border-top: 1px dashed ${outlineColor};
`;

const AreaOutline = styled("div")`
  position: absolute;
  border: 1px solid ${outlineColor};
  border-radius: 3px;
  background-color: ${outlineBackgroundColor};
`;

const CellOutline = styled("div")`
  position: absolute;
  border: 2px solid ${outlineColor};
  border-radius: 3px;
  word-break: break-word;
  font-size: 13px;
  display: flex;
`;

const CellOutlineHandle = styled("div")`
  position: absolute;
  width: 5px;
  height: 5px;
  background: ${outlineColor};
  cursor: crosshair;
  border-radius: 1px;
`;

const ExtendToOutline = styled("div")`
  position: absolute;
  border: 1px dashed ${outlineColor};
  border-radius: 3px;
`;

const EditorWrapper = styled("div")`
  position: absolute;
  width: 100%;
  padding: 0px;
  border-width: 0px;
  outline: none;
  resize: none;
  white-space: pre-wrap;
  vertical-align: bottom;
  overflow: hidden;
  text-align: left;
  span {
    min-width: 1px;
  }
  font-family: monospace;
  border: 2px solid ${outlineColor};
`;

export default Worksheet;
