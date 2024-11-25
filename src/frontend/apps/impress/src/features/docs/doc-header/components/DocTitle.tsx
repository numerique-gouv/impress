/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import {
  Tooltip,
  VariantType,
  useToastProvider,
} from '@openfun/cunningham-react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Text } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import {
  Doc,
  KEY_DOC,
  KEY_LIST_DOC,
  useTrans,
  useUpdateDoc,
} from '@/features/docs/doc-management';
import { useBroadcastStore, useResponsiveStore } from '@/stores';

interface DocTitleProps {
  doc: Doc;
}

export const DocTitle = ({ doc }: DocTitleProps) => {
  const { isMobile } = useResponsiveStore();

  if (!doc.abilities.partial_update) {
    return (
      <Text
        as="h2"
        $margin={{ all: 'none', left: 'none' }}
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

  const { broadcast } = useBroadcastStore();

  const { mutate: updateDoc } = useUpdateDoc({
    listInvalideQueries: [KEY_DOC, KEY_LIST_DOC],
    onSuccess(data) {
      if (data.title !== untitledDocument) {
        toast(t('Document title updated successfully'), VariantType.SUCCESS);
      }

      // Broadcast to every user connected to the document
      broadcast(`${KEY_DOC}-${data.id}`);
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

  return (
    <>
      <Tooltip content={t('Rename')} placement="top">
        <Box
          as="input"
          defaultValue={isUntitled ? '' : titleDisplay}
          onKeyDownCapture={handleKeyDown}
          placeholder={untitledDocument}
          aria-label={t('doc title input')}
          name="doc-title"
          $radius="4px"
          onBlurCapture={(event) => handleTitleSubmit(event.target.value)}
          $color={colorsTokens()['greyscale-text']}
          $flex={1}
          $width="100%"
          $padding={{ left: '0' }}
          $margin={{ left: '-2px' }}
          $background="transparent"
          $css={css`
            font-size: var(--c--theme--font--sizes--h2);
            font-weight: 700;
            border: none;
          `}
        />
      </Tooltip>
    </>
  );
};
