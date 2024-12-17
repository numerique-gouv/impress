import {
  Radio,
  RadioGroup,
  Select,
  VariantType,
  useToastProvider,
} from '@openfun/cunningham-react';
import { useTranslation } from 'react-i18next';

import { Box, Card, IconBG } from '@/components';
import { useCunninghamTheme } from '@/cunningham';

import { KEY_DOC, KEY_LIST_DOC, useUpdateDocLink } from '../api';
import { Doc, LinkReach, LinkRole } from '../types';

interface DocVisibilityProps {
  doc: Doc;
}

export const DocVisibility = ({ doc }: DocVisibilityProps) => {
  const { t } = useTranslation();
  const { toast } = useToastProvider();
  const { colorsTokens } = useCunninghamTheme();
  const api = useUpdateDocLink({
    onSuccess: () => {
      toast(
        t('The document visibility has been updated.'),
        VariantType.SUCCESS,
        {
          duration: 4000,
        },
      );
    },
    listInvalidQueries: [KEY_LIST_DOC, KEY_DOC],
  });

  const transLinkReach = {
    [LinkReach.RESTRICTED]: {
      label: t('Restricted'),
      description: t('Only for people with access'),
    },
    [LinkReach.AUTHENTICATED]: {
      label: t('Authenticated'),
      description: t('Only for authenticated users'),
    },
    [LinkReach.PUBLIC]: {
      label: t('Public'),
      description: t('Anyone on the internet with the link can view'),
    },
  };

  const linkRoleList = [
    {
      label: t('Read only'),
      value: LinkRole.READER,
    },
    {
      label: t('Can read and edit'),
      value: LinkRole.EDITOR,
    },
  ];

  const showLinkRoleOptions = doc.link_reach !== LinkReach.RESTRICTED;

  return (
    <Card
      $margin="tiny"
      $padding={{ horizontal: 'small', vertical: 'tiny' }}
      aria-label={t('Doc visibility card')}
      $direction="row"
      $align="center"
      $justify="space-between"
      $gap="1rem"
      $wrap="wrap"
    >
      <IconBG iconName="public" />
      <Box
        $wrap="wrap"
        $gap="1rem"
        $direction="row"
        $align="center"
        $flex="1"
        $css={`
          & .c__field__footer .c__field__text {
            ${!doc.abilities.link_configuration && `color: ${colorsTokens()['greyscale-400']};`};
          }
        `}
      >
        <Box $shrink="0" $flex="auto" $maxWidth="20rem">
          <Select
            label={t('Visibility')}
            options={Object.values(LinkReach).map((linkReach) => ({
              label: transLinkReach[linkReach].label,
              value: linkReach,
            }))}
            onChange={(evt) =>
              api.mutate({
                link_reach: evt.target.value as LinkReach,
                id: doc.id,
              })
            }
            value={doc.link_reach}
            clearable={false}
            text={transLinkReach[doc.link_reach].description}
            disabled={!doc.abilities.link_configuration}
          />
        </Box>
        {showLinkRoleOptions && (
          <Box
            $css={`
              & .c__checkbox{
                padding: 0.15rem 0.25rem;
              }
            `}
          >
            <RadioGroup
              compact
              style={{
                display: 'flex',
              }}
              text={t('How people can interact with the document')}
            >
              {linkRoleList.map((radio) => (
                <Radio
                  key={radio.value}
                  label={radio.label}
                  value={radio.value}
                  onChange={() =>
                    api.mutate({
                      link_role: radio.value,
                      id: doc.id,
                    })
                  }
                  checked={doc.link_role === radio.value}
                  disabled={!doc.abilities.link_configuration}
                />
              ))}
            </RadioGroup>
          </Box>
        )}
      </Box>
    </Card>
  );
};
