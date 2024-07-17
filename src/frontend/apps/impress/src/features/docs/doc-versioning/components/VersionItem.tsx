import { useRouter } from 'next/router';
import React from 'react';

import { Box, StyledLink, Text } from '@/components';
import { useCunninghamTheme } from '@/cunningham';

import { Versions } from '../types';

interface VersionItemProps {
  text: string;
  link: string;
  versionId?: Versions['version_id'];
}

export const VersionItem = ({ versionId, text, link }: VersionItemProps) => {
  const { colorsTokens } = useCunninghamTheme();
  const {
    query: { versionId: currentId },
  } = useRouter();

  const isActive = versionId === currentId;

  return (
    <Box
      as="li"
      $background={isActive ? colorsTokens()['primary-300'] : 'transparent'}
      $css={`
        border-left: 4px solid transparent;
        border-bottom: 1px solid ${colorsTokens()['primary-100']};
        &:hover{
          border-left: 4px solid ${colorsTokens()['primary-400']};
          background: ${colorsTokens()['primary-300']};
        }
      `}
      $hasTransition
      $minWidth="13rem"
    >
      <StyledLink
        href={link}
        onClick={(e) => {
          if (isActive) {
            e.preventDefault();
          }
        }}
      >
        <Box
          $padding={{ vertical: '0.7rem', horizontal: 'small' }}
          $align="center"
          $direction="row"
          $justify="space-between"
          $width="100%"
        >
          <Box $direction="row" $gap="0.5rem" $align="center">
            <Text $isMaterialIcon $size="24px" $theme="primary">
              description
            </Text>
            <Text $weight="bold" $theme="primary" $size="m">
              {text}
            </Text>
          </Box>
        </Box>
      </StyledLink>
    </Box>
  );
};
