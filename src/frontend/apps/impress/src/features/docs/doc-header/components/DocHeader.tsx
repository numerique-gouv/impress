import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';
import { HorizontalSeparator } from '@/components/separators/HorizontalSeparator';
import { useCunninghamTheme } from '@/cunningham';
import {
  Doc,
  LinkReach,
  currentDocRole,
  useTrans,
} from '@/features/docs/doc-management';
import { Versions } from '@/features/docs/doc-versioning';

import { DocTitle } from './DocTitle';
import { DocToolBox } from './DocToolBox';

interface DocHeaderProps {
  doc: Doc;
  versionId?: Versions['version_id'];
}

export const DocHeader = ({ doc, versionId }: DocHeaderProps) => {
  const { colorsTokens, spacingsTokens } = useCunninghamTheme();
  const spacings = spacingsTokens();
  const colors = colorsTokens();

  const { t } = useTranslation();
  const docIsPublic = doc.link_reach === LinkReach.PUBLIC;

  const { transRole } = useTrans();

  return (
    <>
      <Box
        $width="100%"
        $padding={{ vertical: 'base' }}
        $gap={spacings['base']}
        aria-label={t('It is the card information about the document.')}
      >
        {docIsPublic && (
          <Box
            aria-label={t('Public document')}
            $color={colors['primary-600']}
            $background={colors['primary-100']}
            $radius={spacings['3xs']}
            $direction="row"
            $padding="xs"
            $flex={1}
            $align="center"
            $gap={spacings['3xs']}
            $css={css`
              border: 1px solid var(--c--theme--colors--primary-300, #e3e3fd);
            `}
          >
            <Icon data-testid="public-icon" iconName="public" />
            <Text>{t('Public document')}</Text>
          </Box>
        )}
        <Box $direction="row" $align="center" $width="100%">
          <Box
            $direction="row"
            $justify="space-between"
            $css="flex:1;"
            $gap="0.5rem 1rem"
            $wrap="wrap"
            $align="center"
          >
            <Box $flex={1} $width="100%" $gap={spacings['3xs']}>
              <DocTitle doc={doc} />
              <Box $direction="row">
                <Text $variation="400" $size="s" $weight="bold">
                  {transRole(currentDocRole(doc.abilities))}&nbsp;·&nbsp;
                </Text>
                <Text $variation="400" $size="s">
                  {t('Last update: {{update}}', {
                    update: DateTime.fromISO(doc.updated_at).toRelative(),
                  })}
                </Text>
              </Box>
            </Box>
            <DocToolBox doc={doc} versionId={versionId} />
          </Box>
        </Box>
        <HorizontalSeparator />
      </Box>
    </>
  );
};
