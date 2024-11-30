import styled from "@emotion/styled";
import Popover, { type PopoverOrigin } from "@mui/material/Popover";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { theme } from "../theme";

type ColorPickerProps = {
  className?: string;
  color: string;
  onChange: (color: string) => void;
  onClose: () => void;
  anchorEl: React.RefObject<HTMLElement>;
  anchorOrigin?: PopoverOrigin;
  transformOrigin?: PopoverOrigin;
  open: boolean;
};

const colorPickerWidth = 240;
const colorfulHeight = 185; // 150 + 15 + 20

const ColorPicker = (properties: ColorPickerProps) => {
  const [color, setColor] = useState<string>(properties.color);
  const recentColors = useRef<string[]>([]);

  const closePicker = (newColor: string): void => {
    const maxRecentColors = 14;
    properties.onChange(newColor);
    const colors = recentColors.current.filter((c) => c !== newColor);
    recentColors.current = [newColor, ...colors].slice(0, maxRecentColors);
  };

  const handleClose = (): void => {
    properties.onClose();
  };

  useEffect(() => {
    setColor(properties.color);
  }, [properties.color]);

  const presetColors = [
    "#FFFFFF",
    "#1B717E",
    "#59B9BC",
    "#3BB68A",
    "#8CB354",
    "#F8CD3C",
    "#EC5753",
    "#A23C52",
    "#D03627",
    "#523E93",
    "#3358B7",
  ];

  return (
    <Popover
      open={properties.open}
      onClose={handleClose}
      anchorEl={properties.anchorEl.current}
      anchorOrigin={
        properties.anchorOrigin || { vertical: "bottom", horizontal: "left" }
      }
      transformOrigin={
        properties.transformOrigin || { vertical: "top", horizontal: "left" }
      }
    >
      <ColorPickerDialog>
        <HexColorPicker
          color={color}
          onChange={(newColor): void => {
            setColor(newColor);
          }}
        />
        <ColorPickerInput>
          <HexWrapper>
            <HexLabel>{"Hex"}</HexLabel>
            <HexColorInputBox>
              <HashLabel>{"#"}</HashLabel>
              <HexColorInput
                color={color}
                onChange={(newColor): void => {
                  setColor(newColor);
                }}
              />
            </HexColorInputBox>
          </HexWrapper>
          <Swatch
            $color={color}
            onClick={(): void => {
              closePicker(color);
            }}
          />
        </ColorPickerInput>
        <HorizontalDivider />
        <ColorList>
          {presetColors.map((presetColor) => (
            <Button
              key={presetColor}
              $color={presetColor}
              onClick={(): void => {
                closePicker(presetColor);
              }}
            />
          ))}
        </ColorList>

        {recentColors.current.length > 0 ? (
          <>
            <HorizontalDivider />
            <RecentLabel>{"Recent"}</RecentLabel>
            <ColorList>
              {recentColors.current.map((recentColor) => (
                <Button
                  key={recentColor}
                  $color={recentColor}
                  onClick={(): void => {
                    closePicker(recentColor);
                  }}
                />
              ))}
            </ColorList>
          </>
        ) : (
          <div />
        )}
      </ColorPickerDialog>
    </Popover>
  );
};

const RecentLabel = styled.div`
  font-family: "Inter";
  font-size: 12px;
  color: ${theme.palette.text.secondary};
`;

const ColorList = styled.div`
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
`;

const Button = styled.button<{ $color: string }>`
  width: 20px;
  height: 20px;
  ${({ $color }): string => {
    if ($color.toUpperCase() === "#FFFFFF") {
      return `border: 1px solid ${theme.palette.grey["600"]};`;
    }
    return `border: 1px solid ${$color};`;
  }}
  background-color: ${({ $color }): string => {
    return $color;
  }};
  box-sizing: border-box;
  margin-top: 10px;
  margin-right: 10px;
  border-radius: 2px;
`;

const HorizontalDivider = styled.div`
  height: 0px;
  width: 100%;
  border-top: 1px solid ${theme.palette.grey["400"]};
  margin-top: 15px;
  margin-bottom: 5px;
`;

// const StyledPopover = styled(Popover)`
//   .MuiPopover-paper {
//     border-radius: 10px;
//     border: 0px solid ${theme.palette.background.default};
//     box-shadow: 1px 2px 8px rgba(139, 143, 173, 0.5);
//   }
//   .MuiPopover-padding {
//     padding: 0px;
//   }
//   .MuiList-padding {
//     padding: 0px;
//   }
// `;

const ColorPickerDialog = styled.div`
  background: ${theme.palette.background.default};
  width: ${colorPickerWidth}px;
  padding: 15px;
  display: flex;
  flex-direction: column;

  & .react-colorful {
    height: ${colorfulHeight}px;
    width: ${colorPickerWidth}px;
  }
  & .react-colorful__saturation {
    border-bottom: none;
    border-radius: 5px;
  }
  & .react-colorful__hue {
    height: 20px;
    margin-top: 15px;
    border-radius: 5px;
  }
  & .react-colorful__saturation-pointer {
    width: 14px;
    height: 14px;
  }
  & .react-colorful__hue-pointer {
    width: 7px;
    border-radius: 3px;
  }
`;

const HashLabel = styled.div`
  margin: auto 0px auto 10px;
  font-size: 13px;
  color: #7d8ec2;
  font-family: ${theme.typography.button.fontFamily};
`;

const HexLabel = styled.div`
  margin: auto 10px auto 0px;
  font-size: 12px;
  display: inline-flex;
  font-family: ${theme.typography.button.fontFamily};
`;

const HexColorInputBox = styled.div`
  display: inline-flex;
  flex-grow: 1;
  margin-right: 10px;
  width: 140px;
  height: 28px;
  border: 1px solid ${theme.palette.grey["600"]};
  border-radius: 5px;
`;

const HexWrapper = styled.div`
  display: flex;
  flex-grow: 1;
  & input {
    min-width: 0px;
    border: 0px;
    background: ${theme.palette.background.default};
    outline: none;
    font-family: ${theme.typography.button.fontFamily};
    font-size: 12px;
    text-transform: uppercase;
    text-align: right;
    padding-right: 10px;
    border-radius: 5px;
  }

  & input:focus {
    border-color: #4298ef;
  }
`;

const Swatch = styled.div<{ $color: string }>`
  display: inline-flex;
  ${({ $color }): string => {
    if ($color.toUpperCase() === "#FFFFFF") {
      return `border: 1px solid ${theme.palette.grey["600"]};`;
    }
    return `border: 1px solid ${$color};`;
  }}
  background-color: ${({ $color }): string => $color};
  width: 28px;
  height: 28px;
  border-radius: 5px;
`;

const ColorPickerInput = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 15px;
`;

export default ColorPicker;
