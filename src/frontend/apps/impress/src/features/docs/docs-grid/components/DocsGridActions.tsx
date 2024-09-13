import { Button } from '@openfun/cunningham-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, DropButton, IconOptions, Text } from '@/components';
import {
  Doc,
  ModalRemoveDoc,
  ModalUpdateDoc,
} from '@/features/docs/doc-management';

interface DocsGridActionsProps {
  doc: Doc;
}

export const DocsGridActions = ({ doc }: DocsGridActionsProps) => {
  const { t } = useTranslation();
  const [isModalUpdateOpen, setIsModalUpdateOpen] = useState(false);
  const [isModalRemoveOpen, setIsModalRemoveOpen] = useState(false);
  const [isDropOpen, setIsDropOpen] = useState(false);

  if (!doc.abilities.partial_update && !doc.abilities.destroy) {
    return null;
  }

  return (
    <>
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
          {doc.abilities.partial_update && (
            <Button
              onClick={() => {
                setIsModalUpdateOpen(true);
                setIsDropOpen(false);
              }}
              color="primary-text"
              icon={<span className="material-icons">edit</span>}
              size="small"
            >
              <Text>{t('Update document')}</Text>
            </Button>
          )}
          {doc.abilities.destroy && (
            <Button
              onClick={() => {
                setIsModalRemoveOpen(true);
                setIsDropOpen(false);
              }}
              color="primary-text"
              icon={<span className="material-icons">delete</span>}
              size="small"
            >
              <Text>{t('Delete document')}</Text>
            </Button>
          )}
        </Box>
      </DropButton>
      {isModalUpdateOpen && (
        <ModalUpdateDoc onClose={() => setIsModalUpdateOpen(false)} doc={doc} />
      )}
      {isModalRemoveOpen && (
        <ModalRemoveDoc onClose={() => setIsModalRemoveOpen(false)} doc={doc} />
      )}
    </>
  );
};
