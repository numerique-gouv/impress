import { Text } from '@/components';

interface IconOptionsProps {
  isOpen: boolean;
  'aria-label': string;
}

export const IconOptions = ({ isOpen, ...props }: IconOptionsProps) => {
  return (
    <Text
      aria-label={props['aria-label']}
      className="material-icons"
      $theme="primary"
      $css={`
        transition: all 0.3s ease-in-out;
        transform: rotate(${isOpen ? '90' : '0'}deg);
      `}
    >
      more_vert
    </Text>
  );
};
