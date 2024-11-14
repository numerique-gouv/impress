import { Button } from '@openfun/cunningham-react';
import { useRouter } from 'next/navigation';
import { PropsWithChildren, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Icon } from '@/components';
import { HorizontalSeparator } from '@/components/separators/HorizontalSeparator';
import { SeparatedSection } from '@/components/separators/SeparatedSection';
import { ButtonLogin } from '@/core';
import { useCunninghamTheme } from '@/cunningham';
import { useCreateDoc } from '@/features/docs';
import { HEADER_HEIGHT } from '@/features/header/conf';
import { LanguagePicker } from '@/features/language';
import { useResponsiveStore } from '@/stores';

export const LeftPanel = ({ children }: PropsWithChildren) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { isResponsive, isMobileMenuOpen, toggleMobileMenu } =
    useResponsiveStore();
  const theme = useCunninghamTheme();
  const colors = theme.colorsTokens();

  const { mutate: createDoc } = useCreateDoc({
    onSuccess: (doc) => {
      router.push(`/docs/${doc.id}`);
      toggleMobileMenu();
    },
  });

  const goToHome = () => {
    router.push('/');
    toggleMobileMenu();
  };

  const createNewDoc = () => {
    createDoc({ title: t('Untitled document') });
  };

  const getContent = (): ReactNode => {
    return (
      <div>
        <SeparatedSection>
          <Box
            $padding={{ horizontal: '300V' }}
            $direction="row"
            $justify="space-between"
            $align="center"
          >
            <Box $direction="row" $gap="2px">
              <Button
                onClick={goToHome}
                size="medium"
                color="primary-text"
                icon={<Icon iconName="house" />}
              />
            </Box>
            <Button onClick={createNewDoc}>{t('New doc')}</Button>
          </Box>
        </SeparatedSection>
        {children}
      </div>
    );
  };

  return (
    <>
      {!isResponsive && (
        <Box
          data-testid="left-panel-desktop"
          $css={`
            height: calc(100vh - ${HEADER_HEIGHT}px);
            width: 300px;
            min-width: 300px;
            border-right: 1px solid ${(colors?.['greyscale-200'] as string) ?? '#E5E5E5'};
        `}
        >
          {getContent()}
        </Box>
      )}
      {isResponsive && (
        <Box
          data-testid="left-panel-mobile"
          $css={`
            z-index: 1000;
            width: 100dvw;
            height: calc(100dvh - ${HEADER_HEIGHT}px);
            position: fixed;
            transition: 0.15s;
            background-color: ${(colors?.['greyscale-000'] as string) ?? '#fff'};
            left: ${isMobileMenuOpen ? '0' : '-100dvw'};
          `}
        >
          {getContent()}

          <Box
            $css={`
                width: 100%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                gap: var(--c--theme--spacings--200W);
            `}
          >
            {children && <HorizontalSeparator />}
            <ButtonLogin />
            <LanguagePicker />
          </Box>
        </Box>
      )}
    </>
  );
};
