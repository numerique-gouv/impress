import GjsEditor from '@grapesjs/react';
import {
  Alert,
  Button,
  VariantType,
  useToastProvider,
} from '@openfun/cunningham-react';
import grapesjs, { Editor, ProjectData } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import pluginBlocksBasic from 'grapesjs-blocks-basic';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Text } from '@/components';

import { useUpdateTemplate } from '../api/useUpdateTemplate';
import { useUpdateTemplateCodeEditor } from '../api/useUpdateTemplateCodeEditor';
import { Template } from '../types';

interface TemplateEditorProps {
  template: Template;
}

export const TemplateEditor = ({ template }: TemplateEditorProps) => {
  const { t } = useTranslation();
  const { toast } = useToastProvider();
  const { mutate: updateCodeEditor } = useUpdateTemplateCodeEditor();
  const { mutate: updateTemplate } = useUpdateTemplate({
    onSuccess: () => {
      toast(t('Template save successfully'), VariantType.SUCCESS);
    },
  });
  const [editor, setEditor] = useState<Editor>();
  const [showWarning, setShowWarning] = useState(false);

  const html = editor?.getHtml();

  useEffect(() => {
    if (showWarning || !html) {
      return;
    }

    setShowWarning(html.includes('{{body}}') === false);
  }, [html, showWarning]);

  useEffect(() => {
    if (!editor?.loadProjectData || !editor?.Storage) {
      return;
    }

    const projectData = Object.keys(template.code_editor).length
      ? template.code_editor
      : editor.getProjectData();

    editor?.loadProjectData(projectData);

    editor.Storage.add('remote', {
      load() {
        return Promise.resolve(projectData);
      },
      store(data: ProjectData) {
        updateCodeEditor({
          code_editor: data,
          id: template.id,
        });
        return Promise.resolve();
      },
    });
  }, [editor, template.code_editor, template.id, updateCodeEditor]);

  const onEditor = (editor: Editor) => {
    setEditor(editor);

    editor?.Storage.add('remote', {
      load() {
        return Promise.resolve(editor.getProjectData());
      },
      store() {
        return Promise.resolve();
      },
    });
  };

  return (
    <>
      <Box
        className="m-b mb-t mt-t"
        $direction="row"
        $align="center"
        $justify="space-between"
      >
        <Text as="h2" $align="center">
          {template.title}
        </Text>
        <Button
          onClick={() => {
            if (editor) {
              updateTemplate({
                id: template.id,
                css: editor.getCss(),
                html,
              });
            }
          }}
        >
          {t('Save template')}
        </Button>
      </Box>
      {showWarning && html && (
        <Box
          className="m-b"
          $css="margin-top:0;"
          $effect={html.includes('{{body}}') ? 'hide' : 'show'}
        >
          <Alert
            type={VariantType.WARNING}
          >{`The {{body}} tag is necessary to works with the pads.`}</Alert>
        </Box>
      )}

      {!template.abilities.partial_update && (
        <Box className="m-b" $css="margin-top:0;">
          <Alert
            type={VariantType.WARNING}
          >{`Read only, you don't have the right to update this template.`}</Alert>
        </Box>
      )}

      <Box className="m-b" $css="margin-top:0;flex:1;" $overflow="auto">
        <GjsEditor
          grapesjs={grapesjs}
          options={{
            storageManager: {
              type: 'remote',
            },
          }}
          plugins={[(editor) => pluginBlocksBasic(editor, {})]}
          onEditor={onEditor}
        />
      </Box>
    </>
  );
};
