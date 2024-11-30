import styled from "@emotion/styled";
import { type ChangeEvent, useEffect, useRef, useState } from "react";

export function WorkbookTitle(props: {
  name: string;
  onNameChange: (name: string) => void;
}) {
  const [width, setWidth] = useState(0);
  const [value, setValue] = useState(props.name);
  const mirrorDivRef = useRef<HTMLDivElement>(null);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value);
    if (mirrorDivRef.current) {
      setWidth(mirrorDivRef.current.scrollWidth);
    }
  };

  useEffect(() => {
    if (mirrorDivRef.current) {
      setWidth(mirrorDivRef.current.scrollWidth);
    }
  }, []);

  useEffect(() => {
    setValue(props.name);
  }, [props.name]);

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        textAlign: "center",
        transform: "translateX(-50%)",
        // height: "60px",
        // lineHeight: "60px",
        padding: "8px",
        fontSize: "14px",
        fontWeight: "700",
        fontFamily: "Inter",
        width,
      }}
    >
      <TitleWrapper
        value={value}
        rows={1}
        onChange={handleChange}
        onBlur={(event) => {
          props.onNameChange(event.target.value);
        }}
        style={{ width: width }}
        spellCheck="false"
      >
        {value}
      </TitleWrapper>
      <div
        ref={mirrorDivRef}
        style={{
          position: "absolute",
          top: "-9999px",
          left: "-9999px",
          whiteSpace: "pre-wrap",
          textWrap: "nowrap",
          visibility: "hidden",
          fontFamily: "inherit",
          fontSize: "inherit",
          lineHeight: "inherit",
          padding: "inherit",
          border: "inherit",
        }}
      >
        {value}
      </div>
    </div>
  );
}

const TitleWrapper = styled("textarea")`
  vertical-align: middle;
  text-align: center;
  height: 20px;
  line-height: 20px;
  border-radius: 4px;
  padding: inherit;
  overflow: hidden;
  outline: none;
  resize: none;
  text-wrap: nowrap;
  border: none;
  &:hover {
    background-color: #f2f2f2;
  }
  &:focus {
    border: 1px solid grey;
  }
  font-weight: inherit;
  font-family: inherit;
  font-size: inherit;
  max-width: 520px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;
