import {
  Button,
  VariantType,
  useToastProvider,
} from '@openfun/cunningham-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Pad, usePadStore } from '@/features/pads/pad';

import { useCreatePdf } from '../api/useCreatePdf';
import { downloadFile } from '../utils';

interface PrintToPDFButtonProps {
  pad: Pad;
}

const PrintToPDFButton = ({ pad }: PrintToPDFButtonProps) => {
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
      templateId: '472d0633-20b8-4cb1-998a-1134ade092ba',
      body,
      body_type: 'markdown',
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
      {t('Print the pad')}
    </Button>
  );
};

export default PrintToPDFButton;
