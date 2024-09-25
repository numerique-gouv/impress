import { Text, TextType } from '@/components';
import { useCunninghamTheme } from '@/cunningham';

interface IconBGProps extends TextType {
  iconName: string;
}

export const IconBG = ({ iconName, ...textProps }: IconBGProps) => {
  const { colorsTokens } = useCunninghamTheme();

  return (
    <Text
      $isMaterialIcon
      $size="36px"
      $theme="primary"
      $background={colorsTokens()['primary-bg']}
      $css={`border: 1px solid ${colorsTokens()['primary-200']}`}
      $radius="12px"
      $padding="4px"
      $margin="auto"
      {...textProps}
    >
      {iconName}
    </Text>
  );
};

interface IconOptionsProps {
  isOpen: boolean;
  'aria-label': string;
}

export const IconOptions = ({ isOpen, ...props }: IconOptionsProps) => {
  return (
    <Text
      aria-label={props['aria-label']}
      $isMaterialIcon
      $css={`
        transition: all 0.3s ease-in-out;
        transform: rotate(${isOpen ? '90' : '0'}deg);
      `}
      $theme="primary"
    >
      more_vert
    </Text>
  );
};
