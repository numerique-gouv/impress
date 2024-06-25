import { Button, Switch } from '@openfun/cunningham-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import IconGroup from '@/assets/icons/icon-group2.svg';
import { Box, Card, StyledLink, Text } from '@/components';
import { useCunninghamTheme } from '@/cunningham';

import { useCreateDoc } from '../api/useCreateDoc';

import { InputDocName } from './InputDocName';

export const CardCreateDoc = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    mutate: createDoc,
    isError,
    isPending,
    error,
  } = useCreateDoc({
    onSuccess: (doc) => {
      router.push(`/docs/${doc.id}`);
    },
  });
  const [docName, setDocName] = useState('');
  const [docPublic, setDocPublic] = useState(false);
  const { colorsTokens } = useCunninghamTheme();

  return (
    <Card
      $padding="big"
      $height="70%"
      $justify="space-between"
      $width="100%"
      $maxWidth="24rem"
      $minWidth="22rem"
      aria-label={t('Create new document card')}
    >
      <Box $gap="1rem">
        <Box $align="center">
          <IconGroup
            width={44}
            color={colorsTokens()['primary-text']}
            aria-label={t('icon group')}
          />
          <Text as="h3" $textAlign="center">
            {t('Name the document')}
          </Text>
        </Box>
        <InputDocName
          label={t('Document name')}
          {...{ error, isError, isPending, setDocName }}
        />
        <Switch
          label={t('Is it public ?')}
          labelSide="right"
          onChange={() => setDocPublic(!docPublic)}
        />
      </Box>
      <Box $justify="space-between" $direction="row" $align="center">
        <StyledLink href="/">
          <Button color="secondary">{t('Cancel')}</Button>
        </StyledLink>
        <Button
          onClick={() => createDoc({ title: docName, is_public: docPublic })}
          disabled={!docName}
        >
          {t('Create the document')}
        </Button>
      </Box>
    </Card>
  );
};
