import { Button } from '@openfun/cunningham-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, DropButton, IconOptions, Text } from '@/components';
import {
  Doc,
  ModalRemoveDoc,
  ModalShare,
  ModalUpdateDoc,
} from '@/features/docs/doc-management';
import { ModalGridMembers } from '@/features/docs/members/members-grid/';

import { ModalPDF } from './ModalPDF';

interface DocToolBoxProps {
  doc: Doc;
}

export const DocToolBox = ({ doc }: DocToolBoxProps) => {
  const { t } = useTranslation();
  const [isModalGridMembersOpen, setIsModalGridMembersOpen] = useState(false);
  const [isModalShareOpen, setIsModalShareOpen] = useState(false);
  const [isModalUpdateOpen, setIsModalUpdateOpen] = useState(false);
  const [isModalRemoveOpen, setIsModalRemoveOpen] = useState(false);
  const [isModalPDFOpen, setIsModalPDFOpen] = useState(false);
  const [isDropOpen, setIsDropOpen] = useState(false);

  return (
    <Box
      $margin={{ left: 'auto' }}
      $direction="row"
      $align="center"
      $gap="1rem"
    >
      {doc.abilities.manage_accesses && (
        <Button
          onClick={() => {
            setIsModalShareOpen(true);
          }}
        >
          {t('Share')}
        </Button>
      )}
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
          {doc.abilities.manage_accesses && (
            <>
              <Button
                onClick={() => {
                  setIsModalGridMembersOpen(true);
                  setIsDropOpen(false);
                }}
                color="primary-text"
                icon={<span className="material-icons">group</span>}
                size="small"
              >
                <Text $theme="primary">{t('Manage members')}</Text>
              </Button>
            </>
          )}
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
              <Text $theme="primary">{t('Update document')}</Text>
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
              <Text $theme="primary">{t('Delete document')}</Text>
            </Button>
          )}
          <Button
            onClick={() => {
              setIsModalPDFOpen(true);
              setIsDropOpen(false);
            }}
            color="primary-text"
            icon={<span className="material-icons">picture_as_pdf</span>}
            size="small"
          >
            <Text $theme="primary">{t('Generate PDF')}</Text>
          </Button>
        </Box>
      </DropButton>
      {isModalShareOpen && (
        <ModalShare onClose={() => setIsModalShareOpen(false)} doc={doc} />
      )}
      {isModalGridMembersOpen && (
        <ModalGridMembers
          onClose={() => setIsModalGridMembersOpen(false)}
          doc={doc}
        />
      )}
      {isModalPDFOpen && (
        <ModalPDF onClose={() => setIsModalPDFOpen(false)} doc={doc} />
      )}
      {isModalUpdateOpen && (
        <ModalUpdateDoc onClose={() => setIsModalUpdateOpen(false)} doc={doc} />
      )}
      {isModalRemoveOpen && (
        <ModalRemoveDoc onClose={() => setIsModalRemoveOpen(false)} doc={doc} />
      )}
    </Box>
  );
};
