import Image from 'next/image';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { default as IconDevise } from '@/assets/icons/icon-devise.svg?url';
import { default as IconMarianne } from '@/assets/icons/icon-marianne.svg?url';

import { Box } from './Box';
import { Text, TextType } from './Text';

interface LogoGouvProps {
  imagesWidth?: number;
  textProps?: TextType;
}

const LogoGouv = ({ imagesWidth, textProps }: LogoGouvProps) => {
  const { t } = useTranslation();

  return (
    <Box>
      <Box>
        <Image
          priority
          src={IconMarianne}
          alt={t('Marianne Logo')}
          width={imagesWidth}
        />
      </Box>
      <Text $weight="bold" $size="1.3rem" {...textProps}>
        Gouvernement
      </Text>
      <Image
        width={imagesWidth}
        priority
        src={IconDevise}
        alt={t('Freedom Equality Fraternity Logo')}
      />
    </Box>
  );
};

export default LogoGouv;
