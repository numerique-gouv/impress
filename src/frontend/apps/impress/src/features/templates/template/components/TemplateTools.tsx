import {
  Button,
  VariantType,
  useToastProvider,
} from '@openfun/cunningham-react';
import { useTranslation } from 'react-i18next';

import { Box, Text } from '@/components';
import { useCreateTemplate } from '@/features/templates/template-create';

import { useUpdateTemplate } from '../api/useUpdateTemplate';
import { Template } from '../types';

interface TemplateToolsProps {
  template: Template;
  html?: string;
  cssStyle?: string;
}

export const TemplateTools = ({
  template,
  html,
  cssStyle,
}: TemplateToolsProps) => {
  const { t } = useTranslation();
  const { toast } = useToastProvider();
  const { mutate: updateTemplate } = useUpdateTemplate({
    onSuccess: () => {
      toast(t('Template save successfully'), VariantType.SUCCESS);
    },
  });

  const { mutate: duplicateTemplate } = useCreateTemplate({
    onSuccess: () => {
      toast(t('Template duplicated successfully'), VariantType.SUCCESS);
    },
  });

  return (
    <Box
      className="m-b mb-t mt-t"
      $direction="row"
      $align="center"
      $justify="space-between"
    >
      <Text as="h2" $align="center">
        {template.title}
      </Text>
      <Box $direction="row" $gap="2rem">
        <Button
          onClick={() => {
            duplicateTemplate({
              title: `${template.title} - ${t('Copy')}`,
              code_editor: template.code_editor,
              css: template.css,
              code: template.code,
            });
          }}
          color="secondary"
        >
          {t('Duplicate template')}
        </Button>
        <Button
          onClick={() => {
            updateTemplate({
              id: template.id,
              css: cssStyle,
              html,
            });
          }}
          disabled={!template.abilities.partial_update}
        >
          {t('Save template')}
        </Button>
      </Box>
    </Box>
  );
};
