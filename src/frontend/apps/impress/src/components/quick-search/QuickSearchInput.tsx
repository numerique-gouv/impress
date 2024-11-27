import { Loader } from '@openfun/cunningham-react';
import { Command } from 'cmdk';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { HorizontalSeparator } from '@/components/separators/HorizontalSeparator';
import { useCunninghamTheme } from '@/cunningham';

import { Box } from '../Box';
import { Icon } from '../Icon';

type Props = {
  loading?: boolean;
  inputValue?: string;
  onFilter?: (str: string) => void;
  placeholder?: string;
  children?: ReactNode;
};
export const QuickSearchInput = ({
  loading,
  inputValue,
  onFilter,
  placeholder,
  children,
}: Props) => {
  const { t } = useTranslation();
  const { spacingsTokens } = useCunninghamTheme();
  const spacing = spacingsTokens();

  if (children) {
    return (
      <>
        {children}
        <HorizontalSeparator />
      </>
    );
  }

  return (
    <>
      <Box
        $direction="row"
        $align="center"
        $gap={spacing['2xs']}
        $padding={{ horizontal: 'base' }}
      >
        {!loading && <Icon iconName="search" $variation="400" />}
        {loading && (
          <div>
            <Loader size="small" />
          </div>
        )}
        <Command.Input
          /* eslint-disable-next-line jsx-a11y/no-autofocus */
          autoFocus={true}
          value={inputValue}
          placeholder={placeholder ?? t('Search')}
          onValueChange={onFilter}
        />
      </Box>
      <HorizontalSeparator />
    </>
  );
};
