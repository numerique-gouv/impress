import { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';

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
          <Trans t={t} i18nKey="accessibility-dinum-services">
            <strong>La DINUM</strong> s&apos;engage à rendre ses services
            numériques accessibles, conformément à l&apos;article 47 de la loi
            n° 2005-102 du 11 février 2005.
          </Trans>
        </Text>
        <Text as="h2" $margin={{ bottom: 'xtiny' }}>
          {t("Déclaration d'accessibilité")}
        </Text>
        <Text as="p">{t('Établie le 20 décembre 2023.')}</Text>
        <Text as="p" $display="inline">
          {t("Cette déclaration d'accessibilité s'applique au site")}{' '}
          <strong>docs.numerique.gouv.fr</strong>.
        </Text>
        <Text as="h2" $margin={{ bottom: 'xtiny' }}>
          {t('État de conformité')}
        </Text>
        <Text as="p" $display="inline">
          <Trans t={t} i18nKey="accessibility-not-audit">
            <strong>docs.numerique.gouv.fr</strong> est non conforme avec le
            RGAA 4.1. Le site n&apos;a <strong>pas encore été audité.</strong>
          </Trans>
        </Text>
        <Text as="h2" $margin={{ bottom: 'xtiny' }}>
          {t('Amélioration et contact')}
        </Text>
        <Text as="p" $display="inline">
          {t(
            `Si vous n'arrivez pas à accéder à un contenu ou à un service, vous pouvez contacter le responsable de lasuite.numerique.gouv.fr pour être orienté vers une alternative accessible ou obtenir le contenu sous une autre forme.`,
          )}
        </Text>
        <Text as="p" $display="inline">
          <li>
            {t('E-mail:')}{' '}
            <TextStyled
              as="a"
              href="mailto:lasuite@modernisation.gouv.fr"
              $display="inline"
            >
              lasuite@modernisation.gouv.fr
            </TextStyled>
          </li>
          <li>
            {t('Adresse:')} <strong>DINUM</strong>, 20 avenue de Ségur 75007
            Paris
          </li>
        </Text>
        <Text as="p" $display="inline">
          {t('Nous essayons de répondre dans les 2 jours ouvrés.')}
        </Text>

        <Text as="h2" $margin={{ bottom: 'xtiny' }}>
          {t('Voie de recours')}
        </Text>
        <Text as="p" $display="inline">
          {t(`Cette procédure est à utiliser dans le cas suivant:`)}{' '}
          {t(
            `vous avez signalé au responsable du site internet un défaut d'accessibilité qui vous empêche d'accéder à un contenu ou à un des services du portail et vous n'avez pas obtenu de réponse satisfaisante.`,
          )}
        </Text>
        <Text as="p" $display="inline" $margin={{ bottom: 'tiny' }}>
          {t('Vous pouvez:')}
        </Text>
        <Text as="p" $display="inline" $margin={{ top: 'tiny' }}>
          <li>
            <Trans t={t} i18nKey="accessibility-form-defenseurdesdroits">
              Écrire un message au{' '}
              <TextStyled
                as="a"
                href="https://formulaire.defenseurdesdroits.fr/formulaire_saisine/"
                $display="inline"
              >
                Défenseur des droits
              </TextStyled>
            </Trans>
          </li>
          <li>
            <Trans t={t} i18nKey="accessibility-contact-defenseurdesdroits">
              Contacter le délégué du
              <TextStyled
                as="a"
                href="https://www.defenseurdesdroits.fr/carte-des-delegues"
                $display="inline"
              >
                {t('Défenseur des droits dans votre région')}
              </TextStyled>
            </Trans>
          </li>
          <li>
            {t(
              `Envoyer un courrier par la poste (gratuit, ne pas mettre de timbre):`,
            )}{' '}
            <strong>
              Défenseur des droits Libre réponse 71120 75342 Paris CEDEX 07
            </strong>
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
