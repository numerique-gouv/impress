import styled from "@emotion/styled";
import { BookOpen, FileUp } from "lucide-react";
import { type DragEvent, useRef, useState } from "react";

export function UploadFileDialog(properties: {
  onClose: () => void;
  onModelUpload: (blob: ArrayBuffer, fileName: string) => Promise<void>;
}) {
  const [hover, setHover] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { onModelUpload } = properties;

  const handleClose = () => {
    properties.onClose();
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setHover(true);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
    setHover(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setHover(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const dt = event.dataTransfer;
    const items = dt.items;

    if (items) {
      // Use DataTransferItemList to access the file(s)
      for (let i = 0; i < items.length; i++) {
        // If dropped items aren't files, skip them
        if (items[i].kind === "file") {
          const file = items[i].getAsFile();
          if (file) {
            handleFileUpload(file);
            return;
          }
        }
      }
    } else {
      const files = dt.files;
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    }
  };

  const handleFileUpload = (file: File) => {
    setMessage(`Uploading ${file.name}...`);

    // Read the file as ArrayBuffer
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await onModelUpload(reader.result as ArrayBuffer, file.name);
        handleClose();
      } catch (e) {
        console.log("error", e);
        setMessage(`${e}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const root = document.getElementById("root");
  if (root) {
    root.style.filter = "blur(4px)";
  }
  return (
    <UploadDialog>
      <UploadTitle>
        <span style={{ flexGrow: 2, marginLeft: 12 }}>
          Import an .xlsx file
        </span>
        <Cross
          style={{ marginRight: 12 }}
          onClick={handleClose}
          onKeyDown={() => {}}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Close</title>
            <path
              d="M12 4.5L4 12.5"
              stroke="#333333"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 4.5L12 12.5"
              stroke="#333333"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Cross>
      </UploadTitle>
      {message === "" ? (
        <DropZone
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDragExit={handleDragLeave}
          onDrop={handleDrop}
        >
          {!hover ? (
            <>
              <div style={{ flexGrow: 2 }} />
              <div>
                <FileUp
                  style={{
                    width: 16,
                    color: "#EFAA6D",
                    backgroundColor: "#F2994A1A",
                    padding: "2px 4px",
                    borderRadius: 4,
                  }}
                />
              </div>
              <div style={{ fontSize: 12 }}>
                <span style={{ color: "#333333" }}>
                  Drag and drop a file here or{" "}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="*"
                  style={{ display: "none" }}
                  onChange={(event) => {
                    const files = event.target.files;
                    if (files) {
                      for (const file of files) {
                        handleFileUpload(file);
                      }
                    }
                  }}
                />
                <DocLink
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                  }}
                >
                  click to browse
                </DocLink>
              </div>
              <div style={{ flexGrow: 2 }} />
            </>
          ) : (
            <>
              <div style={{ flexGrow: 2 }} />
              <div>Drop file here</div>
              <div style={{ flexGrow: 2 }} />
            </>
          )}
        </DropZone>
      ) : (
        <DropZone>
          <>
            <div style={{ flexGrow: 2 }} />
            <div>{message}</div>
            <div style={{ flexGrow: 2 }} />
          </>
        </DropZone>
      )}

      <UploadFooter>
        <BookOpen
          style={{ width: 16, height: 16, marginLeft: 12, marginRight: 8 }}
        />
        <span>Learn more about importing files into IronCalc</span>
      </UploadFooter>
    </UploadDialog>
  );
}

const Cross = styled("div")`
  &:hover {
    background-color: #f5f5f5;
  }
  border-radius: 4px;
  height: 16px;
  width: 16px;
`;

const DocLink = styled("span")`
  color: #f2994a;
  text-decoration: underline;
  &:hover {
    font-weight: bold;
  }
`;

const UploadFooter = styled("div")`
  height: 40px;
  border-top: 1px solid #e0e0e0;
  font-size: 12px;
  font-weight: 400;
  color: #757575;
  display: flex;
  align-items: center;
`;

const UploadTitle = styled("div")`
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
  height: 40px;
  font-size: 14px;
  font-weight: 500;
`;

const UploadDialog = styled("div")`
  display: flex;
  flex-direction: column;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 455px;
  height: 285px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0px 1px 3px 0px #0000001a;
  font-family: Inter;
`;

const DropZone = styled("div")`
  flex-grow: 2;
  border-radius: 10px;
  text-align: center;
  margin: 12px;
  color: #aaa;
  font-family: Arial, sans-serif;
  cursor: pointer;
  background-color: #faebd7;
  border: 1px dashed #f2994a;
  background: linear-gradient(
    180deg,
    rgba(242, 153, 74, 0.08) 0%,
    rgba(242, 153, 74, 0) 100%
  );
  display: flex;
  flex-direction: column;
  vertical-align: center;
`;
