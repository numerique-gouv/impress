import { useTranslation } from 'react-i18next';

import { Box, Text, TextType } from '@/components';

interface TextErrorsProps extends TextType {
  causes?: string[];
  defaultMessage?: string;
}

export const TextErrors = ({
  causes,
  defaultMessage,
  ...textProps
}: TextErrorsProps) => {
  const { t } = useTranslation();

  return (
    <Box>
      {causes &&
        causes.map((cause, i) => (
          <Text
            key={`causes-${i}`}
            $margin={{ top: 'small' }}
            $theme="danger"
            $textAlign="center"
            {...textProps}
          >
            {cause}
          </Text>
        ))}

      {!causes && (
        <Text
          $margin={{ top: 'small' }}
          $theme="danger"
          $textAlign="center"
          {...textProps}
        >
          {defaultMessage || t('Something bad happens, please retry.')}
        </Text>
      )}
    </Box>
  );
};
