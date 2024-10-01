/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import {
  Tooltip,
  VariantType,
  useToastProvider,
} from '@openfun/cunningham-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createGlobalStyle } from 'styled-components';

import { Box, Text } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import {
  Doc,
  KEY_DOC,
  KEY_LIST_DOC,
  useTrans,
  useUpdateDoc,
} from '@/features/docs/doc-management';
import { isFirefox } from '@/utils/userAgent';

const DocTitleStyle = createGlobalStyle`
  .c__tooltip {
    padding: 4px 6px;
  }
`;

interface DocTitleProps {
  doc: Doc;
}

export const DocTitle = ({ doc }: DocTitleProps) => {
  if (!doc.abilities.partial_update) {
    return (
      <Text as="h2" $align="center" $margin={{ all: 'none', left: 'tiny' }}>
        {doc.title}
      </Text>
    );
  }

  return <DocTitleInput doc={doc} />;
};

const DocTitleInput = ({ doc }: DocTitleProps) => {
  const { t } = useTranslation();
  const { colorsTokens } = useCunninghamTheme();
  const [titleDisplay, setTitleDisplay] = useState(doc.title);
  const { toast } = useToastProvider();
  const { untitledDocument } = useTrans();
  const isUntitled = titleDisplay === untitledDocument;

  const { mutate: updateDoc } = useUpdateDoc({
    listInvalideQueries: [KEY_DOC, KEY_LIST_DOC],
  });

  const handleTitleSubmit = (inputText: string) => {
    let sanitizedTitle = inputText.trim();
    sanitizedTitle = sanitizedTitle.replace(/(\r\n|\n|\r)/gm, '');

    // When blank we set to untitled
    if (!sanitizedTitle) {
      sanitizedTitle = untitledDocument;
      setTitleDisplay(sanitizedTitle);
    }

    // If mutation we update
    if (sanitizedTitle !== doc.title) {
      updateDoc(
        { id: doc.id, title: sanitizedTitle },
        {
          onSuccess: () => {
            if (sanitizedTitle !== untitledDocument) {
              toast(
                t('Document title updated successfully'),
                VariantType.SUCCESS,
              );
            }
          },
        },
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSubmit(e.currentTarget.textContent || '');
    }
  };

  const handleOnClick = () => {
    if (isUntitled) {
      setTitleDisplay('');
    }
  };

  return (
    <>
      <DocTitleStyle />
      <Tooltip content={t('Rename')} placement="top">
        <Box
          as="h2"
          $radius="4px"
          $padding={{ horizontal: 'tiny', vertical: '4px' }}
          $align="center"
          $margin="none"
          contentEditable={isFirefox() ? 'true' : 'plaintext-only'}
          onClick={handleOnClick}
          onBlurCapture={(e) =>
            handleTitleSubmit(e.currentTarget.textContent || '')
          }
          onKeyDownCapture={handleKeyDown}
          suppressContentEditableWarning={true}
          $color={
            isUntitled
              ? colorsTokens()['greyscale-200']
              : colorsTokens()['greyscale-text']
          }
          $css={`
            ${isUntitled && 'font-style: italic;'}
            cursor: text;
            font-size: 1.5rem;
            transition: box-shadow 0.5s, border-color 0.5s;
            border: 1px dashed transparent;
            
            &:hover {
              border-color: rgba(0, 123, 255, 0.25);
              border-style: dashed;
            }

            &:focus {
              outline: none;
              border-color: transparent;
              box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
            }
          `}
        >
          {titleDisplay}
        </Box>
      </Tooltip>
    </>
  );
};
