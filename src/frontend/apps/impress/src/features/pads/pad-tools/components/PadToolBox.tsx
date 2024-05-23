import { Button } from '@openfun/cunningham-react';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, DropButton, IconOptions, Text } from '@/components';
import { Pad } from '@/features/pads/pad';
import { ModalUpdatePad } from '@/features/pads/pads-create';

import { TemplatesOrdering, useTemplates } from '../api/useTemplates';

import { ModalPDF } from './ModalPDF';

interface PadToolBoxProps {
  pad: Pad;
}

export const PadToolBox = ({ pad }: PadToolBoxProps) => {
  const { t } = useTranslation();
  const { data: templates } = useTemplates({
    ordering: TemplatesOrdering.BY_CREATED_ON_DESC,
  });
  const [isModalUpdateOpen, setIsModalUpdateOpen] = useState(false);
  const [isModalPDFOpen, setIsModalPDFOpen] = useState(false);
  const [isDropOpen, setIsDropOpen] = useState(false);

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

    return templateOptions;
  }, [templates?.pages]);

  return (
    <Box $margin="big" $position="absolute" $css="right:1rem;">
      <DropButton
        button={
          <IconOptions
            isOpen={isDropOpen}
            aria-label={t('Open the document options')}
          />
        }
        onOpenChange={(isOpen) => setIsDropOpen(isOpen)}
        isOpen={isDropOpen}
      >
        <Box>
          <Button
            onClick={() => {
              setIsModalUpdateOpen(true);
              setIsDropOpen(false);
            }}
            color="primary-text"
            icon={<span className="material-icons">edit</span>}
          >
            <Text $theme="primary">{t('Update document')}</Text>
          </Button>
          <Button
            onClick={() => {
              setIsModalPDFOpen(true);
              setIsDropOpen(false);
            }}
            color="primary-text"
            icon={<span className="material-icons">picture_as_pdf</span>}
          >
            <Text $theme="primary">{t('Generate PDF')}</Text>
          </Button>
        </Box>
      </DropButton>
      {isModalPDFOpen && (
        <ModalPDF
          onClose={() => setIsModalPDFOpen(false)}
          templateOptions={templateOptions}
          pad={pad}
        />
      )}
      {isModalUpdateOpen && (
        <ModalUpdatePad onClose={() => setIsModalUpdateOpen(false)} pad={pad} />
      )}
    </Box>
  );
};
