import { Button } from '@openfun/cunningham-react';
import classNames from 'classnames';
import { useRouter } from 'next/navigation';
import { PropsWithChildren, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/components/icons/Icon';
import { HorizontalSeparator } from '@/components/separator/HorizontalSeparator';
import { SeparatedSection } from '@/components/separator/SeparatedSection';
import { ButtonLogin } from '@/core';
import { useCreateDoc } from '@/features/docs';
import { LanguagePicker } from '@/features/language';
import { useResponsiveStore } from '@/stores';

import styles from './docs-layout.module.scss';

export const DocsLeftLayout = ({ children }: PropsWithChildren) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { isMobileMenuOpen, ...responsiveStore } = useResponsiveStore();

  const { mutate: createDoc } = useCreateDoc({
    onSuccess: (doc) => {
      router.push(`/docs/${doc.id}`);
      responsiveStore.toggleMobileMenu();
    },
  });

  const goToHome = () => {
    router.push('/');
    responsiveStore.toggleMobileMenu();
  };

  const createNewDoc = () => {
    createDoc({ title: t('Untitled document') });
  };

  const getContent = (): ReactNode => {
    return (
      <div>
        <SeparatedSection>
          <div className={styles.leftNavigationBarHeader}>
            <div>
              <Button
                onClick={goToHome}
                size="medium"
                color="primary-text"
                icon={<Icon icon="house" />}
              />

              <Button
                size="medium"
                color="primary-text"
                icon={<Icon icon="search" />}
              />
            </div>
            <Button onClick={createNewDoc}>{t('New document')}</Button>
          </div>
        </SeparatedSection>
        {children}
      </div>
    );
  };

  return (
    <>
      <div className={styles.leftNavigationBar}>{getContent()}</div>
      <div
        className={classNames(styles.leftNavigationBarResponsive, {
          [styles.openNavigationMenu]: isMobileMenuOpen,
        })}
      >
        {getContent()}

        <div className={styles.responsiveMenuActions}>
          <HorizontalSeparator />
          <ButtonLogin />
          <LanguagePicker />
        </div>
      </div>
    </>
  );
};
