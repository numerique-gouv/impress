import {
  Button,
  Switch,
  VariantType,
  useToastProvider,
} from '@openfun/cunningham-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Card, IconBG } from '@/components';

import { KEY_DOC_VISIBILITY, KEY_LIST_DOC, useUpdateDoc } from '../api';
import { Doc } from '../types';

interface DocVisibilityProps {
  doc: Doc;
}

export const DocVisibility = ({ doc }: DocVisibilityProps) => {
  const { t } = useTranslation();
  const [docPublic, setDocPublic] = useState(doc.is_public);
  const { toast } = useToastProvider();
  const api = useUpdateDoc({
    onSuccess: () => {
      toast(
        t('The document visiblitity has been updated.'),
        VariantType.SUCCESS,
        {
          duration: 4000,
        },
      );
    },
    listInvalideQueries: [KEY_LIST_DOC, KEY_DOC_VISIBILITY],
  });

  return (
    <Card
      $margin="tiny"
      $padding="small"
      aria-label={t('Doc visibility card')}
      $direction="row"
      $align="center"
      $justify="space-between"
    >
      <Box $direction="row" $gap="1rem">
        <IconBG iconName="public" />
        <Switch
          label={t(docPublic ? 'Doc public' : 'Doc private')}
          defaultChecked={docPublic}
          onChange={() => {
            api.mutate({
              id: doc.id,
              is_public: !docPublic,
            });
            setDocPublic(!docPublic);
          }}
          text={t(
            docPublic
              ? 'Anyone on the internet with the link can view'
              : 'Only for people with access',
          )}
        />
      </Box>
      <Button
        onClick={() => {
          navigator.clipboard
            .writeText(window.location.href)
            .then(() => {
              toast(t('Link Copied !'), VariantType.SUCCESS, {
                duration: 3000,
              });
            })
            .catch(() => {
              toast(t('Failed to copy link'), VariantType.ERROR, {
                duration: 3000,
              });
            });
        }}
        color="primary"
        icon={<span className="material-icons">copy</span>}
      >
        {t('Copy link')}
      </Button>
    </Card>
  );
};
