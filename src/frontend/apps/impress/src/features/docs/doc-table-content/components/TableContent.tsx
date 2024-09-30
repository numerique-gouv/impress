import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, BoxButton, Text } from '@/components';
import { useDocStore } from '@/features/docs/doc-editor';
import { Doc } from '@/features/docs/doc-management';
import { useResponsiveStore } from '@/stores';

import { useDocTableContentStore } from '../stores';

import { Heading } from './Heading';
import { Panel } from './Panel';

const recursiveTextContent = (content: HeadingBlock['content']): string => {
  if (!content) {
    return '';
  }

  return content.reduce((acc, content) => {
    if (content.type === 'text') {
      return acc + content.text;
    } else if (content.type === 'link') {
      return acc + recursiveTextContent(content.content);
    }

    return acc;
  }, '');
};

type HeadingBlock = {
  id: string;
  type: string;
  text: string;
  content: HeadingBlock[];
  contentText: string;
  props: {
    level: number;
  };
};

interface TableContentProps {
  doc: Doc;
  setIsTableContentOpen?: (isOpen: boolean) => void;
}

export const TableContent = ({
  doc,
  setIsTableContentOpen,
}: TableContentProps) => {
  const { screenSize } = useResponsiveStore();
  const { docsStore } = useDocStore();
  const { t } = useTranslation();

  const editor = docsStore?.[doc.id]?.editor;
  const headingFiltering = useCallback(
    () =>
      editor?.document
        .filter((block) => block.type === 'heading')
        .map((block) => ({
          ...block,
          contentText: recursiveTextContent(
            block.content as unknown as HeadingBlock['content'],
          ),
        })) as unknown as HeadingBlock[],
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
    if (
      headings?.length &&
      headings.length > 1 &&
      !hasBeenClose &&
      screenSize === 'desktop'
    ) {
      setIsPanelTableContentOpen(true);
    }
  }, [setIsPanelTableContentOpen, headings, hasBeenClose, screenSize]);

  // Inform the parent component if the panel is open
  useEffect(() => {
    setIsTableContentOpen?.(isPanelTableContentOpen);
  }, [isPanelTableContentOpen, setIsTableContentOpen]);

  // Close the panel unmount
  useEffect(() => {
    return () => {
      setIsPanelTableContentOpen(false);
    };
  }, [setIsPanelTableContentOpen]);

  // To highlight the first heading in the viewport
  useEffect(() => {
    if (!isPanelTableContentOpen) {
      return;
    }

    const handleScroll = () => {
      if (!headings) {
        return;
      }

      for (const heading of headings) {
        const elHeading = document.body.querySelector(
          `.bn-block-outer[data-id="${heading.id}"] [data-content-type="heading"]:first-child`,
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
  }, [headings, setHeadingIdHighlight, isPanelTableContentOpen]);

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
      <Box $maxHeight="100%">
        <Box $overflow="auto" $padding={{ right: 'small' }}>
          {headings?.map((heading) => (
            <Heading
              editor={editor}
              headingId={heading.id}
              level={heading.props.level}
              text={heading.contentText}
              key={heading.id}
              isHighlight={headingIdHighlight === heading.id}
            />
          ))}
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
          $align="flex-start"
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
          $align="flex-start"
        >
          <Text $theme="primary" $padding={{ vertical: 'xtiny' }}>
            {t('Go to bottom')}
          </Text>
        </BoxButton>
      </Box>
    </Panel>
  );
};
