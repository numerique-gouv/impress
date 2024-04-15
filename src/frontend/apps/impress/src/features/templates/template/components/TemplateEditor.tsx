import GjsEditor from '@grapesjs/react';
import grapesjs, { Editor, ProjectData } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import pluginBlocksBasic from 'grapesjs-blocks-basic';

import { Card, Text } from '@/components';

import { useUpdateTemplateCodeEditor } from '../api/useUpdateTemplateCodeEditor';
import { Template } from '../types';

interface TemplateEditorProps {
  template: Template;
}

export const TemplateEditor = ({ template }: TemplateEditorProps) => {
  const onEditor = (editor: Editor) => {};

  return (
    <>
      <Text as="h2" $align="center">
        {template.title}
      </Text>
      <Card className="m-b p-b" $css="margin-top:0;flex:1;" $overflow="auto">
        <GjsEditor
          grapesjs={grapesjs}
          options={{
            storageManager: false,
          }}
          plugins={[(editor) => pluginBlocksBasic(editor, {})]}
          onEditor={onEditor}
        />
      </Card>
    </>
  );
};
