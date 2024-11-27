import { ReactNode } from 'react';
import { css } from 'styled-components';

import { Box, Text } from '@/components';
import { User } from '@/core';
import { useCunninghamTheme } from '@/cunningham';

import { UserAvatar } from './UserAvatar';

type Props = {
  user: User;
  showRightOnHover?: boolean;
  right?: ReactNode;
};

export const SearchUserRow = ({
  user,
  right,
  showRightOnHover = true,
}: Props) => {
  const { spacingsTokens } = useCunninghamTheme();
  const spacings = spacingsTokens();
  const hasFullName = user.full_name != null && user.full_name !== '';

  return (
    <Box
      $direction="row"
      $align="center"
      $padding={{ horizontal: '2xs', vertical: '3xs' }}
      $justify="space-between"
      $width="100%"
      $css={css`
        .right-user-row {
          color: red !important;
          display: ${showRightOnHover ? 'none' : 'flex'};
        }

        [data-cmdk-selected='true'] {
          background-color: red !important;
        }

        &:hover {
          .right-user-row {
            color: green !important;
            display: flex;
          }
        }
      `}
    >
      <Box $direction="row" $align="center" $gap={spacings['2xs']}>
        <UserAvatar user={user} />
        <Box $direction="column">
          <Text $size="sm" $variation="1000">
            {hasFullName ? user.full_name : user.email}
          </Text>
          {hasFullName && (
            <Text $size="xs" $variation="500">
              {user.email}
            </Text>
          )}
        </Box>
      </Box>

      {right && (
        <Box className="right-user-row" $direction="row" $align="center">
          {right}
        </Box>
      )}
    </Box>
  );
};
