import { Button, Switch } from '@openfun/cunningham-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import IconGroup from '@/assets/icons/icon-group2.svg';
import { Box, Card, StyledLink, Text } from '@/components';
import { useCunninghamTheme } from '@/cunningham';

import { useCreatePad } from '../api/useCreatePad';

import { InputPadName } from './InputPadName';

export const CardCreatePad = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    mutate: createPad,
    isError,
    isPending,
    error,
  } = useCreatePad({
    onSuccess: (pad) => {
      router.push(`/pads/${pad.id}`);
    },
  });
  const [padName, setPadName] = useState('');
  const [padPublic, setPadPublic] = useState(false);
  const { colorsTokens } = useCunninghamTheme();

  return (
    <Card
      className="p-b"
      $height="70%"
      $justify="space-between"
      $width="100%"
      $maxWidth="24rem"
      $minWidth="22rem"
      aria-label={t('Create new pad card')}
    >
      <Box $gap="1rem">
        <Box $align="center">
          <IconGroup
            width={44}
            color={colorsTokens()['primary-text']}
            aria-label={t('icon group')}
          />
          <Text as="h3" $textAlign="center">
            {t('Name the pad')}
          </Text>
        </Box>
        <InputPadName
          label={t('Pad name')}
          {...{ error, isError, isPending, setPadName }}
        />
        <Switch
          label={t('Is it public ?')}
          labelSide="right"
          onChange={() => setPadPublic(!padPublic)}
        />
      </Box>
      <Box $justify="space-between" $direction="row" $align="center">
        <StyledLink href="/">
          <Button color="secondary">{t('Cancel')}</Button>
        </StyledLink>
        <Button
          onClick={() => createPad({ title: padName, is_public: padPublic })}
          disabled={!padName}
        >
          {t('Create the pad')}
        </Button>
      </Box>
    </Card>
  );
};
