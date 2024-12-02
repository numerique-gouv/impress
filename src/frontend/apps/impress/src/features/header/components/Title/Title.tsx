import { useTranslation } from 'react-i18next';

import { Text } from '@/components/';

const Title = () => {
  const { t } = useTranslation();

  return (
    <>
      <Text
        $padding="2px 3px"
        $size="8px"
        $background="#368bd6"
        $color="white"
        $position="absolute"
        $radius="5px"
        $css={`
          bottom: 13px;
          right: -17px;
        `}
      >
        BETA
      </Text>
      <Text $margin="none" as="h2" $color="#000091" $zIndex={1} $size="1.30rem">
        {t('Docs')}
      </Text>
    </>
  );
};

export default Title;
