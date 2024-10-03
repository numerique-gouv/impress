import {
  Button,
  Loader,
  VariantType,
  useToastProvider,
} from '@openfun/cunningham-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, IconBG, Text, TextErrors } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import { Doc, Role } from '@/features/docs/doc-management';
import { ChooseRole } from '@/features/docs/members/members-add/';

import { useDeleteDocInvitation, useUpdateDocInvitation } from '../api';
import { Invitation } from '../types';

interface InvitationItemProps {
  role: Role;
  currentRole: Role;
  invitation: Invitation;
  doc: Doc;
}

export const InvitationItem = ({
  doc,
  role,
  invitation,
  currentRole,
}: InvitationItemProps) => {
  const canDelete = invitation.abilities.destroy;
  const canUpdate = invitation.abilities.partial_update;
  const { t } = useTranslation();
  const [localRole, setLocalRole] = useState(role);
  const { colorsTokens } = useCunninghamTheme();
  const { toast } = useToastProvider();
  const { mutate: updateDocInvitation, error: errorUpdate } =
    useUpdateDocInvitation({
      onSuccess: () => {
        toast(t('The role has been updated.'), VariantType.SUCCESS, {
          duration: 4000,
        });
      },
    });

  const { mutate: removeDocInvitation, error: errorDelete } =
    useDeleteDocInvitation({
      onSuccess: () => {
        toast(t('The invitation has been removed.'), VariantType.SUCCESS, {
          duration: 4000,
        });
      },
    });

  if (!invitation.email) {
    return (
      <Box className="m-auto">
        <Loader />
      </Box>
    );
  }

  return (
    <Box $width="100%" $gap="0.7rem">
      <Box $direction="row" $gap="1rem">
        <IconBG iconName="account_circle" $size="2rem" />
        <Box
          $align="center"
          $direction="row"
          $gap="1rem"
          $justify="space-between"
          $width="100%"
          $wrap="wrap"
        >
          <Box>
            <Text
              $size="t"
              $background={colorsTokens()['info-600']}
              $color="white"
              $radius="2px"
              $padding="xtiny"
              $css="align-self: flex-start;"
            >
              {t('Invited')}
            </Text>
            <Text $justify="center">{invitation.email}</Text>
          </Box>
          <Box $direction="row" $gap="1rem" $align="center">
            <Box $minWidth="13rem">
              <ChooseRole
                label={t('Role')}
                defaultRole={localRole}
                currentRole={currentRole}
                disabled={!canUpdate}
                setRole={(role) => {
                  setLocalRole(role);
                  updateDocInvitation({
                    docId: doc.id,
                    invitationId: invitation.id,
                    role,
                  });
                }}
              />
            </Box>
            {doc.abilities.manage_accesses && (
              <Button
                color="tertiary-text"
                icon={
                  <Text
                    $isMaterialIcon
                    $theme={!canDelete ? 'greyscale' : 'primary'}
                    $variation={!canDelete ? '500' : 'text'}
                  >
                    delete
                  </Text>
                }
                disabled={!canDelete}
                onClick={() =>
                  removeDocInvitation({
                    docId: doc.id,
                    invitationId: invitation.id,
                  })
                }
              />
            )}
          </Box>
        </Box>
      </Box>
      {(errorUpdate || errorDelete) && (
        <TextErrors causes={errorUpdate?.cause || errorDelete?.cause} />
      )}
    </Box>
  );
};
