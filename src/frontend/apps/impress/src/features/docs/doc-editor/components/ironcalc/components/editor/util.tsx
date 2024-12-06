import {
  type Model,
  type Range,
  type Reference,
  type TokenType,
  getTokens,
} from "@ironcalc/wasm";
import type { ActiveRange } from "../workbookState";

export function tokenIsReferenceType(token: TokenType): token is Reference {
  return typeof token === "object" && "Reference" in token;
}

export function tokenIsRangeType(token: TokenType): token is Range {
  return typeof token === "object" && "Range" in token;
}

export function isInReferenceMode(text: string, cursor: number): boolean {
  // FIXME
  // This is a gross oversimplification
  // Returns true if both are true:
  // 1. Cursor is at the end
  // 2. Last char is one of [',', '(', '+', '*', '-', '/', '<', '>', '=', '&']
  // This has many false positives like '="1+' and also likely some false negatives
  // The right way of doing this is to have a partial parse of the formula tree
  // and check if the next token could be a reference
  if (!text.startsWith("=")) {
    return false;
  }
  if (text === "=") {
    return true;
  }
  const l = text.length;
  const chars = [",", "(", "+", "*", "-", "/", "<", ">", "=", "&"];
  if (cursor === l && chars.includes(text[l - 1])) {
    return true;
  }
  return false;
}

// IronCalc Color Palette
export function getColor(index: number, alpha = 1): string {
  const colors = [
    {
      name: "Cyan",
      rgba: [89, 185, 188, 1],
      hex: "#59B9BC",
    },
    {
      name: "Flamingo",
      rgba: [236, 87, 83, 1],
      hex: "#EC5753",
    },
    {
      hex: "#3358B7",
      rgba: [51, 88, 183, 1],
      name: "Blue",
    },
    {
      hex: "#F8CD3C",
      rgba: [248, 205, 60, 1],
      name: "Yellow",
    },
    {
      hex: "#3BB68A",
      rgba: [59, 182, 138, 1],
      name: "Emerald",
    },
    {
      hex: "#523E93",
      rgba: [82, 62, 147, 1],
      name: "Violet",
    },
    {
      hex: "#A23C52",
      rgba: [162, 60, 82, 1],
      name: "Burgundy",
    },
    {
      hex: "#8CB354",
      rgba: [162, 60, 82, 1],
      name: "Wasabi",
    },
    {
      hex: "#D03627",
      rgba: [208, 54, 39, 1],
      name: "Red",
    },
    {
      hex: "#1B717E",
      rgba: [27, 113, 126, 1],
      name: "Teal",
    },
  ];
  if (alpha === 1) {
    return colors[index % 10].hex;
  }
  const { rgba } = colors[index % 10];
  return `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${alpha})`;
}

function getFormulaHTML(
  model: Model,
  text: string,
): { html: JSX.Element[]; activeRanges: ActiveRange[] } {
  let html: JSX.Element[] = [];
  const activeRanges: ActiveRange[] = [];
  let colorCount = 0;
  if (text.startsWith("=")) {
    const formula = text.slice(1);
    const tokens = getTokens(formula);
    const tokenCount = tokens.length;
    const usedColors: Record<string, string> = {};
    const sheet = model.getSelectedSheet();
    const sheetList = model.getWorksheetsProperties().map((s) => s.name);
    for (let index = 0; index < tokenCount; index += 1) {
      const { token, start, end } = tokens[index];
      if (tokenIsReferenceType(token)) {
        const { sheet: refSheet, row, column } = token.Reference;
        const sheetIndex = refSheet ? sheetList.indexOf(refSheet) : sheet;
        const key = `${sheetIndex}-${row}-${column}`;
        let color = usedColors[key];
        if (!color) {
          color = getColor(colorCount);
          usedColors[key] = color;
          colorCount += 1;
        }
        html.push(
          <span key={index} style={{ color }}>
            {formula.slice(start, end)}
          </span>,
        );
        activeRanges.push({
          sheet: sheetIndex,
          rowStart: row,
          columnStart: column,
          rowEnd: row,
          columnEnd: column,
          color,
        });
      } else if (tokenIsRangeType(token)) {
        let {
          sheet: refSheet,
          left: { row: rowStart, column: columnStart },
          right: { row: rowEnd, column: columnEnd },
        } = token.Range;
        const sheetIndex = refSheet ? sheetList.indexOf(refSheet) : sheet;

        const key = `${sheetIndex}-${rowStart}-${columnStart}:${rowEnd}-${columnEnd}`;
        let color = usedColors[key];
        if (!color) {
          color = getColor(colorCount);
          usedColors[key] = color;
          colorCount += 1;
        }

        if (rowStart > rowEnd) {
          [rowStart, rowEnd] = [rowEnd, rowStart];
        }
        if (columnStart > columnEnd) {
          [columnStart, columnEnd] = [columnEnd, columnStart];
        }
        html.push(
          <span key={index} style={{ color }}>
            {formula.slice(start, end)}
          </span>,
        );
        colorCount += 1;

        activeRanges.push({
          sheet: sheetIndex,
          rowStart,
          columnStart,
          rowEnd,
          columnEnd,
          color,
        });
      } else {
        html.push(<span key={index}>{formula.slice(start, end)}</span>);
      }
    }
    html = [<span key="equals">=</span>].concat(html);
  } else {
    html = [<span key="single">{text}</span>];
  }
  return { html, activeRanges };
}

export default getFormulaHTML;
