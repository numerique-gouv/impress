import {
  Switch,
  VariantType,
  useToastProvider,
} from '@openfun/cunningham-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Card, IconBG } from '@/components';

import { KEY_DOC, KEY_LIST_DOC, useUpdateDoc } from '../api';
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
    listInvalideQueries: [KEY_LIST_DOC],
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
        <IconBG iconName="public" $margin="none" />
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
    </Card>
  );
};
