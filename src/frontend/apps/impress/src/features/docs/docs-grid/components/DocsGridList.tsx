import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Card, Text } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import { useInfiniteDocs } from '@/features/docs/doc-management/api/useDocs';
import { LEFT_PANEL_WIDTH } from '@/features/left-pannel/conf';
import { useResponsiveStore } from '@/stores';

import { DocGridListItem } from './DocGridListItem';

export const DocsGridList = () => {
  const { themeTokens, spacingsTokens, colorsTokens } = useCunninghamTheme();
  const spacings = spacingsTokens();
  const colors = colorsTokens();

  const { t } = useTranslation();
  const { isResponsive } = useResponsiveStore();

  const { data, isFetching, isLoading, fetchNextPage, hasNextPage } =
    useInfiniteDocs({
      page: 1,
    });
  const loading = isFetching || isLoading;

  const loadMore = (inView: boolean) => {
    if (!inView) {
      return;
    }
    void fetchNextPage();
  };

  return (
    <Card
      $css={`
        width: 960px;
        max-width: calc(100dvw - ${isResponsive ? 34 : LEFT_PANEL_WIDTH}px);
        padding: ${spacings['300W']};
      `}
    >
      <Text
        $margin={{ bottom: `${spacings['100W']}` }}
        $css="margin-block: 0"
        as="h4"
      >
        {t('All docs')}
      </Text>
      <section>
        <Box
          as="header"
          $css={css`
            display: flex;
            flex-direction: row;
            margin-bottom: ${spacings['100W']};
            font-size: ${themeTokens().font?.sizes.xs};
            color: ${colors['greyscale-500']};
            padding-bottom: ${spacings['150V']} ${spacings['100W']};
          `}
        >
          <Box $flex={7}>{t('Name')}</Box>

          {!isResponsive && <Box $flex={1}>{t('Update at')}</Box>}
          <Box $flex={1} />
        </Box>
      </section>
      <Box $gap={`${spacings['150V']}`}>
        {data?.pages.map((currentPage) => {
          return currentPage.results.map((doc) => (
            <DocGridListItem doc={doc} key={doc.id} />
          ));
        })}
      </Box>
    </Card>
  );
};
