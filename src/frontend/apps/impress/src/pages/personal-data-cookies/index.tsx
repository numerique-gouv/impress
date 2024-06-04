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
        {t('Personal data and cookies')}
      </Box>
      <Box $padding={{ horizontal: 'large', vertical: 'big' }}>
        <Text as="h2" $margin={{ bottom: 'xtiny' }}>
          {t('Cookies déposés')}
        </Text>
        <Text as="p">
          {t(
            'Ce site dépose un petit fichier texte (un « cookie ») sur votre ordinateur lorsque vous le consultez.',
          )}
          {t(
            'Cela nous permet de mesurer le nombre de visites et de comprendre quelles sont les pages les plus consultées.',
          )}
        </Text>
        <Text as="p">
          {t(
            'Vous pouvez vous opposer au suivi de votre navigation sur ce site web.',
          )}
          {t(
            "Cela protégera votre vie privée, mais empêchera également le propriétaire d'apprendre de vos actions et de créer une meilleure expérience pour vous et les autres utilisateurs.",
          )}
        </Text>
        <Text as="h2" $margin={{ bottom: 'xtiny' }}>
          {t(
            "Ce site n'affiche pas de bannière de consentement aux cookies, pourquoi ?",
          )}
        </Text>
        <Text as="p">
          {t(
            "C'est vrai, vous n'avez pas eu à cliquer sur un bloc qui recouvre la moitié de la page pour dire que vous êtes d'accord avec le dépôt de cookies — même si vous ne savez pas ce que ça veut dire !",
          )}
        </Text>
        <Text as="p">
          {t("Rien d'exceptionnel, pas de passe-droit lié à un .gouv.fr .")}
          {t(
            "Nous respectons simplement la loi, qui dit que certains outils de suivi d'audience, correctement configurés pour respecter la vie privée, sont exemptés d'autorisation préalable.",
          )}
        </Text>
        <Text as="h2" $margin={{ bottom: 'xtiny' }}>
          {t('Je contribue à enrichir vos données, puis-je y accéder ?')}
        </Text>
        <p>
          {t(
            "Bien sûr ! Les statistiques d'usage de la majorité de nos produits, dont docs.numerique.gouv.fr, sont disponibles en accès libre sur",
          )}{' '}
          <TextStyled as="a" href="stats.data.gouv.fr" $display="inline">
            stats.data.gouv.fr
          </TextStyled>
          .
        </p>
      </Box>
    </Box>
  );
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <PageLayout>{page}</PageLayout>;
};

export default Page;
