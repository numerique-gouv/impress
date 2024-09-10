import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import { KEY_DOC_VISIBILITY, useDoc } from '@/features/docs/doc-management';

export const DocTagPublic = () => {
  const { colorsTokens } = useCunninghamTheme();
  const { t } = useTranslation();
  const {
    query: { id },
  } = useRouter();

  const { data: doc } = useDoc(
    { id: id as string },
    {
      enabled: !!id,
      queryKey: [KEY_DOC_VISIBILITY, { id }],
    },
  );

  if (!doc?.is_public) {
    return null;
  }

  return (
    <Text
      $weight="bold"
      $background={colorsTokens()['primary-600']}
      $color="white"
      $padding="xtiny"
      $radius="3px"
      $size="s"
    >
      {t('Public')}
    </Text>
  );
};
