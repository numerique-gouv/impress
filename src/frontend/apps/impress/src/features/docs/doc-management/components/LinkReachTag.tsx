import { Text } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import { ColorsTokens } from '@/cunningham/useCunninghamTheme';

import { useTrans } from '../hooks';
import { LinkReach } from '../types';

interface LinkReachTagProps {
  linkReach: LinkReach;
}

export const LinkReachTag = ({ linkReach }: LinkReachTagProps) => {
  const { colorsTokens } = useCunninghamTheme();
  const { transLinkReach } = useTrans();

  return (
    <Text
      $weight="bold"
      $background={
        colorsTokens()[`link-reach-${linkReach}` as keyof ColorsTokens]
      }
      $color="white"
      $padding="xtiny"
      $radius="3px"
      $width="fit-content"
    >
      {transLinkReach(linkReach).label}
    </Text>
  );
};
