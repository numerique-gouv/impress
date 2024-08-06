import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { InputActionMeta, Options } from 'react-select';
import AsyncSelect from 'react-select/async';

import { useCunninghamTheme } from '@/cunningham';
import { Doc } from '@/features/docs/doc-management';
import { isValidEmail } from '@/utils';

import { KEY_LIST_USER, useUsers } from '../api/useUsers';
import { OptionSelect, OptionType } from '../types';

export type OptionsSelect = Options<OptionSelect>;

interface SearchUsersProps {
  doc: Doc;
  selectedUsers: OptionsSelect;
  setSelectedUsers: (value: OptionsSelect) => void;
  disabled?: boolean;
}

export const SearchUsers = ({
  doc,
  selectedUsers,
  setSelectedUsers,
  disabled,
}: SearchUsersProps) => {
  const { colorsTokens } = useCunninghamTheme();
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const resolveOptionsRef = useRef<((value: OptionsSelect) => void) | null>(
    null,
  );
  const { data } = useUsers(
    { query: userQuery, docId: doc.id },
    {
      enabled: !!userQuery,
      queryKey: [KEY_LIST_USER, { query: userQuery }],
    },
  );

  const options = data?.results;

  const optionsSelect = useMemo(() => {
    if (!resolveOptionsRef.current || !options) {
      return;
    }

    const optionsFiltered = options.filter(
      (user) =>
        !selectedUsers?.find(
          (selectedUser) => selectedUser.value.email === user.email,
        ),
    );

    let users: OptionsSelect = optionsFiltered.map((user) => ({
      value: user,
      label: user.email,
      type: OptionType.NEW_MEMBER,
    }));

    if (userQuery && isValidEmail(userQuery)) {
      const isFoundUser = !!optionsFiltered.find(
        (user) => user.email === userQuery,
      );
      const isFoundEmail = !!selectedUsers.find(
        (selectedUser) => selectedUser.value.email === userQuery,
      );

      if (!isFoundUser && !isFoundEmail) {
        users = [
          {
            value: { email: userQuery },
            label: userQuery,
            type: OptionType.INVITATION,
          },
        ];
      }
    }

    resolveOptionsRef.current(users);
    resolveOptionsRef.current = null;

    return users;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, selectedUsers]);

  const loadOptions = (): Promise<OptionsSelect> => {
    return new Promise<OptionsSelect>((resolve) => {
      resolveOptionsRef.current = resolve;
    });
  };

  const timeout = useRef<NodeJS.Timeout | null>(null);
  const onInputChangeHandle = useCallback(
    (newValue: string, actionMeta: InputActionMeta) => {
      if (
        actionMeta.action === 'input-blur' ||
        actionMeta.action === 'menu-close'
      ) {
        return;
      }

      setInput(newValue);
      if (timeout.current) {
        clearTimeout(timeout.current);
      }

      timeout.current = setTimeout(() => {
        setUserQuery(newValue);
      }, 1000);
    },
    [],
  );

  return (
    <AsyncSelect
      styles={{
        placeholder: (base) => ({
          ...base,
          fontSize: '14px',
          color: colorsTokens()['primary-600'],
        }),
        control: (base) => ({
          ...base,
          minHeight: '45px',
          borderColor: colorsTokens()['primary-600'],
        }),
        input: (base) => ({
          ...base,
          minHeight: '45px',
          fontSize: '14px',
        }),
      }}
      isDisabled={disabled}
      aria-label={t('Find a member to add to the document')}
      isMulti
      loadOptions={loadOptions}
      defaultOptions={optionsSelect}
      onInputChange={onInputChangeHandle}
      inputValue={input}
      placeholder={t('Search by email')}
      noOptionsMessage={() =>
        input
          ? t("We didn't find a mail matching, try to be more accurate")
          : t('Invite new members to {{title}}', { title: doc.title })
      }
      onChange={(value) => {
        setInput('');
        setUserQuery('');
        setSelectedUsers(value);
      }}
    />
  );
};
