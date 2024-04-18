import GjsEditor from '@grapesjs/react';
import { Alert, VariantType } from '@openfun/cunningham-react';
import grapesjs, { Editor, ProjectData } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import pluginBlocksBasic from 'grapesjs-blocks-basic';
import { useEffect, useState } from 'react';

import { Box } from '@/components';

import { useUpdateTemplateCodeEditor } from '../api/useUpdateTemplateCodeEditor';
import { Template } from '../types';

import { TemplateTools } from './TemplateTools';

interface TemplateEditorProps {
  template: Template;
}

export const TemplateEditor = ({ template }: TemplateEditorProps) => {
  const { mutate: updateCodeEditor } = useUpdateTemplateCodeEditor();
  const [editor, setEditor] = useState<Editor>();
  const html = editor?.getHtml();

  const [showWarning, setShowWarning] = useState(!!html);

  useEffect(() => {
    if (!html) {
      return;
    }

    setShowWarning(!html.includes('{{body}}'));
  }, [html]);

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
      <TemplateTools
        template={template}
        html={html}
        cssStyle={editor?.getCss()}
      />
      <Box
        className="m-b"
        $css="margin-top:0;"
        $effect={showWarning ? 'show' : 'hide'}
      >
        <Alert
          type={VariantType.WARNING}
        >{`The {{body}} tag is necessary to works with the pads.`}</Alert>
      </Box>

      {!template.abilities.partial_update && (
        <Box className="m-b" $css="margin-top:0;">
          <Alert
            type={VariantType.WARNING}
          >{`Read only, you don't have the right to update this template.`}</Alert>
        </Box>
      )}

      <Box
        className="m-b"
        $overflow="auto"
        $css={`
          margin-top:0;
          flex:1;
          & .gjs-pn-panel.gjs-pn-options,
          & .gjs-pn-panel.gjs-pn-views span[title='Settings'] {
            display: none;
          }
        `}
      >
        <GjsEditor
          grapesjs={grapesjs}
          options={{
            storageManager: {
              type: 'remote',
            },
            showToolbar: false,
            showDevices: false,
          }}
          plugins={[(editor) => pluginBlocksBasic(editor, {})]}
          onEditor={onEditor}
        />
      </Box>
    </>
  );
};
