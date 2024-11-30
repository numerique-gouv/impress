import styled from "@emotion/styled";
import { Share2 } from "lucide-react";

export function ShareButton(properties: { onClick: () => void }) {
  const { onClick } = properties;
  return (
    <Wrapper onClick={onClick} onKeyDown={() => {}}>
      <Share2 style={{ width: "16px", height: "16px", marginRight: "10px" }} />
      <span>Share</span>
    </Wrapper>
  );
}

const Wrapper = styled("div")`
  cursor: pointer;
  color: #ffffff;
  background: #f2994a;
  padding: 0px 10px;
  height: 36px;
  line-height: 36px;
  border-radius: 4px;
  margin-right: 10px;
  display: flex;
  align-items: center;
  font-family: "Inter";
  font-size: 14px;
  &:hover {
    background: #d68742;
  }
`;
