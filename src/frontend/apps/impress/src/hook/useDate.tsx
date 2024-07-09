import { DateTime, DateTimeFormatOptions } from 'luxon';
import { useTranslation } from 'react-i18next';

const format: DateTimeFormatOptions = {
  month: '2-digit',
  day: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

export const useDate = () => {
  const { i18n } = useTranslation();

  const formatDate = (date: string): string => {
    return DateTime.fromISO(date)
      .setLocale(i18n.language)
      .toLocaleString(format);
  };

  return { formatDate };
};
