/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import {
  Tooltip,
  VariantType,
  useToastProvider,
} from '@openfun/cunningham-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Text } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import { useHeadingStore } from '@/features/docs/doc-editor';
import {
  Doc,
  KEY_DOC,
  KEY_LIST_DOC,
  useTrans,
  useUpdateDoc,
} from '@/features/docs/doc-management';
import { useResponsiveStore } from '@/stores';
import { isFirefox } from '@/utils/userAgent';

interface DocTitleProps {
  doc: Doc;
}

export const DocTitle = ({ doc }: DocTitleProps) => {
  const { isMobile } = useResponsiveStore();

  if (!doc.abilities.partial_update) {
    return (
      <Text
        as="h2"
        $margin={{ all: 'none', left: 'tiny' }}
        $size={isMobile ? 'h4' : 'h2'}
      >
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
  const { headings } = useHeadingStore();
  const headingText = headings?.[0]?.contentText;
  const debounceRef = useRef<NodeJS.Timeout>();
  const { isMobile } = useResponsiveStore();

  const { mutate: updateDoc } = useUpdateDoc({
    listInvalideQueries: [KEY_DOC, KEY_LIST_DOC],
    onSuccess(data) {
      if (data.title !== untitledDocument) {
        toast(t('Document title updated successfully'), VariantType.SUCCESS);
      }
    },
  });

  const handleTitleSubmit = useCallback(
    (inputText: string) => {
      let sanitizedTitle = inputText.trim();
      sanitizedTitle = sanitizedTitle.replace(/(\r\n|\n|\r)/gm, '');

      // When blank we set to untitled
      if (!sanitizedTitle) {
        sanitizedTitle = untitledDocument;
        setTitleDisplay(sanitizedTitle);
      }

      // If mutation we update
      if (sanitizedTitle !== doc.title) {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
          debounceRef.current = undefined;
        }
        setTitleDisplay(sanitizedTitle);
        updateDoc({ id: doc.id, title: sanitizedTitle });
      }
    },
    [doc.id, doc.title, untitledDocument, updateDoc],
  );

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

  useEffect(() => {
    if ((!debounceRef.current && !isUntitled) || !headingText) {
      return;
    }

    setTitleDisplay(headingText);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      handleTitleSubmit(headingText);
      debounceRef.current = undefined;
    }, 3000);
  }, [isUntitled, handleTitleSubmit, headingText]);

  return (
    <>
      <Tooltip content={t('Rename')} placement="top">
        <Box
          as="h2"
          $radius="4px"
          $padding={{ horizontal: 'tiny', vertical: '4px' }}
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
            font-size: ${isMobile ? '1.2rem' : '1.5rem'};
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
