import GjsEditor from '@grapesjs/react';
import grapesjs, { Editor, ProjectData } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import pluginBlocksBasic from 'grapesjs-blocks-basic';
import { useEffect, useState } from 'react';

import { Card, Text } from '@/components';

import { useUpdateTemplateCodeEditor } from '../api/useUpdateTemplateCodeEditor';
import { Template } from '../types';

interface TemplateEditorProps {
  template: Template;
}

export const TemplateEditor = ({ template }: TemplateEditorProps) => {
  const { mutate: updateCodeEditor } = useUpdateTemplateCodeEditor();
  const [editor, setEditor] = useState<Editor>();

  useEffect(() => {
    if (!editor?.loadProjectData) {
      return;
    }

    editor.loadProjectData(template.code_editor);
  }, [template.code_editor, editor]);

  useEffect(() => {
    editor?.Storage.add('remote', {
      load() {
        return Promise.resolve(template.code_editor);
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
        return Promise.resolve(template.code_editor);
      },
      store() {
        return Promise.resolve();
      },
    });
  };

  return (
    <>
      <Text as="h2" $align="center">
        {template.title}
      </Text>
      <Card className="m-b p-b" $css="margin-top:0;flex:1;" $overflow="auto">
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
      </Card>
    </>
  );
};
