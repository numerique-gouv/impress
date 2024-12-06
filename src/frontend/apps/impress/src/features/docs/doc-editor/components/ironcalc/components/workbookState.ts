// This are properties of the workbook that are not permanently stored
// They only happen at 'runtime' while the workbook is being used:
//
// * What are we editing
// * Are we copying styles?
// * Are we extending a cell? (by pulling the cell outline handle down, for instance)
//
// Editing the cell is the most complex operation.
//
// * What cell are we editing?
// * Are we doing that from the cell editor or the formula editor?
// * What is the text content of the cell right now
// * The active ranges can technically be computed from the text.
//   Those are the ranges or cells that appear in the formula

import type { CellStyle } from "@ironcalc/wasm";

export interface CutRange {
  sheet: number;
  rowStart: number;
  rowEnd: number;
  columnStart: number;
  columnEnd: number;
}

export enum AreaType {
  rowsDown = 0,
  columnsRight = 1,
  rowsUp = 2,
  columnsLeft = 3,
}

export interface Area {
  type: AreaType;
  rowStart: number;
  rowEnd: number;
  columnStart: number;
  columnEnd: number;
}

// Active ranges are ranges in the sheet that are highlighted when editing a formula
export interface ActiveRange {
  sheet: number;
  rowStart: number;
  rowEnd: number;
  columnStart: number;
  columnEnd: number;
  color: string;
}

export interface ReferencedRange {
  range: {
    sheet: number;
    rowStart: number;
    rowEnd: number;
    columnStart: number;
    columnEnd: number;
  };
  str: string;
}

type Focus = "cell" | "formula-bar";
type EditorMode = "accept" | "edit";

// In "edit" mode arrow keys will move you around the text in the editor
// In "accept" mode arrow keys will accept the content and move to the next cell or select another cell

// The cell that we are editing
export interface EditingCell {
  sheet: number;
  row: number;
  column: number;
  // raw text in the editor
  text: string;
  // position of the cursor
  cursorStart: number;
  cursorEnd: number;
  // referenced range
  referencedRange: ReferencedRange | null;
  focus: Focus;
  activeRanges: ActiveRange[];
  mode: EditorMode;
  editorWidth: number;
  editorHeight: number;
}

// Those are styles that are copied
type AreaStyles = CellStyle[][];

export class WorkbookState {
  private extendToArea: Area | null;
  private copyStyles: AreaStyles | null;
  private cell: EditingCell | null;
  private cutRange: CutRange | null;

  constructor() {
    // the extendTo area is the area we are covering
    this.extendToArea = null;
    this.copyStyles = null;
    this.cell = null;
    this.cutRange = null;
  }

  getExtendToArea(): Area | null {
    return this.extendToArea;
  }

  clearExtendToArea(): void {
    this.extendToArea = null;
  }

  setExtendToArea(area: Area): void {
    this.extendToArea = area;
  }

  setCopyStyles(styles: AreaStyles | null): void {
    this.copyStyles = styles;
  }

  getCopyStyles(): AreaStyles | null {
    return this.copyStyles;
  }

  setActiveRanges(activeRanges: ActiveRange[]) {
    if (!this.cell) {
      return;
    }
    this.cell.activeRanges = activeRanges;
  }

  getActiveRanges(): ActiveRange[] {
    return this.cell?.activeRanges || [];
  }

  getEditingCell(): EditingCell | null {
    return this.cell;
  }

  setEditingCell(cell: EditingCell) {
    this.cell = cell;
  }

  clearEditingCell() {
    this.cell = null;
  }

  isCellEditorActive(): boolean {
    if (this.cell) {
      return this.cell.focus === "cell";
    }
    return false;
  }

  isFormulaEditorActive(): boolean {
    if (this.cell) {
      return this.cell.focus === "formula-bar";
    }
    return false;
  }

  getEditingText(): string {
    const cell = this.cell;
    if (cell) {
      return cell.text + (cell.referencedRange?.str || "");
    }
    return "";
  }

  setCutRange(range: CutRange): void {
    this.cutRange = range;
  }

  clearCutRange(): void {
    this.cutRange = null;
  }

  getCutRange(): CutRange | null {
    return this.cutRange;
  }
}
