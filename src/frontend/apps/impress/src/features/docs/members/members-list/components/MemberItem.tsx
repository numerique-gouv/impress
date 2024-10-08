import {
  Alert,
  Button,
  Loader,
  VariantType,
  useToastProvider,
} from '@openfun/cunningham-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, IconBG, Text, TextErrors } from '@/components';
import { Access, Doc, Role } from '@/features/docs/doc-management';
import { ChooseRole } from '@/features/docs/members/members-add/';
import { useResponsiveStore } from '@/stores';

import { useDeleteDocAccess, useUpdateDocAccess } from '../api';
import { useWhoAmI } from '../hooks/useWhoAmI';

interface MemberItemProps {
  role: Role;
  currentRole: Role;
  access: Access;
  doc: Doc;
}

export const MemberItem = ({
  doc,
  role,
  access,
  currentRole,
}: MemberItemProps) => {
  const { isMyself, isLastOwner, isOtherOwner } = useWhoAmI(access);
  const { t } = useTranslation();
  const { isSmallMobile, screenWidth } = useResponsiveStore();
  const [localRole, setLocalRole] = useState(role);
  const { toast } = useToastProvider();
  const router = useRouter();
  const { mutate: updateDocAccess, error: errorUpdate } = useUpdateDocAccess({
    onSuccess: () => {
      toast(t('The role has been updated'), VariantType.SUCCESS, {
        duration: 4000,
      });
    },
  });

  const { mutate: removeDocAccess, error: errorDelete } = useDeleteDocAccess({
    onSuccess: () => {
      toast(
        t('The member has been removed from the document'),
        VariantType.SUCCESS,
        {
          duration: 4000,
        },
      );

      if (isMyself) {
        router.push('/');
      }
    },
  });

  const isNotAllowed =
    isOtherOwner || isLastOwner || !doc.abilities.manage_accesses;

  if (!access.user) {
    return (
      <Box className="m-auto">
        <Loader />
      </Box>
    );
  }

  return (
    <Box $width="100%">
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
          <Text $justify="center" $css="flex:1;">
            {access.user.email}
          </Text>
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
                disabled={isNotAllowed}
                setRole={(role) => {
                  setLocalRole(role);
                  updateDocAccess({
                    docId: doc.id,
                    accessId: access.id,
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
                      $theme={isNotAllowed ? 'greyscale' : 'primary'}
                      $variation={isNotAllowed ? '500' : 'text'}
                    >
                      delete
                    </Text>
                  }
                  disabled={isNotAllowed}
                  onClick={() =>
                    removeDocAccess({ docId: doc.id, accessId: access.id })
                  }
                />
              </Box>
            )}
          </Box>
        </Box>
      </Box>
      {(errorUpdate || errorDelete) && (
        <Box $margin={{ top: 'tiny' }}>
          <TextErrors causes={errorUpdate?.cause || errorDelete?.cause} />
        </Box>
      )}
      {(isLastOwner || isOtherOwner) && doc.abilities.manage_accesses && (
        <Box $margin={{ top: 'tiny' }}>
          <Alert
            canClose={false}
            type={VariantType.WARNING}
            icon={
              <Text className="material-icons" $theme="warning">
                warning
              </Text>
            }
          >
            {isLastOwner && (
              <Box $direction="column" $gap="0.2rem">
                <Text $theme="warning">
                  {t(
                    'You are the sole owner of this group, make another member the group owner before you can change your own role or be removed from your document.',
                  )}
                </Text>
              </Box>
            )}
            {isOtherOwner &&
              t('You cannot update the role or remove other owner.')}
          </Alert>
        </Box>
      )}
    </Box>
  );
};
