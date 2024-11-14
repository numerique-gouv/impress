import { ReactNode } from 'react';
import styled, { css } from 'styled-components';

import { Box, Text } from '@/components';
import { Doc } from '@/features/docs';
import PinnedDocumentIcon from '@/features/docs/doc-management/assets/pinned-document.svg';
import SimpleFileIcon from '@/features/docs/doc-management/assets/simple-document.svg';

const ItemContainer = styled(Box)`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--c--theme--spacings--100W);
  border-radius: var(--c--theme--spacings--100V);
  padding: var(--c--theme--spacings--150V);
  cursor: pointer;
`;

const ItemTextCss = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: initial;
  display: -webkit-box;
  line-clamp: 1;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
`;

type Props = {
  doc: Doc;
  isPinned?: boolean;
  subText?: ReactNode | string;
};

export const SimpleDocItem = ({ doc, isPinned = false, subText }: Props) => {
  return (
    <ItemContainer>
      <Box
        $css={`
          background-color: transparent;
          filter: drop-shadow(0px 2px 2px rgba(0, 0, 0, 0.05));
          display: flex;
          align-items: center;
        `}
      >
        {isPinned ? <PinnedDocumentIcon /> : <SimpleFileIcon />}
      </Box>
      <div>
        <Text $weight={500} $variation="1000" $size="sm" $css={ItemTextCss}>
          {doc.title}
        </Text>

        <Text $variation="500" $size="xs" $css={ItemTextCss}>
          {subText ??
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi vel ante libero. Interdum et malesuada fames ac ante ipsum primis in faucibus. Sed imperdiet neque quam, sed euismod metus mollis ut. '}
        </Text>
      </div>
    </ItemContainer>
  );
};
