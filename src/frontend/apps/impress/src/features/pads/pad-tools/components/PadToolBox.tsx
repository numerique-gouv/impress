import { Select } from '@openfun/cunningham-react';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box } from '@/components';
import { Pad } from '@/features/pads/pad';
import { TemplatesOrdering, useTemplates } from '@/features/templates';

import PrintToPDFButton from './PrintToPDFButton';

interface PadToolBoxProps {
  pad: Pad;
}

export const PadToolBox = ({ pad }: PadToolBoxProps) => {
  const { t } = useTranslation();
  const { data: templates } = useTemplates({
    ordering: TemplatesOrdering.BY_CREATED_ON_DESC,
  });
  const [templateIdSelected, setTemplateIdSelected] = useState<string>();

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

  return (
    <Box
      className="m-b"
      $align="center"
      $direction="row"
      $gap="1rem"
      $justify="flex-end"
    >
      <Select
        clearable={false}
        label={t('Template')}
        options={templateOptions}
        value={templateIdSelected}
        onChange={(options) =>
          setTemplateIdSelected(options.target.value as string)
        }
      />
      {templateIdSelected && (
        <PrintToPDFButton pad={pad} templateId={templateIdSelected} />
      )}
    </Box>
  );
};
