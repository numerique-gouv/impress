import styled from "@emotion/styled";
import { Menu, MenuItem, Modal } from "@mui/material";
import { FileDown, FileUp, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { UploadFileDialog } from "./UploadFileDialog";
import { getModelsMetadata, getSelectedUuid } from "./storage";

export function FileMenu(props: {
  newModel: () => void;
  setModel: (key: string) => void;
  onDownload: () => void;
  onModelUpload: (blob: ArrayBuffer, fileName: string) => Promise<void>;
  onDelete: () => void;
}) {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isImportMenuOpen, setImportMenuOpen] = useState(false);
  const anchorElement = useRef<HTMLDivElement>(null);
  const models = getModelsMetadata();
  const uuids = Object.keys(models);
  const selectedUuid = getSelectedUuid();

  const elements = [];
  for (const uuid of uuids) {
    elements.push(
      <MenuItemWrapper
        key={uuid}
        onClick={() => {
          props.setModel(uuid);
          setMenuOpen(false);
        }}
      >
        <span style={{ width: "20px" }}>
          {uuid === selectedUuid ? "•" : ""}
        </span>
        <MenuItemText
          style={{
            maxWidth: "240px",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {models[uuid]}
        </MenuItemText>
      </MenuItemWrapper>,
    );
  }

  return (
    <>
      <FileMenuWrapper
        onClick={(): void => setMenuOpen(true)}
        ref={anchorElement}
      >
        File
      </FileMenuWrapper>
      <Menu
        open={isMenuOpen}
        onClose={(): void => setMenuOpen(false)}
        anchorEl={anchorElement.current}
        // anchorOrigin={properties.anchorOrigin}
      >
        <MenuItemWrapper onClick={props.newModel}>
          <StyledPlus />
          <MenuItemText>New</MenuItemText>
        </MenuItemWrapper>
        <MenuItemWrapper
          onClick={() => {
            setImportMenuOpen(true);
            setMenuOpen(false);
          }}
        >
          <StyledFileUp />
          <MenuItemText>Import</MenuItemText>
        </MenuItemWrapper>
        <MenuItemWrapper>
          <StyledFileDown />
          <MenuItemText onClick={props.onDownload}>
            Download (.xlsx)
          </MenuItemText>
        </MenuItemWrapper>
        <MenuItemWrapper>
          <StyledTrash />
          <MenuItemText
            onClick={() => {
              props.onDelete();
              setMenuOpen(false);
            }}
          >
            Delete workbook
          </MenuItemText>
        </MenuItemWrapper>
        <MenuDivider />
        {elements}
      </Menu>
      <Modal
        open={isImportMenuOpen}
        onClose={() => {
          const root = document.getElementById("root");
          if (root) {
            root.style.filter = "";
          }
          setImportMenuOpen(false);
        }}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <>
          <UploadFileDialog
            onClose={() => {
              const root = document.getElementById("root");
              if (root) {
                root.style.filter = "";
              }
              setImportMenuOpen(false);
            }}
            onModelUpload={props.onModelUpload}
          />
        </>
      </Modal>
    </>
  );
}

const StyledPlus = styled(Plus)`
  width: 16px;
  height: 16px;
  color: #333333;
  padding-right: 10px;
`;

const StyledFileDown = styled(FileDown)`
  width: 16px;
  height: 16px;
  color: #333333;
  padding-right: 10px;
`;

const StyledFileUp = styled(FileUp)`
  width: 16px;
  height: 16px;
  color: #333333;
  padding-right: 10px;
`;

const StyledTrash = styled(Trash2)`
  width: 16px;
  height: 16px;
  color: #333333;
  padding-right: 10px;
`;

const MenuDivider = styled("div")`
  width: 80%;
  margin: auto;
  margin-top: 8px;
  margin-bottom: 8px;
  border-top: 1px solid #e0e0e0;
`;

const MenuItemText = styled("div")`
  color: #000;
  font-size: 12px;
`;

const MenuItemWrapper = styled(MenuItem)`
  display: flex;
  justify-content: flex-start;
  font-size: 14px;
  width: 100%;
`;

const FileMenuWrapper = styled("div")`
  display: flex;
  align-items: center;
  font-size: 12px;
  font-family: Inter;
  padding: 10px;
  height: 20px;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: #f2f2f2;
  }
`;
