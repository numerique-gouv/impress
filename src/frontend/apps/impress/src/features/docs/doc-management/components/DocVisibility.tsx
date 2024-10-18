import {
  Radio,
  RadioGroup,
  Select,
  VariantType,
  useToastProvider,
} from '@openfun/cunningham-react';
import { useTranslation } from 'react-i18next';

import { Box, Card, IconBG } from '@/components';

import { KEY_DOC, KEY_LIST_DOC, useUpdateDocLink } from '../api';
import { useTrans } from '../hooks';
import { Doc, LinkReach } from '../types';

interface DocVisibilityProps {
  doc: Doc;
}

export const DocVisibility = ({ doc }: DocVisibilityProps) => {
  const { t } = useTranslation();
  const { transLinkReach } = useTrans();
  const { toast } = useToastProvider();
  const api = useUpdateDocLink({
    onSuccess: () => {
      toast(
        t('The document visiblitity has been updated.'),
        VariantType.SUCCESS,
        {
          duration: 4000,
        },
      );
    },
    listInvalideQueries: [KEY_LIST_DOC, KEY_DOC],
  });

  return (
    <Card
      $margin="tiny"
      $padding={{ horizontal: 'small', vertical: 'tiny' }}
      aria-label={t('Doc visibility card')}
      $direction="row"
      $align="center"
      $justify="space-between"
      $gap="1rem"
    >
      <IconBG iconName="public" $margin="none" />
      <Box
        $width="100%"
        $wrap="wrap"
        $gap="1rem"
        $direction="row"
        $align="center"
      >
        <Box
          $shrink="0"
          $css={`
              & .c__field__footer .c__field__text {
                ${!doc.abilities.link_configuration && 'color: #cacaca;'};
              }
            `}
        >
          <Select
            label={t('Visibility')}
            options={Object.values(LinkReach).map((linkReach) => ({
              label: transLinkReach(linkReach).label,
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
            text={transLinkReach(doc.link_reach).help}
            disabled={!doc.abilities.link_configuration}
          />
        </Box>
        {(doc.link_reach === LinkReach.AUTHENTICATED ||
          doc.link_reach === LinkReach.PUBLIC) && (
          <Box
            $css={`
              & .c__field__footer .c__field__text {
                ${!doc.abilities.link_configuration && 'color: #cacaca;'};
              }
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
              text="How people can interact with the document"
            >
              {[
                {
                  label: t('Can view'),
                  value: 'reader',
                },
                {
                  label: t('Can view and edit'),
                  value: 'editor',
                },
              ].map((radio) => (
                <Radio
                  key={radio.value}
                  label={radio.label}
                  value={radio.value}
                  onChange={() =>
                    api.mutate({
                      link_role: radio.value as Doc['link_role'],
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
