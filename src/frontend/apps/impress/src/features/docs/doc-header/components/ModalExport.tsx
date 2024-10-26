import {
  Alert,
  Button,
  Loader,
  Modal,
  ModalSize,
  Radio,
  RadioGroup,
  Select,
  VariantType,
  useToastProvider,
} from '@openfun/cunningham-react';
import { t } from 'i18next';
import { useEffect, useMemo, useState } from 'react';

import { Box, Text } from '@/components';
import { useEditorStore } from '@/features/docs/doc-editor';
import { Doc } from '@/features/docs/doc-management';

import { useExport } from '../api/useExport';
import { TemplatesOrdering, useTemplates } from '../api/useTemplates';
import { adaptBlockNoteHTML, downloadFile } from '../utils';

interface ModalPDFProps {
  onClose: () => void;
  doc: Doc;
}

export const ModalPDF = ({ onClose, doc }: ModalPDFProps) => {
  const { data: templates } = useTemplates({
    ordering: TemplatesOrdering.BY_CREATED_ON_DESC,
  });
  const { toast } = useToastProvider();
  const { editor } = useEditorStore();
  const {
    mutate: createExport,
    data: documentGenerated,
    isSuccess,
    isPending,
    error,
  } = useExport();
  const [templateIdSelected, setTemplateIdSelected] = useState<string>();
  const [format, setFormat] = useState<'pdf' | 'docx'>('pdf');

  const templateOptions = useMemo(() => {
    if (!templates?.pages) {
      return [];
    }

    const templateOptions = templates.pages
      .map((page) =>
        page.results.map((template) => ({
          label: template.title,
          value: template.id,
        })),
      )
      .flat();

    if (templateOptions.length) {
      setTemplateIdSelected(templateOptions[0].value);
    }

    return templateOptions;
  }, [templates?.pages]);

  useEffect(() => {
    if (!error) {
      return;
    }

    toast(error.message, VariantType.ERROR);

    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, t]);

  useEffect(() => {
    if (!documentGenerated || !isSuccess) {
      return;
    }

    // normalize title
    const title = doc.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s/g, '-');

    downloadFile(documentGenerated, `${title}.${format}`);

    toast(
      t('Your {{format}} was downloaded succesfully', {
        format,
      }),
      VariantType.SUCCESS,
    );

    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentGenerated, isSuccess, t]);

  async function onSubmit() {
    if (!templateIdSelected || !format) {
      return;
    }

    if (!editor) {
      toast(t('No editor found'), VariantType.ERROR);
      return;
    }

    let body = await editor.blocksToFullHTML(editor.document);
    body = adaptBlockNoteHTML(body);

    createExport({
      templateId: templateIdSelected,
      body,
      body_type: 'html',
      format,
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
          <Text
            className="material-icons"
            $size="3.5rem"
            $theme="primary"
            $variation="600"
          >
            picture_as_pdf
          </Text>
          <Text as="h2" $size="h3" $margin="none" $theme="primary">
            {t('Export')}
          </Text>
        </Box>
      }
    >
      <Box
        $margin={{ bottom: 'xl' }}
        aria-label={t('Content modal to export the document')}
        $gap="1.5rem"
      >
        <Alert canClose={false} type={VariantType.INFO}>
          <Text>
            {t(
              'Export your document, it will be inserted in the selected template.',
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

        <RadioGroup>
          <Radio
            label={t('PDF')}
            value="pdf"
            name="format"
            onChange={(evt) => setFormat(evt.target.value as 'pdf')}
            defaultChecked={true}
          />
          <Radio
            label={t('Docx')}
            value="docx"
            name="format"
            onChange={(evt) => setFormat(evt.target.value as 'docx')}
          />
        </RadioGroup>

        {isPending && (
          <Box $align="center" $margin={{ top: 'big' }}>
            <Loader />
          </Box>
        )}
      </Box>
    </Modal>
  );
};
