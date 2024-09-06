import {
  Alert,
  Button,
  Modal,
  ModalSize,
  VariantType,
  useToastProvider,
} from '@openfun/cunningham-react';
import { UseMutationResult } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { APIError } from '@/api';
import { Box, Text } from '@/components';
import useCunninghamTheme from '@/cunningham/useCunninghamTheme';

import { KEY_DOC, KEY_LIST_DOC } from '../api';
import { useCreateDoc } from '../api/useCreateDoc';
import { useUpdateDoc } from '../api/useUpdateDoc';
import IconEdit from '../assets/icon-edit.svg';
import { Doc } from '../types';

import { InputDocName } from './InputDocName';

interface ModalCreateDocProps {
  onClose: () => void;
}

export const ModalCreateDoc = ({ onClose }: ModalCreateDocProps) => {
  const router = useRouter();
  const api = useCreateDoc({
    onSuccess: (doc) => {
      router.push(`/docs/${doc.id}`);
    },
  });
  const { t } = useTranslation();

  return (
    <ModalDoc
      {...{
        buttonText: t('Create the document'),
        onClose,
        isPublic: false,
        titleModal: t('Create a new document'),
        validate: (title) =>
          api.mutate({
            title,
          }),
        ...api,
      }}
    />
  );
};

interface ModalUpdateDocProps {
  onClose: () => void;
  doc: Doc;
}

export const ModalUpdateDoc = ({ onClose, doc }: ModalUpdateDocProps) => {
  const { toast } = useToastProvider();
  const { t } = useTranslation();

  const api = useUpdateDoc({
    onSuccess: () => {
      toast(t('The document has been updated.'), VariantType.SUCCESS, {
        duration: 4000,
      });
      onClose();
    },
    listInvalideQueries: [KEY_DOC, KEY_LIST_DOC],
  });

  return (
    <ModalDoc
      {...{
        buttonText: t('Validate the modification'),
        onClose,
        initialTitle: doc.title,
        isPublic: doc.is_public,
        infoText: t('Enter the new name of the selected document.'),
        titleModal: t('Update document "{{documentTitle}}"', {
          documentTitle: doc.title,
        }),
        validate: (title) =>
          api.mutate({
            title,
            id: doc.id,
          }),
        ...api,
      }}
    />
  );
};

type ModalDoc<T> = {
  buttonText: string;
  onClose: () => void;
  titleModal: string;
  validate: (title: string) => void;
  initialTitle?: string;
  infoText?: string;
} & UseMutationResult<Doc, APIError<unknown>, T, unknown>;

const ModalDoc = <T,>({
  buttonText,
  infoText,
  initialTitle,
  onClose,
  titleModal,
  validate,
  ...api
}: ModalDoc<T>) => {
  const { colorsTokens } = useCunninghamTheme();
  const { t } = useTranslation();
  const [title, setTitle] = useState(initialTitle || '');

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
          aria-label={buttonText}
          color="primary"
          fullWidth
          onClick={() => validate(title)}
        >
          {buttonText}
        </Button>
      }
      size={ModalSize.MEDIUM}
      title={
        <Box $align="center" $gap="1rem" $margin={{ bottom: '2.5rem' }}>
          <IconEdit width={48} color={colorsTokens()['primary-text']} />
          <Text as="h2" $size="h3" $margin="none">
            {titleModal}
          </Text>
        </Box>
      }
    >
      <Box $margin={{ bottom: 'xl' }} $gap="1rem">
        {infoText && (
          <Alert canClose={false} type={VariantType.INFO}>
            <Text>{infoText}</Text>
          </Alert>
        )}

        <Box $gap="1rem">
          <InputDocName
            label={t('Document name')}
            defaultValue={title}
            {...{
              error: api.error,
              isError: api.isError,
              isPending: api.isPending,
              setDocName: setTitle,
            }}
          />
        </Box>
      </Box>
    </Modal>
  );
};
