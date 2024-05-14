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
        {t('Accessibility')}
      </Box>
      <Box $padding={{ horizontal: 'large', vertical: 'big' }}>
        <Text as="p" $display="inline">
          <Text $weight="bold" $display="inline">
            La Suite numérique
          </Text>{' '}
          s&apos;engage à rendre ses services numériques accessibles,
          conformément à l&apos;article 47 de la loi n° 2005-102 du 11 février
          2005.
        </Text>
        <Text as="h2" $margin={{ bottom: 'xtiny' }}>
          Déclaration d&apos;accessibilité
        </Text>
        <Text as="p">Établie le 20 décembre 2023.</Text>
        <Text as="p" $display="inline">
          Cette déclaration d&apos;accessibilité s&apos;applique au site{' '}
          <Text $weight="bold" $display="inline">
            lasuite.numerique.gouv.fr
          </Text>
          .
        </Text>
        <Text as="h2" $margin={{ bottom: 'xtiny' }}>
          État de conformité
        </Text>
        <Text as="p" $display="inline">
          <Text $weight="bold" $display="inline">
            lasuite.numerique.gouv.fr
          </Text>{' '}
          est non conforme avec le RGAA 4.1. Le site n&apos;a{' '}
          <Text $weight="bold" $display="inline">
            pas encore été audité.
          </Text>
        </Text>
        <Text as="h2" $margin={{ bottom: 'xtiny' }}>
          Amélioration et contact
        </Text>
        <Text as="p" $display="inline">
          Si vous n&apos;arrivez pas à accéder à un contenu ou à un service,
          vous pouvez contacter le responsable de lasuite.numerique.gouv.fr pour
          être orienté vers une alternative accessible ou obtenir le contenu
          sous une autre forme.
        </Text>
        <Text as="p" $display="inline">
          <li>
            E-mail :{' '}
            <TextStyled
              as="a"
              href="mailto:lasuite@modernisation.gouv.fr"
              $display="inline"
            >
              lasuite@modernisation.gouv.fr
            </TextStyled>
          </li>
          <li>
            Adresse :{' '}
            <Text $weight="bold" $display="inline">
              DINUM
            </Text>
            , 20 avenue de Ségur 75007 Paris
          </li>
        </Text>
        <Text as="p" $display="inline">
          Nous essayons de répondre dans les 2 jours ouvrés.
        </Text>

        <Text as="h2" $margin={{ bottom: 'xtiny' }}>
          Voie de recours
        </Text>
        <Text as="p" $display="inline">
          Cette procédure est à utiliser dans le cas suivant : vous avez signalé
          au responsable du site internet un défaut d&apos;accessibilité qui
          vous empêche d&apos;accéder à un contenu ou à un des services du
          portail et vous n&apos;avez pas obtenu de réponse satisfaisante.
        </Text>
        <Text as="p" $display="inline" $margin={{ bottom: 'tiny' }}>
          Vous pouvez :
        </Text>
        <Text as="p" $display="inline" $margin={{ top: 'tiny' }}>
          <li>
            Écrire un message au{' '}
            <TextStyled
              as="a"
              href="https://formulaire.defenseurdesdroits.fr/formulaire_saisine/"
              $display="inline"
            >
              Défenseur des droits
            </TextStyled>
          </li>
          <li>
            Contacter le délégué du{' '}
            <TextStyled
              as="a"
              href="https://www.defenseurdesdroits.fr/carte-des-delegues"
              $display="inline"
            >
              Défenseur des droits dans votre région
            </TextStyled>
          </li>
          <li>
            Envoyer un courrier par la poste (gratuit, ne pas mettre de timbre)
            :{' '}
            <Text $weight="bold" $display="inline">
              Défenseur des droits Libre réponse 71120 75342 Paris CEDEX 07
            </Text>
          </li>
        </Text>
      </Box>
    </Box>
  );
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <PageLayout>{page}</PageLayout>;
};

export default Page;
