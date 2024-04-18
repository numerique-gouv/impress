import { Button, Switch } from '@openfun/cunningham-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import IconGroup from '@/assets/icons/icon-group2.svg';
import { Box, Card, StyledLink, Text } from '@/components';
import { useCunninghamTheme } from '@/cunningham';

import { useCreateTemplate } from '../api/useCreateTemplate';

import { InputTemplateName } from './InputTemplateName';

export const CardCreateTemplate = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    mutate: createTemplate,
    isError,
    isPending,
    error,
  } = useCreateTemplate({
    onSuccess: (pad) => {
      router.push(`/templates/${pad.id}`);
    },
  });
  const [templateName, setTemplateName] = useState('');
  const [templatePublic, setTemplatePublic] = useState(false);
  const { colorsTokens } = useCunninghamTheme();

  return (
    <Card
      className="p-b"
      $height="70%"
      $justify="space-between"
      $width="100%"
      $maxWidth="24rem"
      $minWidth="22rem"
      aria-label={t('Create new template card')}
    >
      <Box $gap="1rem">
        <Box $align="center">
          <IconGroup
            width={44}
            color={colorsTokens()['primary-text']}
            aria-label={t('icon group')}
          />
          <Text as="h3" $textAlign="center">
            {t('Name the template')}
          </Text>
        </Box>
        <InputTemplateName
          label={t('Template name')}
          {...{ error, isError, isPending, setTemplateName }}
        />
        <Switch
          label={t('Is it public ?')}
          labelSide="right"
          onChange={() => setTemplatePublic(!templatePublic)}
        />
      </Box>
      <Box $justify="space-between" $direction="row" $align="center">
        <StyledLink href="/">
          <Button color="secondary">{t('Cancel')}</Button>
        </StyledLink>
        <Button
          onClick={() =>
            createTemplate({ title: templateName, is_public: templatePublic })
          }
          disabled={!templateName}
        >
          {t('Create the template')}
        </Button>
      </Box>
    </Card>
  );
};
