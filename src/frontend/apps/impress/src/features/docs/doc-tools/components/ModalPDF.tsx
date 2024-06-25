import {
  Alert,
  Button,
  Loader,
  Modal,
  ModalSize,
  Select,
  VariantType,
  useToastProvider,
} from '@openfun/cunningham-react';
import { t } from 'i18next';
import { useEffect, useState } from 'react';

import { Box, Text } from '@/components';
import { useDocStore } from '@/features/docs/doc-editor/';
import { Doc } from '@/features/docs/doc-management';

import { useCreatePdf } from '../api/useCreatePdf';
import { adaptBlockNoteHTML, downloadFile } from '../utils';

interface ModalPDFProps {
  onClose: () => void;
  templateOptions: {
    label: string;
    value: string;
  }[];
  doc: Doc;
}

export const ModalPDF = ({ onClose, templateOptions, doc }: ModalPDFProps) => {
  const { toast } = useToastProvider();
  const { docsStore } = useDocStore();
  const {
    mutate: createPdf,
    data: pdf,
    isSuccess,

    isPending,
    error,
  } = useCreatePdf();
  const [templateIdSelected, setTemplateIdSelected] = useState<string>(
    templateOptions?.[0].value,
  );

  useEffect(() => {
    if (!error) {
      return;
    }

    toast(error.message, VariantType.ERROR);

    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, t]);

  useEffect(() => {
    if (!pdf || !isSuccess) {
      return;
    }

    // normalize title
    const title = doc.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s/g, '-');

    downloadFile(pdf, `${title}.pdf`);

    toast(t('Your pdf was downloaded succesfully'), VariantType.SUCCESS);

    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdf, isSuccess, t]);

  async function onSubmit() {
    if (!templateIdSelected) {
      return;
    }

    const editor = docsStore[doc.id].editor;

    if (!editor) {
      toast(t('No editor found'), VariantType.ERROR);
      return;
    }

    let body = await editor.blocksToHTMLLossy(editor.document);
    body = adaptBlockNoteHTML(body);

    createPdf({
      templateId: templateIdSelected,
      body,
      body_type: 'html',
    });
  }

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
          aria-label={t('Download')}
          color="primary"
          fullWidth
          onClick={() => void onSubmit()}
          disabled={isPending || !templateIdSelected}
        >
          {t('Download')}
        </Button>
      }
      size={ModalSize.MEDIUM}
      title={
        <Box $align="center" $gap="1rem">
          <Text className="material-icons" $size="3.5rem" $theme="primary">
            picture_as_pdf
          </Text>
          <Text as="h2" $size="h3" $margin="none" $theme="primary">
            {t('Generate PDF')}
          </Text>
        </Box>
      }
    >
      <Box
        $margin={{ bottom: 'xl' }}
        aria-label={t('Content modal to generate a PDF')}
        $gap="1.5rem"
      >
        <Alert canClose={false} type={VariantType.INFO}>
          <Text>
            {t(
              'Generate a PDF from your document, it will be inserted in the selected template.',
            )}
          </Text>
        </Alert>

        <Select
          clearable={false}
          label={t('Template')}
          options={templateOptions}
          value={templateIdSelected}
          onChange={(options) =>
            setTemplateIdSelected(options.target.value as string)
          }
        />

        {isPending && (
          <Box $align="center" $margin={{ top: 'big' }}>
            <Loader />
          </Box>
        )}
      </Box>
    </Modal>
  );
};
