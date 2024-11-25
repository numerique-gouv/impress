import {
  Select,
  VariantType,
  useToastProvider,
} from '@openfun/cunningham-react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { Box, Text } from '@/components/';
import { useAuthStore, useConfig } from '@/core';

import { useChangeUserLanguage } from './api/useChangeUserLanguage';

const SelectStyled = styled(Select)<{ $isSmall?: boolean }>`
  flex-shrink: 0;
  width: auto;

  .c__select__wrapper {
    min-height: 2rem;
    height: auto;
    border-color: transparent;
    padding: 0 0.15rem 0 0.45rem;
    border-radius: 1px;

    .labelled-box .labelled-box__children {
      padding-right: 2rem;

      .c_select__render .typo-text {
        ${({ $isSmall }) => $isSmall && `display: none;`}
      }
    }

    &:hover {
      box-shadow: var(--c--theme--colors--primary-100) 0 0 0 2px !important;
    }
  }
`;

export const LanguagePicker = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToastProvider();
  const { mutateAsync: changeUserLanguage } = useChangeUserLanguage();
  const { userData } = useAuthStore();
  const { data: conf } = useConfig();

  // Early return if LANGUAGES is not available or empty
  if (!conf?.LANGUAGES || conf.LANGUAGES.length === 0) {
    return null;
  }

  // Create options for the select component
  const optionsPicker = conf.LANGUAGES.map(([locale, label]) => ({
    value: locale,
    label: label,
    render: () => (
      <Box
        className="c_select__render"
        $direction="row"
        $gap="0.7rem"
        $align="center"
      >
        <Text $isMaterialIcon $size="1rem" $theme="primary" $variation="600">
          translate
        </Text>
        <Text $theme="primary" $variation="600">
          {label}
        </Text>
      </Box>
    ),
  }));

  // Soft match locale
  const getMatchingLocale = (): string => {
    const availableLocales = conf.LANGUAGES.map(([locale]) => locale);
    return (
      availableLocales.find(
        (availableLocale) =>
          availableLocale === i18n.language ||
          availableLocale.startsWith(i18n.language.split('-')[0]),
      ) || availableLocales[0]
    );
  };

  // Switch i18n.language and user.language via API
  const switchLanguage = (targetLocale: string): void => {
    const actions: Promise<unknown>[] = [i18n.changeLanguage(targetLocale)];

    if (userData?.id) {
      actions.push(
        changeUserLanguage({
          userId: userData.id,
          language: targetLocale,
        }),
      );
    }

    void Promise.all(actions).catch((err) => {
      console.error('Error changing language', err);
      toast(t('Failed to change the language'), VariantType.ERROR, {
        duration: 3000,
      });
    });
  };

  return (
    <SelectStyled
      label={t('Language')}
      showLabelWhenSelected={false}
      clearable={false}
      hideLabel
      value={getMatchingLocale()}
      className="c_select__no_bg"
      options={optionsPicker}
      onChange={(e) => switchLanguage(e.target.value as string)}
    />
  );
};
