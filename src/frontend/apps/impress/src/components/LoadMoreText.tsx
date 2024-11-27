import { useTranslation } from 'react-i18next';

import { Box } from './Box';
import { Icon } from './Icon';
import { Text } from './Text';

export const LoadMoreText = () => {
  const { t } = useTranslation();

  return (
    <Box
      $direction="row"
      $align="center"
      $gap="0.4rem"
      $padding={{ horizontal: '2xs', vertical: 'sm' }}
    >
      <Icon
        $theme="primary"
        $variation="800"
        iconName="arrow_downward"
        $size="md"
      />
      <Text $theme="primary" $variation="800">
        {t('Load more')}
      </Text>
    </Box>
  );
};
