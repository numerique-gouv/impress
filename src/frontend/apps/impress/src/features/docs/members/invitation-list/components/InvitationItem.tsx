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
import { useResponsiveStore } from '@/stores';

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
  const { isSmallMobile, screenWidth } = useResponsiveStore();
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
      <Box $direction="row" $gap="1rem" $wrap="wrap">
        <Box
          $align="center"
          $direction="row"
          $gap="1rem"
          $justify="space-between"
          $width="100%"
          $wrap="wrap"
          $css={`flex: ${isSmallMobile ? '100%' : '70%'};`}
        >
          <IconBG iconName="account_circle" $size="2rem" />
          <Box $css="flex:1;">
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
          <Box
            $direction="row"
            $gap="1rem"
            $align="center"
            $justify="space-between"
            $css="flex:1;"
            $wrap={screenWidth < 400 ? 'wrap' : 'nowrap'}
          >
            <Box $minWidth="13rem" $css={isSmallMobile ? 'flex:1;' : ''}>
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
              <Box $margin={isSmallMobile ? 'auto' : ''}>
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
              </Box>
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
