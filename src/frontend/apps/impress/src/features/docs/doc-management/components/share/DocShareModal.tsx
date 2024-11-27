import {
  Button,
  Modal,
  ModalSize,
  VariantType,
  useToastProvider,
} from '@openfun/cunningham-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebouncedCallback } from 'use-debounce';

import { Box } from '@/components';
import { LoadMoreText } from '@/components/LoadMoreText';
import {
  QuickSearch,
  QuickSearchData,
} from '@/components/quick-search/QuickSearch';
import { QuickSearchGroup } from '@/components/quick-search/QuickSearchGroup';
import { HorizontalSeparator } from '@/components/separators/HorizontalSeparator';
import { User } from '@/core';
import { Access, Doc } from '@/features/docs';
import { useDocInvitationsInfinite } from '@/features/docs/members/invitation-list';
import { Invitation } from '@/features/docs/members/invitation-list/types';
import { KEY_LIST_USER, useUsers } from '@/features/docs/members/members-add';
import { useDocAccessesInfinite } from '@/features/docs/members/members-list';
import { useResponsiveStore } from '@/stores';
import { isValidEmail } from '@/utils';

import { DocVisibility } from '../DocVisibility';

import { DocShareAddMemberList } from './DocShareAddMemberList';
import { DocShareInvitationItem } from './DocShareInvitationItem';
import { DocShareMemberItem } from './DocShareMemberItem';
import { DocShareModalInviteUserRow } from './DocShareModalInviteUserByEmail';

type Props = {
  doc: Doc;
  onClose: () => void;
};
export const DocShareModal = ({ doc, onClose }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToastProvider();
  const { isDesktop } = useResponsiveStore();

  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const canShare = doc.abilities.accesses_manage;
  const showMemberSection = inputValue === '' && selectedUsers.length === 0;

  const onSelect = (user: User) => {
    setSelectedUsers((prev) => [...prev, user]);
    setUserQuery('');
    setInputValue('');
  };

  const membersQuery = useDocAccessesInfinite({
    docId: doc.id,
  });

  const invitationQuery = useDocInvitationsInfinite({
    docId: doc.id,
  });

  const searchUsersQuery = useUsers(
    { query: userQuery, docId: doc.id },
    {
      enabled: !!userQuery,
      queryKey: [KEY_LIST_USER, { query: userQuery }],
    },
  );

  const membersData: QuickSearchData<Access> = useMemo(() => {
    const members =
      membersQuery.data?.pages.flatMap((page) => page.results) || [];

    const count = membersQuery.data?.pages[0]?.count ?? 1;

    return {
      groupName: t('Share with {{count}} users', {
        count: count,
      }),
      elements: members,
      endActions: membersQuery.hasNextPage
        ? [
            {
              content: <LoadMoreText />,
              onSelect: () => void membersQuery.fetchNextPage(),
            },
          ]
        : undefined,
    };
  }, [membersQuery, t]);

  const invitationsData: QuickSearchData<Invitation> = useMemo(() => {
    const invitations =
      invitationQuery.data?.pages.flatMap((page) => page.results) || [];

    return {
      groupName: t('Pending invitations'),
      elements: invitations,
      endActions: invitationQuery.hasNextPage
        ? [
            {
              content: <LoadMoreText />,
              onSelect: () => void invitationQuery.fetchNextPage(),
            },
          ]
        : undefined,
    };
  }, [invitationQuery, t]);

  const searchUserData: QuickSearchData<User> = useMemo(() => {
    const users = searchUsersQuery.data?.results || [];
    const isEmail = isValidEmail(userQuery);
    const fakeUser: User = {
      id: userQuery,
      full_name: '',
      email: userQuery,
      short_name: '',
    };

    return {
      groupName: t('Share with {{count}} users', { count: users.length }),
      elements: users,
      endActions:
        isEmail && users.length === 0
          ? [
              {
                content: <DocShareModalInviteUserRow user={fakeUser} />,
                onSelect: () => void onSelect(fakeUser),
              },
            ]
          : undefined,
    };
  }, [searchUsersQuery.data, t, userQuery]);

  const onFilter = useDebouncedCallback((str: string) => {
    setUserQuery(str);
  }, 300);

  const onRemoveUser = (row: User) => {
    setSelectedUsers((prevState) => {
      const index = prevState.findIndex((value) => value.id === row.id);
      if (index < 0) {
        return prevState;
      }
      const newArray = [...prevState];
      newArray.splice(index, 1);
      return newArray;
    });
  };

  return (
    <Modal
      isOpen
      size={isDesktop ? ModalSize.LARGE : ModalSize.FULL}
      onClose={onClose}
      title={
        <Box $padding="base" $align="flex-start">
          {t('Share the document')}
        </Box>
      }
    >
      {canShare && selectedUsers.length > 0 && (
        <Box $padding={{ horizontal: 'base' }} $margin={{ vertical: '11px' }}>
          <DocShareAddMemberList
            doc={doc}
            selectedUsers={selectedUsers}
            onRemoveUser={onRemoveUser}
            afterInvite={() => {
              setUserQuery('');
              setInputValue('');
              setSelectedUsers([]);
            }}
          />
        </Box>
      )}

      <QuickSearch
        data={[]}
        onFilter={(str) => {
          setInputValue(str);
          onFilter(str);
        }}
        inputValue={inputValue}
        showInput={canShare}
        loading={searchUsersQuery.isLoading}
        renderElement={(user) => <DocShareModalInviteUserRow user={user} />}
        onSelect={onSelect}
        placeholder={t('Type a name or email')}
      >
        {!showMemberSection && inputValue !== '' && (
          <QuickSearchGroup
            group={searchUserData}
            onSelect={onSelect}
            renderElement={(user) => <DocShareModalInviteUserRow user={user} />}
          />
        )}
        {showMemberSection && (
          <>
            {invitationsData.elements.length > 0 && (
              <QuickSearchGroup
                group={invitationsData}
                renderElement={(invitation) => (
                  <DocShareInvitationItem doc={doc} invitation={invitation} />
                )}
              />
            )}

            <QuickSearchGroup
              group={membersData}
              renderElement={(access) => (
                <DocShareMemberItem doc={doc} access={access} />
              )}
            />
          </>
        )}
      </QuickSearch>
      <HorizontalSeparator />
      <DocVisibility doc={doc} />
      <HorizontalSeparator />
      <Box $direction="row" $justify="space-between" $padding="base">
        <Button
          fullWidth={false}
          onClick={() => {
            navigator.clipboard
              .writeText(window.location.href)
              .then(() => {
                toast(t('Link Copied !'), VariantType.SUCCESS, {
                  duration: 3000,
                });
              })
              .catch(() => {
                toast(t('Failed to copy link'), VariantType.ERROR, {
                  duration: 3000,
                });
              });
          }}
          color="tertiary"
          icon={<span className="material-icons">add_link</span>}
        >
          {t('Copy link')}
        </Button>
        <Button onClick={onClose} color="primary">
          {t('Ok')}
        </Button>
      </Box>
    </Modal>
  );
};
