import { Alert, VariantType } from '@openfun/cunningham-react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Text, TextType } from '@/components';

interface TextErrorsProps extends TextType {
  causes?: string[];
  defaultMessage?: string;
  icon?: ReactNode;
}

export const TextErrors = ({
  causes,
  defaultMessage,
  icon,
  ...textProps
}: TextErrorsProps) => {
  const { t } = useTranslation();

  return (
    <Alert canClose={false} type={VariantType.ERROR} icon={icon}>
      <Box $direction="column" $gap="0.2rem">
        {causes &&
          causes.map((cause, i) => (
            <Text
              key={`causes-${i}`}
              $theme="danger"
              $textAlign="center"
              {...textProps}
            >
              {cause}
            </Text>
          ))}

        {!causes && (
          <Text $theme="danger" $textAlign="center" {...textProps}>
            {defaultMessage || t('Something bad happens, please retry.')}
          </Text>
        )}
      </Box>
    </Alert>
  );
};
