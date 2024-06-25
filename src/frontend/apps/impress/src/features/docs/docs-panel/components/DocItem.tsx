import { useRouter } from 'next/router';
import React from 'react';
import { useTranslation } from 'react-i18next';

import IconGroup from '@/assets/icons/icon-group.svg';
import { Box, StyledLink, Text } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import { Doc } from '@/features/docs/doc-management';

import IconNone from '../assets/icon-none.svg';

interface DocItemProps {
  doc: Doc;
}

export const DocItem = ({ doc }: DocItemProps) => {
  const { t } = useTranslation();
  const { colorsTokens } = useCunninghamTheme();
  const {
    query: { id },
  } = useRouter();

  // There is at least 1 owner in the team
  const hasMembers = doc.accesses.length > 1;
  const isActive = doc.id === id;

  const commonProps = {
    className: 'p-t',
    width: 52,
    style: {
      borderRadius: '10px',
      flexShrink: 0,
      background: '#fff',
    },
  };

  const activeStyle = `
    border-right: 4px solid ${colorsTokens()['primary-600']};
    background: ${colorsTokens()['primary-400']};
    span{
      color: ${colorsTokens()['primary-text']};
    }
  `;

  const hoverStyle = `
    &:hover{
      border-right: 4px solid ${colorsTokens()['primary-400']};
      background: ${colorsTokens()['primary-300']};
      
      span{
        color: ${colorsTokens()['primary-text']};
      }
    }
  `;

  return (
    <Box
      $margin="none"
      as="li"
      $css={`
        transition: all 0.2s ease-in; 
        border-right: 4px solid transparent;
        ${isActive ? activeStyle : hoverStyle}
      `}
    >
      <StyledLink className="p-s pt-t pb-t" href={`/docs/${doc.id}`}>
        <Box $align="center" $direction="row" $gap="0.5rem">
          {hasMembers ? (
            <IconGroup
              aria-label={t(`Docs icon`)}
              color={colorsTokens()['primary-500']}
              {...commonProps}
              style={{
                ...commonProps.style,
                border: `1px solid ${colorsTokens()['primary-300']}`,
              }}
            />
          ) : (
            <IconNone
              aria-label={t(`Empty docs icon`)}
              color={colorsTokens()['greyscale-500']}
              {...commonProps}
              style={{
                ...commonProps.style,
                border: `1px solid ${colorsTokens()['greyscale-300']}`,
              }}
            />
          )}
          <Text
            $weight="bold"
            $color={!hasMembers ? colorsTokens()['greyscale-600'] : undefined}
            $css={`
              min-width: 14rem;
            `}
          >
            {doc.title}
          </Text>
        </Box>
      </StyledLink>
    </Box>
  );
};
