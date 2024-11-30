import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import init, { Model } from "@ironcalc/wasm";
import { HocuspocusProvider } from '@hocuspocus/provider';
import { Doc } from '@/features/docs/doc-management';
import { WorkbookState } from "./ironcalc/components/workbookState";
import { base64ToBytes, bytesToBase64 } from "./ironcalc/AppComponents/util";
const IronCalcWorkbook = dynamic(
    () => import("./ironcalc/components/workbook"),
    { ssr: false }
);

interface IronCalcEditorProps {
    doc: Doc;
    provider: HocuspocusProvider;
    storeId: string;
}

export function IronCalcEditor({doc, storeId, provider}: IronCalcEditorProps) {
    const [model, setModel] = useState<Model | null>(null);
    const [workbookState, setWorkbookState] = useState<WorkbookState | null>(null);
    
    const isVersion = doc.id !== storeId;
    const readOnly = !doc.abilities.partial_update || isVersion;

    // Listen for model changes
    useEffect(() => {
        if (!model || readOnly) return;

        const interval = setInterval(() => {
            const queue = model.flushSendQueue();
            if (queue.length !== 1) {
                // Convert model to base64 string
                const modelContent = bytesToBase64(model.toBytes());
                
                // TODO: Save to server
                console.log("Doc modified. new base64: ", modelContent);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [model, doc.id, readOnly]);

    useEffect(() => {
        init().then(() => {
            setWorkbookState(new WorkbookState());

            // TODO: Load existing content from server
            if (doc.content && false) {
                try {
                    const bytes = base64ToBytes(doc.content);
                    return setModel(Model.from_bytes(bytes));
                } catch (e) {
                    console.error('Failed to load existing content:', e);
                }
            }
            
            // If no content or failed to load, create new model
            setModel(new Model("Workbook1", "en", "UTC"));
        });
    }, [doc.content]);

    if (!model || !workbookState) {
        return <div>Loading...</div>;
    }
    
    return <div className="ironcalc-workbook" style={{ height: '100%' }}>
        <IronCalcWorkbook model={model} workbookState={workbookState} />
    </div>;
}
