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
          Cookies déposés
        </Text>
        <Text as="p">
          Ce site dépose un petit fichier texte (un « cookie ») sur votre
          ordinateur lorsque vous le consultez. Cela nous permet de mesurer le
          nombre de visites et de comprendre quelles sont les pages les plus
          consultées.
        </Text>
        <Text as="p">
          Vous pouvez vous opposer au suivi de votre navigation sur ce site web.
          Cela protégera votre vie privée, mais empêchera également le
          propriétaire d&apos;apprendre de vos actions et de créer une meilleure
          expérience pour vous et les autres utilisateurs.
        </Text>
        <Text as="h2" $margin={{ bottom: 'xtiny' }}>
          Ce site n&apos;affiche pas de bannière de consentement aux cookies,
          pourquoi ?
        </Text>
        <Text as="p">
          C&apos;est vrai, vous n&apos;avez pas eu à cliquer sur un bloc qui
          recouvre la moitié de la page pour dire que vous êtes d&apos;accord
          avec le dépôt de cookies — même si vous ne savez pas ce que ça veut
          dire !
        </Text>
        <Text as="p">
          Rien d&apos;exceptionnel, pas de passe-droit lié à un .gouv.fr . Nous
          respectons simplement la loi, qui dit que certains outils de suivi
          d&apos;audience, correctement configurés pour respecter la vie privée,
          sont exemptés d&apos;autorisation préalable.
        </Text>
        <Text as="p" $display="inline">
          Nous utilisons pour cela{' '}
          <TextStyled as="a" href="https://matomo.org/" $display="inline">
            Matomo
          </TextStyled>
          , un outil{' '}
          <TextStyled
            as="a"
            href="https://matomo.org/free-software/"
            $display="inline"
          >
            libre
          </TextStyled>
          , paramétré pour être en conformité avec la{' '}
          <TextStyled
            as="a"
            href="https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies-solutions-pour-les-outils-de-mesure-daudience"
            $display="inline"
          >
            recommandation « Cookies »
          </TextStyled>{' '}
          de la{' '}
          <span
            style={{
              textDecorationStyle: 'dotted',
              textDecorationLine: 'underline',
            }}
          >
            CNIL
          </span>
          . Cela signifie que votre adresse IP, par exemple, est anonymisée
          avant d&apos;être enregistrée. Il est donc impossible d&apos;associer
          vos visites sur ce site à votre personne.
        </Text>
        <Text as="h2" $margin={{ bottom: 'xtiny' }}>
          Je contribue à enrichir vos données, puis-je y accéder ?
        </Text>
        <p>
          Bien sûr ! Les statistiques d&apos;usage de la majorité de nos
          produits, dont lasuite.numerique.gouv.fr, sont disponibles en accès
          libre sur{' '}
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
