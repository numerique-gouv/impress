import { Button, Menu, MenuItem, styled } from "@mui/material";
import { ChevronDown } from "lucide-react";
import { useRef, useState } from "react";
import ColorPicker from "../colorPicker";
import { isInReferenceMode } from "../editor/util";
import type { WorkbookState } from "../workbookState";
import { SheetRenameDialog } from "./menus";

interface SheetProps {
  name: string;
  color: string;
  selected: boolean;
  onSelected: () => void;
  onColorChanged: (hex: string) => void;
  onRenamed: (name: string) => void;
  onDeleted: () => void;
  workbookState: WorkbookState;
}

function Sheet(props: SheetProps) {
  const { name, color, selected, workbookState, onSelected } = props;
  const [anchorEl, setAnchorEl] = useState<null | HTMLButtonElement>(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const colorButton = useRef(null);
  const open = Boolean(anchorEl);
  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const handleCloseRenameDialog = () => {
    setRenameDialogOpen(false);
  };
  const handleOpenRenameDialog = () => {
    setRenameDialogOpen(true);
  };
  return (
    <>
      <Wrapper
        style={{ borderBottomColor: color, fontWeight: selected ? 600 : 400 }}
        onClick={(event) => {
          onSelected();
          event.stopPropagation();
          event.preventDefault();
        }}
        onPointerDown={(event) => {
          // If it is in browse mode stop he event
          const cell = workbookState.getEditingCell();
          if (cell && isInReferenceMode(cell.text, cell.cursorStart)) {
            event.stopPropagation();
            event.preventDefault();
          }
        }}
        ref={colorButton}
      >
        <Name>{name}</Name>
        <StyledButton onClick={handleOpen}>
          <ChevronDown />
        </StyledButton>
      </Wrapper>
      <StyledMenu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: 6,
        }}
      >
        <StyledMenuItem
          onClick={() => {
            handleOpenRenameDialog();
            handleClose();
          }}
        >
          Rename
        </StyledMenuItem>
        <StyledMenuItem
          onClick={() => {
            setColorPickerOpen(true);
            handleClose();
          }}
        >
          Change Color
        </StyledMenuItem>
        <StyledMenuItem
          onClick={() => {
            props.onDeleted();
            handleClose();
          }}
        >
          {" "}
          Delete
        </StyledMenuItem>
      </StyledMenu>
      <SheetRenameDialog
        isOpen={renameDialogOpen}
        close={handleCloseRenameDialog}
        defaultName={name}
        onNameChanged={(newName) => {
          props.onRenamed(newName);
          setRenameDialogOpen(false);
        }}
      />
      <ColorPicker
        color={color}
        onChange={(color): void => {
          props.onColorChanged(color);
          setColorPickerOpen(false);
        }}
        onClose={() => {
          setColorPickerOpen(false);
        }}
        anchorEl={colorButton}
        open={colorPickerOpen}
      />
    </>
  );
}

const StyledMenu = styled(Menu)``;

const StyledMenuItem = styled(MenuItem)`
  font-size: 12px;
`;

const StyledButton = styled(Button)`
  width: 15px;
  height: 24px;
  min-width: 0px;
  padding: 0px;
  color: inherit;
  font-weight: inherit;
  svg {
    width: 15px;
    height: 15px;
  }
`;

const Wrapper = styled("div")`
  display: flex;
  margin-left: 20px;
  border-bottom: 3px solid;
  border-top: 3px solid white;
  line-height: 34px;
  align-items: center;
  cursor: pointer;
`;

const Name = styled("div")`
  font-size: 12px;
  margin-right: 5px;
  text-wrap: nowrap;
`;

export default Sheet;
