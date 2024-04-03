import { DateTime, DateTimeFormatOptions } from 'luxon';
import React from 'react';
import { useTranslation } from 'react-i18next';

import IconGroup from '@/assets/icons/icon-group2.svg';
import { Box, Card, Text } from '@/components';
import { useCunninghamTheme } from '@/cunningham';

import { Pad, Role } from '../types';

const format: DateTimeFormatOptions = {
  month: '2-digit',
  day: '2-digit',
  year: 'numeric',
};

interface PadInfoProps {
  pad: Pad;
  currentRole: Role;
}

export const PadInfo = ({ pad }: PadInfoProps) => {
  const { t } = useTranslation();
  const { colorsTokens } = useCunninghamTheme();
  const { i18n } = useTranslation();

  const created_at = DateTime.fromISO(pad.created_at)
    .setLocale(i18n.language)
    .toLocaleString(format);

  const updated_at = DateTime.fromISO(pad.updated_at)
    .setLocale(i18n.language)
    .toLocaleString(format);

  return (
    <>
      <Card className="m-b" style={{ paddingBottom: 0 }}>
        <Box className="m-b" $direction="row" $align="center" $gap="1.5rem">
          <IconGroup
            width={44}
            color={colorsTokens()['primary-text']}
            aria-label={t('icon group')}
            style={{
              flexShrink: 0,
              alignSelf: 'start',
            }}
          />
          <Box>
            <Text as="h3" $weight="bold" $size="1.25rem" className="mt-0">
              {t('Members of “{{padName}}“', {
                padName: pad.name,
              })}
            </Text>
            <Text $size="m">
              {t('Add people to the “{{padName}}“ group.', {
                padName: pad.name,
              })}
            </Text>
          </Box>
        </Box>
        <Box
          className="p-s"
          $gap="3rem"
          $direction="row"
          $justify="start"
          $css={`
            border-top: 1px solid ${colorsTokens()['card-border']};
            padding-left: 1.5rem;
          `}
        >
          <Text $size="s" as="p">
            {t('{{count}} member', { count: pad.accesses.length })}
          </Text>
          <Text $size="s" $display="inline" as="p">
            {t('Created at')}&nbsp;
            <Text $weight="bold" $display="inline">
              {created_at}
            </Text>
          </Text>
          <Text $size="s" $display="inline" as="p">
            {t('Last update at')}&nbsp;
            <Text $weight="bold" $display="inline">
              {updated_at}
            </Text>
          </Text>
        </Box>
      </Card>
    </>
  );
};
