import { Input, Loader } from '@openfun/cunningham-react';
import { useEffect, useState } from 'react';

import { APIError } from '@/api';
import { Box, TextErrors } from '@/components';

interface InputDocNameProps {
  error: APIError | null;
  isError: boolean;
  isPending: boolean;
  label: string;
  setDocName: (newDocName: string) => void;
  defaultValue?: string;
}

export const InputDocName = ({
  defaultValue,
  error,
  isError,
  isPending,
  label,
  setDocName,
}: InputDocNameProps) => {
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
          setDocName(e.target.value);
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
