import type { Model } from "@ironcalc/wasm";
import { styled } from "@mui/material";
import { Fx } from "../icons";
import {
  COLUMN_WIDTH_SCALE,
  ROW_HEIGH_SCALE,
} from "./WorksheetCanvas/constants";
import { FORMULA_BAR_HEIGH } from "./constants";
import Editor from "./editor/editor";
import type { WorkbookState } from "./workbookState";

type FormulaBarProps = {
  cellAddress: string;
  formulaValue: string;
  model: Model;
  workbookState: WorkbookState;
  onChange: () => void;
  onTextUpdated: () => void;
};

const headerColumnWidth = 35;

function FormulaBar(properties: FormulaBarProps) {
  const {
    cellAddress,
    formulaValue,
    model,
    onChange,
    onTextUpdated,
    workbookState,
  } = properties;
  return (
    <Container>
      <AddressContainer>
        <CellBarAddress>{cellAddress}</CellBarAddress>
      </AddressContainer>
      <Divider />
      <FormulaContainer>
        <FormulaSymbolButton>
          <Fx />
        </FormulaSymbolButton>
        <EditorWrapper
          onClick={(event) => {
            const [sheet, row, column] = model.getSelectedCell();
            const editorWidth =
              model.getColumnWidth(sheet, column) * COLUMN_WIDTH_SCALE;
            const editorHeight =
              model.getRowHeight(sheet, row) * ROW_HEIGH_SCALE;
            workbookState.setEditingCell({
              sheet,
              row,
              column,
              text: formulaValue,
              referencedRange: null,
              cursorStart: formulaValue.length,
              cursorEnd: formulaValue.length,
              focus: "formula-bar",
              activeRanges: [],
              mode: "edit",
              editorWidth,
              editorHeight,
            });
            event.stopPropagation();
            event.preventDefault();
          }}
        >
          <Editor
            originalText={formulaValue}
            model={model}
            workbookState={workbookState}
            onEditEnd={() => {
              onChange();
            }}
            onTextUpdated={onTextUpdated}
            type="formula-bar"
          />
        </EditorWrapper>
      </FormulaContainer>
    </Container>
  );
}

const StyledButton = styled("div")`
  display: inline-flex;
  align-items: center;
  width: 15px;
  min-width: 0px;
  padding: 0px;
  color: inherit;
  font-weight: inherit;
  svg {
    width: 15px;
    height: 15px;
  }
`;

const FormulaSymbolButton = styled(StyledButton)`
  margin-right: 8px;
`;

const Divider = styled("div")`
  background-color: #e0e0e0;
  width: 1px;
  height: 20px;
  margin-left: 16px;
  margin-right: 16px;
`;

const FormulaContainer = styled("div")`
  margin-left: 0px;
  line-height: 22px;
  font-weight: normal;
  width: 100%;
  height: 22px;
  display: flex;
`;

const Container = styled("div")`
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  background: ${(properties): string =>
    properties.theme.palette.background.default};
  height: ${FORMULA_BAR_HEIGH}px;
`;

const AddressContainer = styled("div")`
  padding-left: 16px;
  color: #333;
  font-style: normal;
  font-weight: normal;
  font-size: 11px;
  display: flex;
  font-weight: 600;
  flex-grow: row;
  min-width: ${headerColumnWidth}px;
`;

const CellBarAddress = styled("div")`
  width: 100%;
  text-align: "center";
`;

const EditorWrapper = styled("div")`
  position: relative;
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
`;

export default FormulaBar;
