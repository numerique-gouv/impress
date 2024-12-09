import { DateTime } from 'luxon';

import { Box, Icon, Text } from '@/components';
import { Doc } from '@/features/docs/doc-management';
import { SimpleDocItem } from '@/features/docs/docs-grid/components/SimpleDocItem';
import { useResponsiveStore } from '@/stores';

type DocSearchItemProps = {
  doc: Doc;
};

export const DocSearchItem = ({ doc }: DocSearchItemProps) => {
  const { isDesktop } = useResponsiveStore();
  return (
    <Box
      data-testid={`doc-search-item-${doc.id}`}
      $direction="row"
      $gap="10px"
      $justify="space-between"
      $align="center"
      $padding={{ vertical: '6px', horizontal: 'sm' }}
    >
      <Box $flex={isDesktop ? 9 : 1}>
        <SimpleDocItem doc={doc} showAccesses />
      </Box>

      {isDesktop && (
        <>
          <Box $flex={2} $justify="center" $align="center">
            <Text $variation="500" $align="right" $size="xs">
              {DateTime.fromISO(doc.updated_at).toRelative()}
            </Text>
          </Box>
          <Box className="show-right-on-focus" $flex={0.5}>
            <Icon className="show-right-on-focus" iconName="keyboard_return" />
          </Box>
        </>
      )}
    </Box>
  );
};
