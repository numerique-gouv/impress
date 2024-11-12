import { Button } from '@openfun/cunningham-react';

import { StyledLink } from '@/components';
import { Icon } from '@/components/icons/Icon';
import { ButtonLogin } from '@/core';
import { LaGaufre } from '@/features/header/components/LaGaufre';
import { LanguagePicker } from '@/features/language';
import { useResponsiveStore } from '@/stores';

import { default as IconDocs } from './assets/logo-docs.svg';
import styles from './docs-layout.module.scss';

export const DocsHeaderLayout = () => {
  const { isResponsive, toggleMobileMenu } = useResponsiveStore();

  return (
    <div className={styles.header}>
      {isResponsive && (
        <Button
          size="medium"
          onClick={toggleMobileMenu}
          aria-label="Button with only an icon"
          color="primary-text"
          icon={<Icon icon="menu" />}
        />
      )}
      <StyledLink href="/">
        <div className={styles.iconContainer}>
          <IconDocs />
          <div>Docs</div>
        </div>
      </StyledLink>
      <div className={styles.rightContainer}>
        {!isResponsive && (
          <>
            <ButtonLogin />
            <LanguagePicker />
            <LaGaufre />
          </>
        )}
      </div>
    </div>
  );
};
