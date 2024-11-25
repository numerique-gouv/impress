import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import { Doc, LinkReach } from '@/features/docs';
import PinnedDocumentIcon from '@/features/docs/doc-management/assets/pinned-document.svg';
import SimpleFileIcon from '@/features/docs/doc-management/assets/simple-document.svg';
import { useResponsiveStore } from '@/stores';

const ItemTextCss = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: initial;
  display: -webkit-box;
  line-clamp: 1;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
`;

type SimpleDocItemProps = {
  doc: Doc;
  isPinned?: boolean;
  subText?: string;
};

export const SimpleDocItem = ({
  doc,
  isPinned = false,
  subText,
}: SimpleDocItemProps) => {
  const { spacingsTokens } = useCunninghamTheme();
  const { isDesktop } = useResponsiveStore();
  const spacings = spacingsTokens();

  const isPublic = doc?.link_reach === LinkReach.PUBLIC;
  const isShared = !isPublic && doc.accesses.length > 1;
  const accessCount = doc.accesses.length - 1;
  const isSharedOrPublic = isShared || isPublic;

  return (
    <Box $direction="row" $gap={spacings.sm}>
      <Box
        $direction="row"
        $align="center"
        $css={css`
          background-color: transparent;
          filter: drop-shadow(0px 2px 2px rgba(0, 0, 0, 0.05));
        `}
      >
        {isPinned ? <PinnedDocumentIcon /> : <SimpleFileIcon />}
      </Box>
      <Box>
        <Text
          aria-describedby="doc-title"
          aria-label={doc.title}
          $size="sm"
          $variation="1000"
          $weight="500"
          $css={ItemTextCss}
        >
          {doc.title}
        </Text>
        <Box $direction="row" $align="center" $gap={spacings['3xs']}>
          {!isDesktop && (
            <>
              {isPublic && <Icon iconName="public" $size="16px" />}
              {isShared && <Icon iconName="group" $size="16px" />}
              {isSharedOrPublic && accessCount > 0 && (
                <Text $size="12px">{accessCount}</Text>
              )}
              {isSharedOrPublic && <Text $size="12px">·</Text>}
            </>
          )}

          <Text $size="xs" $variation="500" $weight="500" $css={ItemTextCss}>
            {subText ??
              'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi vel ante libero. Interdum et malesuada fames ac ante ipsum primis in faucibus. Sed imperdiet neque quam, sed euismod metus mollis ut. '}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};