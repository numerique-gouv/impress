import {
  Alert,
  Button,
  Modal,
  ModalSize,
  VariantType,
  useToastProvider,
} from '@openfun/cunningham-react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

import { Box, Text } from '@/components';
import {
  Doc,
  base64ToYDoc,
  useDocStore,
  useUpdateDoc,
} from '@/features/docs/doc-management';

import { useDocVersion } from '../api';
import { KEY_LIST_DOC_VERSIONS } from '../api/useDocVersions';
import { Versions } from '../types';
import { revertUpdate } from '../utils';

interface ModalVersionProps {
  onClose: () => void;
  docId: Doc['id'];
  versionId: Versions['version_id'];
}

export const ModalVersion = ({
  onClose,
  docId,
  versionId,
}: ModalVersionProps) => {
  const { data: version } = useDocVersion({
    docId,
    versionId,
  });
  const { t } = useTranslation();
  const { toast } = useToastProvider();
  const { push } = useRouter();
  const { providers } = useDocStore();
  const { mutate: updateDoc } = useUpdateDoc({
    listInvalidQueries: [KEY_LIST_DOC_VERSIONS],
    onSuccess: () => {
      const onDisplaySuccess = () => {
        toast(t('Version restored successfully'), VariantType.SUCCESS);
        void push(`/docs/${docId}`);
      };

      if (!providers?.[docId] || !version?.content) {
        onDisplaySuccess();
        return;
      }

      revertUpdate(
        providers[docId].document,
        providers[docId].document,
        base64ToYDoc(version.content),
      );

      onDisplaySuccess();
    },
  });

  return (
    <Modal
      isOpen
      closeOnClickOutside
      hideCloseButton
      leftActions={
        <Button
          aria-label={t('Close the modal')}
          color="secondary"
          fullWidth
          onClick={() => onClose()}
        >
          {t('Cancel')}
        </Button>
      }
      onClose={() => onClose()}
      rightActions={
        <Button
          aria-label={t('Restore')}
          color="primary"
          fullWidth
          onClick={() => {
            if (!version?.content) {
              return;
            }

            updateDoc({
              id: docId,
              content: version.content,
            });

            onClose();
          }}
        >
          {t('Restore')}
        </Button>
      }
      size={ModalSize.MEDIUM}
      title={
        <Box $gap="1rem">
          <Text $isMaterialIcon $size="36px" $theme="primary">
            restore
          </Text>
          <Text as="h2" $size="h3" $margin="none">
            {t('Restore this version?')}
          </Text>
        </Box>
      }
    >
      <Box aria-label={t('Modal confirmation to restore the version')}>
        <Alert canClose={false} type={VariantType.WARNING}>
          <Box>
            <Text>
              {t('Your current document will revert to this version.')}
            </Text>
            <Text>{t('If a member is editing, his works can be lost.')}</Text>
          </Box>
        </Alert>
      </Box>
    </Modal>
  );
};
