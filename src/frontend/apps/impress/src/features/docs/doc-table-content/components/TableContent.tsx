import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, BoxButton, Text } from '@/components';
import { Panel } from '@/components/Panel';
import { useDocStore } from '@/features/docs/doc-editor';
import { Doc } from '@/features/docs/doc-management';

import { useDocTableContentStore } from '../stores';

import { Heading } from './Heading';

type HeadingBlock = {
  id: string;
  type: string;
  text: string;
  content: HeadingBlock[];
  props: {
    level: number;
  };
};

interface TableContentProps {
  doc: Doc;
}

export const TableContent = ({ doc }: TableContentProps) => {
  const { docsStore } = useDocStore();
  const { t } = useTranslation();

  const editor = docsStore?.[doc.id]?.editor;
  const headingFiltering = useCallback(
    () =>
      editor?.document.filter(
        (block) => block.type === 'heading',
      ) as unknown as HeadingBlock[],
    [editor?.document],
  );

  const [headings, setHeadings] = useState<HeadingBlock[]>();
  const { setIsPanelTableContentOpen, isPanelTableContentOpen } =
    useDocTableContentStore();
  const [hasBeenClose, setHasBeenClose] = useState(false);
  const setClosePanel = () => {
    setHasBeenClose(true);
    setIsPanelTableContentOpen(false);
  };

  const [headingIdHighlight, setHeadingIdHighlight] = useState<string>();

  // Open the panel if there are more than 1 heading
  useEffect(() => {
    if (headings?.length && headings.length > 1 && !hasBeenClose) {
      setIsPanelTableContentOpen(true);
    }
  }, [setIsPanelTableContentOpen, headings, hasBeenClose]);

  // Close the panel unmount
  useEffect(() => {
    return () => {
      setIsPanelTableContentOpen(false);
    };
  }, [setIsPanelTableContentOpen]);

  // To highlight the first heading in the viewport
  useEffect(() => {
    const handleScroll = () => {
      if (!headings) {
        return;
      }

      for (const heading of headings) {
        const elHeading = document.body.querySelector(
          `.bn-block-outer[data-id="${heading.id}"]`,
        );

        if (!elHeading) {
          return;
        }

        const rect = elHeading.getBoundingClientRect();
        const isVisible =
          rect.top + rect.height >= 1 &&
          rect.bottom <=
            (window.innerHeight || document.documentElement.clientHeight);

        if (isVisible) {
          setHeadingIdHighlight(heading.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', () => {
      setTimeout(() => {
        handleScroll();
      }, 300);
    });

    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [headings, setHeadingIdHighlight]);

  if (!editor) {
    return null;
  }

  // Update the headings when the editor content changes
  editor?.onEditorContentChange(() => {
    setHeadings(headingFiltering());
  });

  if (!isPanelTableContentOpen) {
    return null;
  }

  return (
    <Panel setIsPanelOpen={setClosePanel}>
      <Box $padding="small" $maxHeight="95%">
        <Box $overflow="auto">
          {headings?.map((heading) => {
            const content = heading.content?.[0];
            const text = content?.type === 'text' ? content.text : '';

            return (
              <Heading
                editor={editor}
                headingId={heading.id}
                level={heading.props.level}
                text={text}
                key={heading.id}
                isHighlight={headingIdHighlight === heading.id}
              />
            );
          })}
        </Box>
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
            document.querySelector(`.bn-editor`)?.scrollIntoView({
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
    </Panel>
  );
};
