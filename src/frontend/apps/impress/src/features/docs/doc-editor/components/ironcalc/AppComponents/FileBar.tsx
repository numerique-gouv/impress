import styled from "@emotion/styled";
import type { Model } from "@ironcalc/wasm";
import { CircleCheck } from "lucide-react";
import { useRef, useState } from "react";
import { IronCalcIcon, IronCalcLogo } from "./../icons";
import { FileMenu } from "./FileMenu";
import { ShareButton } from "./ShareButton";
import { WorkbookTitle } from "./WorkbookTitle";
import { downloadModel, shareModel } from "./rpc";
import { updateNameSelectedWorkbook } from "./storage";

export function FileBar(properties: {
  model: Model;
  newModel: () => void;
  setModel: (key: string) => void;
  onModelUpload: (blob: ArrayBuffer, fileName: string) => Promise<void>;
  onDelete: () => void;
}) {
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState(false);
  return (
    <FileBarWrapper>
      <StyledDesktopLogo />
      <StyledIronCalcIcon />
      <Divider />
      <FileMenu
        newModel={properties.newModel}
        setModel={properties.setModel}
        onModelUpload={properties.onModelUpload}
        onDownload={async () => {
          const model = properties.model;
          const bytes = model.toBytes();
          const fileName = model.getName();
          await downloadModel(bytes, fileName);
        }}
        onDelete={properties.onDelete}
      />
      <WorkbookTitle
        name={properties.model.getName()}
        onNameChange={(name) => {
          properties.model.setName(name);
          updateNameSelectedWorkbook(properties.model, name);
        }}
      />
      <input
        ref={hiddenInputRef}
        type="text"
        style={{ position: "absolute", left: -9999, top: -9999 }}
      />
      <div style={{ marginLeft: "auto" }}>
        {toast ? (
          <Toast>
            <CircleCheck style={{ width: 12 }} />
            <span
              style={{ marginLeft: 8, marginRight: 12, fontFamily: "Inter" }}
            >
              URL copied to clipboard
            </span>
          </Toast>
        ) : (
          ""
        )}
      </div>
      <ShareButton
        onClick={async () => {
          const model = properties.model;
          const bytes = model.toBytes();
          const fileName = model.getName();
          const hash = await shareModel(bytes, fileName);
          const value = `${location.origin}/?model=${hash}`;
          if (hiddenInputRef.current) {
            hiddenInputRef.current.value = value;
            hiddenInputRef.current.select();
            document.execCommand("copy");
            setToast(true);
            setTimeout(() => setToast(false), 5000);
          }
          console.log(value);
        }}
      />
    </FileBarWrapper>
  );
}

const StyledDesktopLogo = styled(IronCalcLogo)`
  width: 120px;
  margin-left: 10px;
  @media (max-width: 769px) {
    display: none;
  }
`;

const StyledIronCalcIcon = styled(IronCalcIcon)`
  width: 36px;
  margin-left: 10px;
  @media (min-width: 769px) {
    display: none;
  }
`;

const Toast = styled("div")`
  font-weight: 400;
  font-size: 12px;
  color: #9e9e9e;
  display: flex;
  align-items: center;
`;

const Divider = styled("div")`
  margin: 10px;
  height: 12px;
  border-left: 1px solid #e0e0e0;
`;

const FileBarWrapper = styled("div")`
  height: 60px;
  width: 100%;
  background: #fff;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
  position: relative;
  justify-content: space-between;
`;
