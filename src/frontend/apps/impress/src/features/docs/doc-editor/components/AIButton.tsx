import {
  useBlockNoteEditor,
  useComponentsContext,
  useSelectedBlocks,
  ComponentProps,
} from '@blocknote/react';
import { mergeRefs } from "@mantine/hooks";

import { ReactNode, useMemo, forwardRef, useRef, useCallback, useState, createContext } from 'react';

import {
  Menu as MantineMenu,
} from "@mantine/core";

import {Box, Text } from '@/components';

import { Doc } from '../../doc-management';
import { AIActions, useAIRewrite } from '../api/useAIRewrite';

import { useTranslation } from 'react-i18next';

interface AIGroupButtonProps {
  doc: Doc;
}

export function AIGroupButton({ doc }: AIGroupButtonProps) {
  const editor = useBlockNoteEditor();
  const Components = useComponentsContext();
  const selectedBlocks = useSelectedBlocks(editor);
  const { t } = useTranslation();

  const show = useMemo(() => {
    return !!selectedBlocks.find((block) => block.content !== undefined);
  }, [selectedBlocks]);

  if (!show || !editor.isEditable || !Components) {
    return null;
  }

  return (
    <Components.Generic.Menu.Root>
      <Components.Generic.Menu.Trigger>
        <Components.FormattingToolbar.Button
          className="bn-button"
          data-test="ai-actions"
          label="AI"
          mainTooltip={t('AI Actions')}
        >
          AI
        </Components.FormattingToolbar.Button>
      </Components.Generic.Menu.Trigger>
      <Components.Generic.Menu.Dropdown className="bn-menu-dropdown bn-drag-handle-menu">
        <AIMenuItem action="prompt" docId={doc.id} icon={<Text $isMaterialIcon $size="s">text_fields</Text>}>
          {t('Use as prompt')}
        </AIMenuItem>
        <AIMenuItem action="rephrase" docId={doc.id} icon={<Text $isMaterialIcon $size="s">refresh</Text>}>
          {t('Rephrase')}
        </AIMenuItem>
        <AIMenuItem action="summarize" docId={doc.id} icon={<Text $isMaterialIcon $size="s">summarize</Text>}>
          {t('Summarize')}
        </AIMenuItem>
        <AIMenuItem action="correct" docId={doc.id} icon={<Text $isMaterialIcon $size="s">check</Text>}>
          {t('Correct')}
        </AIMenuItem>
        <TranslateMenu docId={doc.id} />
      </Components.Generic.Menu.Dropdown>
    </Components.Generic.Menu.Root>
  );
}

interface AIMenuItemProps {
  action: AIActions;
  docId: Doc['id'];
  children: ReactNode;
  icon: ReactNode;
}

const AIMenuItem = ({ action, docId, children, icon }: AIMenuItemProps) => {
  const editor = useBlockNoteEditor();
  const Components = useComponentsContext()!;
  const { mutateAsync: requestAI, isPending } = useAIRewrite();

  const handleAIAction = useCallback(async () => {
    const selectedBlocks = editor.getSelection()?.blocks;

    if (!selectedBlocks || selectedBlocks.length === 0) {
      return;
    }

    const markdown = await editor.blocksToMarkdownLossy(selectedBlocks);
    const newText = await requestAI({
      docId,
      text: markdown,
      action,
    });

    const blockMarkdown = await editor.tryParseMarkdownToBlocks(newText);
    editor.replaceBlocks(selectedBlocks, blockMarkdown);
  }, [editor, requestAI, docId, action]);

  return (
    <Components.Generic.Menu.Item
      closeMenuOnClick={false}
      icon={icon}
      onClick={handleAIAction}
      rightSection={isPending && <Box className="loader" />}
    >
      {children}
    </Components.Generic.Menu.Item>
  );
};

interface TranslateMenuProps {
  docId: Doc['id'];
}

const TranslateMenu = ({ docId }: TranslateMenuProps) => {
  const Components = useComponentsContext()!;
  const { t } = useTranslation();

  return (
    <SubMenu position="right" sub={true} icon={<Text $isMaterialIcon $size="s">translate</Text>} close>
      <Components.Generic.Menu.Trigger sub={true}>
        <Components.Generic.Menu.Item subTrigger={true}>
          {t('Translate')}
        </Components.Generic.Menu.Item>
      </Components.Generic.Menu.Trigger>
      <Components.Generic.Menu.Dropdown className="bn-menu-dropdown bn-color-picker-dropdown">
        <AIMenuItem action="translate_en" docId={docId}>
          {t('English')}
        </AIMenuItem>
        <AIMenuItem action="translate_fr" docId={docId}>
          {t('French')}
        </AIMenuItem>
        <AIMenuItem action="translate_de" docId={docId}>
          {t('German')}
        </AIMenuItem>
      </Components.Generic.Menu.Dropdown>
    </SubMenu>
  );
};

const SubMenuContext = createContext<
  | {
      onMenuMouseOver: () => void;
      onMenuMouseLeave: () => void;
    }
  | undefined
>(undefined);


const SubMenu = forwardRef<
  HTMLButtonElement,
  ComponentProps["Generic"]["Menu"]["Root"]
>((props, ref) => {
  const {
    children,
    onOpenChange,
    position,
    icon,
    sub, // not used
    ...rest
  } = props;

  const [opened, setOpened] = useState(false);

  const itemRef = useRef<HTMLButtonElement | null>(null);

  const menuCloseTimer = useRef<ReturnType<typeof setTimeout> | undefined>();

  const mouseLeave = useCallback(() => {
    if (menuCloseTimer.current) {
      clearTimeout(menuCloseTimer.current);
    }
    menuCloseTimer.current = setTimeout(() => {
      setOpened(false);
    }, 250);
  }, []);

  const mouseOver = useCallback(() => {
    if (menuCloseTimer.current) {
      clearTimeout(menuCloseTimer.current);
    }
    setOpened(true);
  }, []);

  return (
    <SubMenuContext.Provider
      value={{
        onMenuMouseOver: mouseOver,
        onMenuMouseLeave: mouseLeave,
      }}>
      <MantineMenu.Item
        className="bn-menu-item bn-mt-sub-menu-item"
        closeMenuOnClick={false}
        ref={mergeRefs(ref, itemRef)}
        onMouseOver={mouseOver}
        onMouseLeave={mouseLeave}
        leftSection={icon}>
        <MantineMenu
          portalProps={{
            target: itemRef.current
              ? itemRef.current.parentElement!
              : undefined,
          }}
          middlewares={{ flip: true, shift: true, inline: false, size: true }}
          trigger={"hover"}
          opened={opened}
          onClose={() => onOpenChange?.(false)}
          onOpen={() => onOpenChange?.(true)}
          position={position}>
          {children}
        </MantineMenu>
      </MantineMenu.Item>
    </SubMenuContext.Provider>
  );
});