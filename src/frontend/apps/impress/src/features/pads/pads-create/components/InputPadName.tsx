import { Input, Loader } from '@openfun/cunningham-react';
import { useEffect, useState } from 'react';

import { APIError } from '@/api';
import { Box, TextErrors } from '@/components';

interface InputPadNameProps {
  error: APIError | null;
  isError: boolean;
  isPending: boolean;
  label: string;
  setPadName: (newPadName: string) => void;
  defaultValue?: string;
}

export const InputPadName = ({
  defaultValue,
  error,
  isError,
  isPending,
  label,
  setPadName,
}: InputPadNameProps) => {
  const [isInputError, setIsInputError] = useState(isError);

  useEffect(() => {
    if (isError) {
      setIsInputError(true);
    }
  }, [isError]);

  return (
    <>
      <Input
        fullWidth
        type="text"
        label={label}
        defaultValue={defaultValue}
        onChange={(e) => {
          setPadName(e.target.value);
          setIsInputError(false);
        }}
        rightIcon={<span className="material-icons">edit</span>}
        state={isInputError ? 'error' : 'default'}
      />
      {isError && error && <TextErrors causes={error.cause} />}
      {isPending && (
        <Box $align="center">
          <Loader />
        </Box>
      )}
    </>
  );
};
