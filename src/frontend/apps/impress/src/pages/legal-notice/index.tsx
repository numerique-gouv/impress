import { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Text, TextStyled } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import { PageLayout } from '@/layouts';
import { NextPageWithLayout } from '@/types/next';

const Page: NextPageWithLayout = () => {
  const { t } = useTranslation();
  const { colorsTokens } = useCunninghamTheme();

  return (
    <Box>
      <Box
        as="h1"
        $background={colorsTokens()['primary-100']}
        $margin="none"
        $padding="large"
      >
        {t('Legal notice')}
      </Box>
      <Box $padding={{ horizontal: 'large', vertical: 'big' }}>
        <Text as="h2" $margin={{ bottom: 'xtiny' }}>
          {t('Éditeur')}
        </Text>
        <Text as="p">
          {t(
            'Équipe La Suite Numérique de la Direction interministérielle du numérique DINUM, 20 avenue de Ségur 75007 Paris.',
          )}
        </Text>
        <Text as="h2" $margin={{ bottom: 'xtiny' }}>
          {t('Directeur de la publication')}
        </Text>
        <Text as="p">{t('Directeur interministériel du numérique.')}</Text>
        <Text as="h2" $margin={{ bottom: 'xtiny' }}>
          {t('Copyright')}
        </Text>
        <Text as="p" $display="inline">
          {t('Illustration:')}{' '}
          <Text $weight="bold" $display="inline">
            DINUM
          </Text>
        </Text>
        <Text as="h2" $margin={{ bottom: 'xtiny' }}>
          {t("Plus d'infos ?")}
        </Text>
        <Text as="p" $display="inline">
          {t(
            "L'équipe de La Suite Numérique peut être contactée directement à",
          )}{' '}
          <TextStyled
            as="a"
            href="lasuite@modernisation.gouv.fr"
            $display="inline"
          >
            lasuite@modernisation.gouv.fr
          </TextStyled>
          .
        </Text>
      </Box>
    </Box>
  );
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <PageLayout>{page}</PageLayout>;
};

export default Page;
