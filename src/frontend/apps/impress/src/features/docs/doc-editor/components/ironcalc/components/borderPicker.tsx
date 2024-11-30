import { type BorderOptions, BorderStyle, BorderType } from "@ironcalc/wasm";
import Popover, { type PopoverOrigin } from "@mui/material/Popover";
import { styled } from "@mui/material/styles";
import {
  Grid2X2 as BorderAllIcon,
  ChevronRight,
  PencilLine,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BorderBottomIcon,
  BorderCenterHIcon,
  BorderCenterVIcon,
  BorderInnerIcon,
  BorderLeftIcon,
  BorderNoneIcon,
  BorderOuterIcon,
  BorderRightIcon,
  BorderStyleIcon,
  BorderTopIcon,
} from "../icons";
import { theme } from "../theme";
import ColorPicker from "./colorPicker";

type BorderPickerProps = {
  className?: string;
  onChange: (border: BorderOptions) => void;
  onClose: () => void;
  anchorEl: React.RefObject<HTMLElement>;
  anchorOrigin?: PopoverOrigin;
  transformOrigin?: PopoverOrigin;
  open: boolean;
};

const BorderPicker = (properties: BorderPickerProps) => {
  const { t } = useTranslation();

  const [borderSelected, setBorderSelected] = useState<BorderType | null>(null);
  const [borderColor, setBorderColor] = useState("#000000");
  const [borderStyle, setBorderStyle] = useState(BorderStyle.Thin);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [stylePickerOpen, setStylePickerOpen] = useState(false);

  // FIXME
  // biome-ignore lint/correctness/useExhaustiveDependencies: We don't want updating the function every time the properties.onChange
  useEffect(() => {
    if (!borderSelected) {
      return;
    }
    properties.onChange({
      color: borderColor,
      style: borderStyle,
      border: borderSelected,
    });
  }, [borderColor, borderStyle, borderSelected]);

  const onClose = properties.onClose;

  // The reason is that the border picker doesn't start with the properties of the selected area
  // biome-ignore lint/correctness/useExhaustiveDependencies: We reset the styles, every time we open (or close) the widget
  useEffect(() => {
    setBorderSelected(null);
    setBorderColor("#000000");
    setBorderStyle(BorderStyle.Thin);
  }, [properties.open]);

  const borderColorButton = useRef(null);
  const borderStyleButton = useRef(null);
  return (
    <StyledPopover
      open={properties.open}
      onClose={onClose}
      anchorEl={properties.anchorEl.current}
      anchorOrigin={
        properties.anchorOrigin || { vertical: "bottom", horizontal: "left" }
      }
      transformOrigin={
        properties.transformOrigin || { vertical: "top", horizontal: "left" }
      }
    >
      <div>
        <BorderPickerDialog>
          <Borders>
            <Line>
              <Button
                type="button"
                $pressed={borderSelected === BorderType.All}
                onClick={() => {
                  if (borderSelected === BorderType.All) {
                    setBorderSelected(null);
                  } else {
                    setBorderSelected(BorderType.All);
                  }
                }}
                disabled={false}
                title={t("toolbar.borders.all")}
              >
                <BorderAllIcon />
              </Button>
              <Button
                type="button"
                $pressed={borderSelected === BorderType.Inner}
                onClick={() => {
                  if (borderSelected === BorderType.Inner) {
                    setBorderSelected(null);
                  } else {
                    setBorderSelected(BorderType.Inner);
                  }
                }}
                disabled={false}
                title={t("toolbar.borders.inner")}
              >
                <BorderInnerIcon />
              </Button>
              <Button
                type="button"
                $pressed={borderSelected === BorderType.CenterH}
                onClick={() => {
                  if (borderSelected === BorderType.CenterH) {
                    setBorderSelected(null);
                  } else {
                    setBorderSelected(BorderType.CenterH);
                  }
                }}
                disabled={false}
                title={t("toolbar.borders.horizontal")}
              >
                <BorderCenterHIcon />
              </Button>
              <Button
                type="button"
                $pressed={borderSelected === BorderType.CenterV}
                onClick={() => {
                  if (borderSelected === BorderType.CenterV) {
                    setBorderSelected(null);
                  } else {
                    setBorderSelected(BorderType.CenterV);
                  }
                }}
                disabled={false}
                title={t("toolbar.borders.vertical")}
              >
                <BorderCenterVIcon />
              </Button>
              <Button
                type="button"
                $pressed={borderSelected === BorderType.Outer}
                onClick={() => {
                  if (borderSelected === BorderType.Outer) {
                    setBorderSelected(BorderType.None);
                  } else {
                    setBorderSelected(BorderType.Outer);
                  }
                }}
                disabled={false}
                title={t("toolbar.borders.outer")}
              >
                <BorderOuterIcon />
              </Button>
            </Line>
            <Line>
              <Button
                type="button"
                $pressed={borderSelected === BorderType.None}
                onClick={() => {
                  if (borderSelected === BorderType.None) {
                    setBorderSelected(BorderType.None);
                  } else {
                    setBorderSelected(BorderType.None);
                  }
                }}
                disabled={false}
                title={t("toolbar.borders.clear")}
              >
                <BorderNoneIcon />
              </Button>
              <Button
                type="button"
                $pressed={borderSelected === BorderType.Top}
                onClick={() => {
                  if (borderSelected === BorderType.Top) {
                    setBorderSelected(BorderType.None);
                  } else {
                    setBorderSelected(BorderType.Top);
                  }
                }}
                disabled={false}
                title={t("toolbar.borders.top")}
              >
                <BorderTopIcon />
              </Button>
              <Button
                type="button"
                $pressed={borderSelected === BorderType.Right}
                onClick={() => {
                  if (borderSelected === BorderType.Right) {
                    setBorderSelected(BorderType.None);
                  } else {
                    setBorderSelected(BorderType.Right);
                  }
                }}
                disabled={false}
                title={t("toolbar.borders.right")}
              >
                <BorderRightIcon />
              </Button>
              <Button
                type="button"
                $pressed={borderSelected === BorderType.Bottom}
                onClick={() => {
                  if (borderSelected === BorderType.Bottom) {
                    setBorderSelected(BorderType.None);
                  } else {
                    setBorderSelected(BorderType.Bottom);
                  }
                }}
                disabled={false}
                title={t("toolbar.borders.bottom")}
              >
                <BorderBottomIcon />
              </Button>
              <Button
                type="button"
                $pressed={borderSelected === BorderType.Left}
                onClick={() => {
                  if (borderSelected === BorderType.Left) {
                    setBorderSelected(BorderType.None);
                  } else {
                    setBorderSelected(BorderType.Left);
                  }
                }}
                disabled={false}
                title={t("toolbar.borders.left")}
              >
                <BorderLeftIcon />
              </Button>
            </Line>
          </Borders>
          <Divider />
          <Styles>
            <ButtonWrapper onClick={() => setColorPickerOpen(true)}>
              <Button
                type="button"
                $pressed={false}
                disabled={false}
                ref={borderColorButton}
                title={t("toolbar.borders.color")}
              >
                <PencilLine />
              </Button>
              <div style={{ flexGrow: 2 }}>Border color</div>
              <ChevronRightStyled />
            </ButtonWrapper>
            <ButtonWrapper
              onClick={() => setStylePickerOpen(true)}
              ref={borderStyleButton}
            >
              <Button
                type="button"
                $pressed={false}
                disabled={false}
                title={t("toolbar.borders.style")}
              >
                <BorderStyleIcon />
              </Button>
              <div style={{ flexGrow: 2 }}>Border style</div>
              <ChevronRightStyled />
            </ButtonWrapper>
          </Styles>
        </BorderPickerDialog>
        <ColorPicker
          color={borderColor}
          onChange={(color): void => {
            setBorderColor(color);
            setColorPickerOpen(false);
          }}
          onClose={() => {
            setColorPickerOpen(false);
          }}
          anchorEl={borderColorButton}
          open={colorPickerOpen}
        />
        <StyledPopover
          open={stylePickerOpen}
          onClose={(): void => {
            setStylePickerOpen(false);
          }}
          anchorEl={borderStyleButton.current}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: 38, horizontal: -6 }}
        >
          <BorderStyleDialog>
            <LineWrapper
              onClick={() => {
                setBorderStyle(BorderStyle.Thin);
                setStylePickerOpen(false);
              }}
              $checked={borderStyle === BorderStyle.Thin}
            >
              <BorderDescription>Thin</BorderDescription>
              <SolidLine />
            </LineWrapper>
            <LineWrapper
              onClick={() => {
                setBorderStyle(BorderStyle.Medium);
                setStylePickerOpen(false);
              }}
              $checked={borderStyle === BorderStyle.Medium}
            >
              <BorderDescription>Medium</BorderDescription>
              <MediumLine />
            </LineWrapper>
            <LineWrapper
              onClick={() => {
                setBorderStyle(BorderStyle.Thick);
                setStylePickerOpen(false);
              }}
              $checked={borderStyle === BorderStyle.Thick}
            >
              <BorderDescription>Thick</BorderDescription>
              <ThickLine />
            </LineWrapper>
          </BorderStyleDialog>
        </StyledPopover>
      </div>
    </StyledPopover>
  );
};

type LineWrapperProperties = { $checked: boolean };
const LineWrapper = styled("div")<LineWrapperProperties>`
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: ${({ $checked }): string => {
    if ($checked) {
      return "#EEEEEE;";
    }
    return "inherit;";
  }};
  &:hover {
    border: 1px solid #eeeeee;
  }
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
  border: 1px solid white;
`;

const SolidLine = styled("div")`
  width: 68px;
  border-top: 1px solid #333333;
`;
const MediumLine = styled("div")`
  width: 68px;
  border-top: 2px solid #333333;
`;
const ThickLine = styled("div")`
  width: 68px;
  border-top: 3px solid #333333;
`;

const Divider = styled("div")`
  display: inline-flex;
  heigh: 1px;
  border-bottom: 1px solid #eee;
  margin-left: 0px;
  margin-right: 0px;
`;

const Borders = styled("div")`
  display: flex;
  flex-direction: column;
  padding-bottom: 4px;
`;

const Styles = styled("div")`
  display: flex;
  flex-direction: column;
`;

const Line = styled("div")`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const ButtonWrapper = styled("div")`
  display: flex;
  flex-direction: row;
  align-items: center;
  &:hover {
    background-color: #eee;
    border-top-color: ${(): string => theme.palette.grey["400"]};
  }
  cursor: pointer;
  padding: 8px;
`;

const BorderStyleDialog = styled("div")`
  background: ${({ theme }): string => theme.palette.background.default};
  padding: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StyledPopover = styled(Popover)`
  .MuiPopover-paper {
    border-radius: 10px;
    border: 0px solid ${({ theme }): string => theme.palette.background.default};
    box-shadow: 1px 2px 8px rgba(139, 143, 173, 0.5);
  }
  .MuiPopover-padding {
    padding: 0px;
  }
  .MuiList-padding {
    padding: 0px;
  }
  font-family: ${({ theme }) => theme.typography.fontFamily};
  font-size: 12px;
`;

const BorderPickerDialog = styled("div")`
  background: ${({ theme }): string => theme.palette.background.default};
  padding: 4px;
  display: flex;
  flex-direction: column;
`;

const BorderDescription = styled("div")`
  width: 70px;
`;

type TypeButtonProperties = { $pressed: boolean; $underlinedColor?: string };
const Button = styled("button")<TypeButtonProperties>(
  ({ disabled, $pressed, $underlinedColor }) => {
    const result = {
      width: "24px",
      height: "24px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      // fontSize: "26px",
      border: "0px solid #fff",
      borderRadius: "4px",
      marginRight: "5px",
      transition: "all 0.2s",
      cursor: "pointer",
      padding: "0px",
    };
    if (disabled) {
      return {
        ...result,
        color: theme.palette.grey["600"],
        cursor: "default",
      };
    }
    return {
      ...result,
      borderTop: $underlinedColor ? "3px solid #FFF" : "none",
      borderBottom: $underlinedColor ? `3px solid ${$underlinedColor}` : "none",
      color: "#21243A",
      backgroundColor: $pressed ? theme.palette.grey["200"] : "inherit",
      "&:hover": {
        backgroundColor: "#F1F2F8",
        borderTopColor: "#F1F2F8",
      },
      svg: {
        width: "16px",
        height: "16px",
      },
    };
  },
);

const ChevronRightStyled = styled(ChevronRight)`
  width: 16px;
  height: 16px;
`;

export default BorderPicker;
