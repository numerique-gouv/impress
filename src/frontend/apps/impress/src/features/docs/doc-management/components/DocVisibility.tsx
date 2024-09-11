import {
  Button,
  Switch,
  VariantType,
  useToastProvider,
} from '@openfun/cunningham-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Card, IconBG } from '@/components';

import { KEY_DOC, KEY_LIST_DOC, useUpdateDocLink } from '../api';
import { Doc, LinkReach } from '../types';

interface DocVisibilityProps {
  doc: Doc;
}

export const DocVisibility = ({ doc }: DocVisibilityProps) => {
  const { t } = useTranslation();
  const [docPublic, setDocPublic] = useState(
    doc.link_reach === LinkReach.PUBLIC,
  );
  const { toast } = useToastProvider();
  const api = useUpdateDocLink({
    onSuccess: () => {
      toast(
        t('The document visiblitity has been updated.'),
        VariantType.SUCCESS,
        {
          duration: 4000,
        },
      );
    },
    listInvalideQueries: [KEY_LIST_DOC, KEY_DOC],
  });

  return (
    <Card
      $margin="tiny"
      $padding={{ horizontal: 'small', vertical: 'tiny' }}
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
              link_reach: docPublic ? LinkReach.RESTRICTED : LinkReach.PUBLIC,
              link_role: 'reader',
            });
            setDocPublic(!docPublic);
          }}
          disabled={!doc.abilities.link_configuration}
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
