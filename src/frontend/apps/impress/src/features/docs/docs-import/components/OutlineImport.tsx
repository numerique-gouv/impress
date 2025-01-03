import { FileUploader, FieldState } from "@openfun/cunningham-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import JSZip from 'jszip';
import { LinkReach, LinkRole } from "../../doc-management/types";
import { Block } from "@blocknote/core";
import { DocToImport } from "../types";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";

const createDocToImport = (fileName: string, content: Block[], error: Error | undefined): DocToImport => ({
  doc: {
    id: '',
    title: fileName.split('.').shift() ?? '',
    content: '',
    creator: '',
    is_favorite: false,
    link_reach: LinkReach.AUTHENTICATED,
    link_role: LinkRole.EDITOR,
    nb_accesses: 0,
    created_at: '',
    updated_at: '',
    abilities: {
      accesses_manage: false,
      accesses_view: true,
      attachment_upload: true,
      destroy: false,
      link_configuration: false,
      partial_update: false,
      retrieve: true,
      update: false,
      versions_destroy: false,
      versions_list: false,
      versions_retrieve: false,
    },
  },
  content,
  state: error ? 'error' : 'pending',
  children: [],
  error,
});

export const OutlineImport = ({ setExtractedDocs, onNewUpload }: { setExtractedDocs: (docsToImport: DocToImport[]) => void, onNewUpload: () => void }) => {
    const { t } = useTranslation();
    const editor = useCreateBlockNote();
    const [state, setState] = useState<FieldState | "uploading" | undefined>(undefined);
  
    const handleFileUpload = async (file: File) => {
    onNewUpload();
      try {
        setState('uploading');
        
        const zip = new JSZip();
        const contents = await zip.loadAsync(file);
        
        const docsMap = new Map<string, DocToImport>();
        
        // Traiter tous les fichiers
        await Promise.all(
          Object.values(contents.files).map(async (zipEntry) => {
            if (!zipEntry.dir && zipEntry.name.endsWith('.md')) {
                let content: Block[] = [];
                let error: Error | undefined = undefined;
                try {
                    const text = await zipEntry.async('text');
                    content = await editor?.tryParseMarkdownToBlocks(text) || [];
                } catch (e) {
                    error = e instanceof Error ? e : new Error('Unknown error');
                }
                
                const fileName = zipEntry.name.split('/').pop() ?? '';
                const docToImport = createDocToImport(fileName, content, error);
                docsMap.set(zipEntry.name, docToImport);
            }
          })
        );

        // Construire l'arborescence
        const rootDocs: DocToImport[] = [];
        const paths = Array.from(docsMap.keys()).sort();
        
        paths.forEach((path) => {
          const doc = docsMap.get(path)!;
          const pathParts = path.split('/');
          
          if (pathParts.length === 1) {
            rootDocs.push(doc);
          } else {
            const parentPath = pathParts.slice(0, -1).join('/');
            const parentDoc = docsMap.get(parentPath + '.md');
            
            if (parentDoc) {
              parentDoc.children = parentDoc.children || [];
              parentDoc.children.push(doc);
            } else {
              rootDocs.push(doc);
            }
          }
        });

        setExtractedDocs(rootDocs);
        setState('success');
      } catch (error) {
        setState('error');
      }
    };
  
    return <>
      <div style={{ display: 'none' }}>
        <BlockNoteView editor={editor} editable={false} />
      </div>
      <FileUploader
        data-testid="file-uploader"
        bigText={t('Outline exported .zip file')}
        state={state}
        onChange={(event) => event.target.files?.[0] && handleFileUpload(event.target.files[0])}
      />
    </>;
  };