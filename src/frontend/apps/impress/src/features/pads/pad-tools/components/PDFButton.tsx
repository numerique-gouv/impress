import {
  Button,
  VariantType,
  useToastProvider,
} from '@openfun/cunningham-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Pad, usePadStore } from '@/features/pads/pad';

import { useCreatePdf } from '../api/useCreatePdf';
import { Template } from '../types';
import { downloadFile } from '../utils';

interface PDFButtonProps {
  pad: Pad;
  templateId: Template['id'];
}

const PDFButton = ({ pad, templateId }: PDFButtonProps) => {
  const { t } = useTranslation();
  const [isFetching, setIsFetching] = useState(false);
  const { toast } = useToastProvider();
  const { padsStore } = usePadStore();
  const {
    mutate: createPdf,
    data: pdf,
    isSuccess,
    isPending,
    error,
  } = useCreatePdf();

  useEffect(() => {
    setIsFetching(isPending);
  }, [isPending]);

  useEffect(() => {
    if (!error) {
      return;
    }

    toast(error.message, VariantType.ERROR);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, t]);

  useEffect(() => {
    if (!pdf || !isSuccess) {
      return;
    }

    downloadFile(pdf, 'impress-document.pdf');
    setIsFetching(false);

    toast(t('Your pdf was downloaded succesfully'), VariantType.SUCCESS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdf, isSuccess, t]);

  async function onSubmit() {
    const editor = padsStore[pad.id].editor;

    if (!editor) {
      toast(t('No editor found'), VariantType.ERROR);
      return;
    }

    const body = await editor.blocksToHTMLLossy(editor.document);

    createPdf({
      templateId,
      body,
      body_type: 'html',
    });
  }

  return (
    <Button
      onClick={() => void onSubmit()}
      style={{
        width: 'fit-content',
      }}
      disabled={isFetching}
    >
      {t('Generate PDF')}
    </Button>
  );
};

export default PDFButton;
