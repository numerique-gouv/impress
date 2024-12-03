import {
  Button,
  Modal,
  ModalSize,
  VariantType,
  useToastProvider,
} from '@openfun/cunningham-react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import * as Y from 'yjs';

import { Box, Text } from '@/components';
import { toBase64 } from '@/features/docs/doc-editor';
import { Doc, useDocStore, useUpdateDoc } from '@/features/docs/doc-management';

import { KEY_LIST_DOC_VERSIONS } from '../api/useDocVersions';
import { Versions } from '../types';
import { revertUpdate } from '../utils';

interface ModalConfirmationVersionProps {
  onClose: () => void;
  docId: Doc['id'];

  versionId: Versions['version_id'];
}

export const ModalConfirmationVersion = ({
  onClose,
  docId,
  versionId,
}: ModalConfirmationVersionProps) => {
  const { t } = useTranslation();
  const { toast } = useToastProvider();
  const { push } = useRouter();
  const { providers } = useDocStore();
  const { mutate: updateDoc } = useUpdateDoc({
    listInvalideQueries: [KEY_LIST_DOC_VERSIONS],
    onSuccess: () => {
      const onDisplaySuccess = () => {
        toast(t('Version restored successfully'), VariantType.SUCCESS);
        void push(`/docs/${docId}`);
      };

      if (!providers?.[docId] || !providers?.[versionId]) {
        onDisplaySuccess();
        return;
      }

      revertUpdate(
        providers[docId].document,
        providers[docId].document,
        providers[versionId].document,
      );

      onDisplaySuccess();
    },
  });

  return (
    <Modal
      isOpen
      closeOnClickOutside
      onClose={() => onClose()}
      rightActions={
        <>
          <Button
            aria-label={t('Close the modal')}
            color="secondary"
            fullWidth
            onClick={() => onClose()}
          >
            {t('Cancel')}
          </Button>
          <Button
            aria-label={t('Restore')}
            color="danger"
            fullWidth
            onClick={() => {
              const newDoc = toBase64(
                Y.encodeStateAsUpdate(providers?.[versionId].document),
              );

              updateDoc({
                id: docId,
                content: newDoc,
              });

              onClose();
            }}
          >
            {t('Restore')}
          </Button>
        </>
      }
      size={ModalSize.MEDIUM}
      title={
        <Text $size="h6" $align="flex-start">
          {t('Warning')}
        </Text>
      }
    >
      <Box aria-label={t('Modal confirmation to restore the version')}>
        <Box>
          <Text>{t('Your current document will revert to this version.')}</Text>
          <Text>{t('If a member is editing, his works can be lost.')}</Text>
        </Box>
      </Box>
    </Modal>
  );
};
