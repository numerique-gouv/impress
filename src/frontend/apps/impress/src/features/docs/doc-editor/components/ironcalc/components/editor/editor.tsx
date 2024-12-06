// This is the cell editor for IronCalc
// It is also the single most difficult part of the UX. It is based on an idea of the
// celebrated Polish developer Mateusz Kopec.
// There is a hidden texarea and we only show the caret. What we see is a div with the same text content
// but in HTML so we can have different colors.
// Some keystrokes have different behaviour than a raw HTML text area.
// For those cases we capture the keydown event and stop its propagation.
// As the editor changes content we need to propagate those changes so the spreadsheet can
// mark with colors the active ranges or update the formula in the formula bar
//
// Events outside the editor might influence the editor
// 1. Clicking on a different cell:
//    * might either terminate the editing
//    * or add the external cell to the formula
// 2. Clicking on a sheet tab would open the new sheet or terminate editing
// 3. Clicking somewhere else will finish editing
//
// Keyboard navigation is also fairly complex. For instance RightArrow might:
// 1. End editing and navigate to the cell on the right
// 2. Move the cursor to the right
// 3. Insert in the formula the cell name on the right

// You can either be editing a formula or content.
// When editing content (behaviour is common to Excel and Google Sheets):
// * If you start editing by typing you are in *accept* mode
// * If you start editing by F2 you are in *cruise* mode
// * If you start editing by double click you are in *cruise* mode
// In Google Sheets "Enter" starts editing and puts you in *cruise* mode. We do not do that
// Once you are in cruise mode it is not possible to switch to accept mode
// The only way to go from accept mode to cruise mode is clicking in the content somewhere

// When editing a formula.
// In Google Sheets you are either in insert mode or cruise mode.
// You can get back to accept mode if you delete the whole formula
// In Excel you can be either in insert or accept but if you click in the formula body
// you switch to cruise mode. Once in cruise mode you can go to insert mode by selecting a range.
// Then you are back in accept/insert modes

import type { Model } from "@ironcalc/wasm";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { WorkbookState } from "../workbookState";
import useKeyDown from "./useKeyDown";
import getFormulaHTML from "./util";

const commonCSS: CSSProperties = {
  fontWeight: "inherit",
  fontFamily: "inherit",
  fontSize: "inherit",
  position: "absolute",
  left: 0,
  top: 0,
  whiteSpace: "pre",
  width: "100%",
  padding: 0,
  lineHeight: "22px",
};

const caretColor = "rgb(242, 153, 74)";

interface EditorOptions {
  originalText: string;
  onEditEnd: () => void;
  onTextUpdated: () => void;
  model: Model;
  workbookState: WorkbookState;
  type: "cell" | "formula-bar";
}

const Editor = (options: EditorOptions) => {
  const { model, onEditEnd, onTextUpdated, originalText, workbookState, type } =
    options;

  const [text, setText] = useState(originalText);

  const formulaRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(originalText);
    if (textareaRef.current) {
      textareaRef.current.value = originalText;
    }
  }, [originalText]);

  const { onKeyDown } = useKeyDown({
    model,
    onEditEnd,
    onTextUpdated,
    workbookState,
    textareaRef,
  });

  useEffect(() => {
    const cell = workbookState.getEditingCell();
    if (!cell) {
      return;
    }
    const { editorWidth, editorHeight } = cell;
    if (formulaRef.current) {
      const scrollWidth = formulaRef.current.scrollWidth;
      if (scrollWidth > editorWidth - 5) {
        cell.editorWidth = scrollWidth + 10;
      }
      const scrollHeight = formulaRef.current.scrollHeight;
      if (scrollHeight > editorHeight) {
        cell.editorHeight = scrollHeight;
      }
    }
    if (type === cell.focus) {
      textareaRef.current?.focus();
    }
  });

  const onChange = useCallback(() => {
    const textarea = textareaRef.current;
    const cell = workbookState.getEditingCell();
    if (!textarea || !cell) {
      return;
    }
    const value = textarea.value;
    cell.text = value;
    cell.referencedRange = null;
    cell.cursorStart = textarea.selectionStart;
    cell.cursorEnd = textarea.selectionEnd;
    const styledFormula = getFormulaHTML(model, value);
    if (value === "" && type === "cell") {
      // When we delete the content of a cell we jump to accept mode
      cell.mode = "accept";
    }
    workbookState.setEditingCell(cell);

    workbookState.setActiveRanges(styledFormula.activeRanges);
    setText(cell.text);

    onTextUpdated();

    // Should we stop propagations?
    // event.stopPropagation();
    // event.preventDefault();
  }, [workbookState, model, onTextUpdated, type]);

  const onBlur = useCallback(() => {
    const cell = workbookState.getEditingCell();
    if (type !== cell?.focus) {
      // If the onBlur event is called because we switch from the cell editor to the formula editor
      // or vice versa, do nothing
      return;
    }
    if (textareaRef.current) {
      textareaRef.current.value = "";
    }

    // This happens if the blur hasn't been taken care before by
    // onclick or onpointerdown events
    // If we are editing a cell finish that
    if (cell) {
      model.setUserInput(
        cell.sheet,
        cell.row,
        cell.column,
        workbookState.getEditingText(),
      );
      workbookState.clearEditingCell();
    }
    onEditEnd();
  }, [model, workbookState, onEditEnd, type]);

  const cell = workbookState.getEditingCell();

  const showEditor = cell !== null || type === "formula-bar" ? "block" : "none";
  const mtext = cell ? workbookState.getEditingText() : originalText;
  const styledFormula = getFormulaHTML(model, mtext).html;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        display: showEditor,
        background: "#FFF",
        fontFamily: "Inter",
        fontSize: "13px",
      }}
    >
      <div
        ref={maskRef}
        style={{
          ...commonCSS,
          textAlign: "left",
          pointerEvents: "none",
          height: "100%",
        }}
      >
        <div
          style={{
            display: "inline-block",
          }}
          ref={formulaRef}
        >
          {styledFormula}
        </div>
      </div>
      <textarea
        ref={textareaRef}
        rows={1}
        style={{
          ...commonCSS,
          color: "transparent",
          backgroundColor: "transparent",
          caretColor,
          outline: "none",
          resize: "none",
          border: "none",
          height: "100%",
          overflow: "hidden",
          alignContent: "baseline",
        }}
        defaultValue={text}
        spellCheck="false"
        onKeyDown={onKeyDown}
        onChange={onChange}
        onBlur={onBlur}
        onPointerDown={(event) => {
          // We are either clicking in the same cell we are editing,
          // in which case we just change the mode to edit, or we click
          // in a different editor, in which case we switch the focus
          const cell = workbookState.getEditingCell();
          if (cell) {
            // We make sure the mode is edit
            cell.mode = "edit";
            cell.focus = type;
            workbookState.setEditingCell(cell);
            event.stopPropagation();
          }
        }}
        onScroll={() => {
          if (maskRef.current && textareaRef.current) {
            maskRef.current.style.left = `-${textareaRef.current.scrollLeft}px`;
            maskRef.current.style.top = `-${textareaRef.current.scrollTop}px`;
          }
        }}
        onPaste={(event) => event.stopPropagation()}
      />
    </div>
  );
};
export default Editor;
