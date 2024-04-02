import { Input, Loader } from '@openfun/cunningham-react';
import { useEffect, useState } from 'react';

import { APIError } from '@/api';
import { Box, TextErrors } from '@/components';

interface InputTeamNameProps {
  error: APIError | null;
  isError: boolean;
  isPending: boolean;
  label: string;
  setTeamName: (newTeamName: string) => void;
  defaultValue?: string;
}

export const InputTeamName = ({
  defaultValue,
  error,
  isError,
  isPending,
  label,
  setTeamName,
}: InputTeamNameProps) => {
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
          setTeamName(e.target.value);
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
