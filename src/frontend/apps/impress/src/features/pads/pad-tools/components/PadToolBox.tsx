import { Button } from '@openfun/cunningham-react';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, DropButton, IconOptions, Text } from '@/components';
import { ModalAddMembers } from '@/features/pads/members/members-add';
import { ModalGridMembers } from '@/features/pads/members/members-grid/';
import {
  ModalRemovePad,
  ModalUpdatePad,
  Pad,
  currentDocRole,
} from '@/features/pads/pad-management';

import { TemplatesOrdering, useTemplates } from '../api/useTemplates';

import { ModalPDF } from './ModalPDF';

interface PadToolBoxProps {
  pad: Pad;
}

export const PadToolBox = ({ pad }: PadToolBoxProps) => {
  const { t } = useTranslation();
  const { data: templates } = useTemplates({
    ordering: TemplatesOrdering.BY_CREATED_ON_DESC,
  });
  const [isModalAddMembersOpen, setIsModalAddMembersOpen] = useState(false);
  const [isModalGridMembersOpen, setIsModalGridMembersOpen] = useState(false);
  const [isModalUpdateOpen, setIsModalUpdateOpen] = useState(false);
  const [isModalRemoveOpen, setIsModalRemoveOpen] = useState(false);
  const [isModalPDFOpen, setIsModalPDFOpen] = useState(false);
  const [isDropOpen, setIsDropOpen] = useState(false);

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

    return templateOptions;
  }, [templates?.pages]);

  return (
    <Box $margin="big" $position="absolute" $css="right:1rem;">
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
          {pad.abilities.manage_accesses && (
            <>
              <Button
                onClick={() => {
                  setIsModalAddMembersOpen(true);
                  setIsDropOpen(false);
                }}
                color="primary-text"
                icon={<span className="material-icons">person_add</span>}
                size="small"
              >
                <Text $theme="primary">{t('Add members')}</Text>
              </Button>
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
          {pad.abilities.partial_update && (
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
          {pad.abilities.destroy && (
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
      {isModalGridMembersOpen && (
        <ModalGridMembers
          onClose={() => setIsModalGridMembersOpen(false)}
          doc={pad}
        />
      )}
      {isModalAddMembersOpen && (
        <ModalAddMembers
          onClose={() => setIsModalAddMembersOpen(false)}
          doc={pad}
          currentRole={currentDocRole(pad)}
        />
      )}
      {isModalPDFOpen && (
        <ModalPDF
          onClose={() => setIsModalPDFOpen(false)}
          templateOptions={templateOptions}
          pad={pad}
        />
      )}
      {isModalUpdateOpen && (
        <ModalUpdatePad onClose={() => setIsModalUpdateOpen(false)} pad={pad} />
      )}
      {isModalRemoveOpen && (
        <ModalRemovePad onClose={() => setIsModalRemoveOpen(false)} pad={pad} />
      )}
    </Box>
  );
};
