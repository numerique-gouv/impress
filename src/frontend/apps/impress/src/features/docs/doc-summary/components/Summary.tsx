import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, BoxButton, Text } from '@/components';

import { useDocStore } from '../../doc-editor';
import { Doc } from '../../doc-management';

interface SummaryProps {
  doc: Doc;
}

export const Summary = ({ doc }: SummaryProps) => {
  const { docsStore } = useDocStore();
  const { t } = useTranslation();

  const editor = docsStore?.[doc.id].editor;
  const headingFiltering = useCallback(
    () => editor?.document.filter((block) => block.type === 'heading'),
    [editor?.document],
  );

  const [headings, setHeadings] = useState(headingFiltering());

  if (!editor) {
    return null;
  }

  editor.onEditorContentChange(() => {
    setHeadings(headingFiltering());
  });

  return (
    <Box $overflow="auto" $padding="small">
      {headings?.map((heading) => (
        <BoxButton
          key={heading.id}
          onClick={() => {
            editor.focus();
            editor?.setTextCursorPosition(heading.id, 'end');
            document
              .querySelector(`[data-id="${heading.id}"]`)
              ?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              });
          }}
          style={{ textAlign: 'left' }}
        >
          <Text $theme="primary" $padding={{ vertical: 'xtiny' }}>
            {heading.content?.[0]?.type === 'text' && heading.content?.[0]?.text
              ? `- ${heading.content[0].text}`
              : ''}
          </Text>
        </BoxButton>
      ))}
      <Box
        $height="1px"
        $width="auto"
        $background="#e5e5e5"
        $margin={{ vertical: 'small' }}
        $css="flex: none;"
      />
      <BoxButton
        onClick={() => {
          editor.focus();
          document.querySelector(`[data-id="initialBlockId"]`)?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }}
      >
        <Text $theme="primary" $padding={{ vertical: 'xtiny' }}>
          {t('Back to top')}
        </Text>
      </BoxButton>
      <BoxButton
        onClick={() => {
          editor.focus();
          document
            .querySelector(
              `.bn-editor > .bn-block-group > .bn-block-outer:last-child`,
            )
            ?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
        }}
      >
        <Text $theme="primary" $padding={{ vertical: 'xtiny' }}>
          {t('Go to bottom')}
        </Text>
      </BoxButton>
    </Box>
  );
};
