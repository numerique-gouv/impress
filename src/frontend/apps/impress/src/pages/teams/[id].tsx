import { Loader } from '@openfun/cunningham-react';
import { useRouter as useNavigate } from 'next/navigation';
import { useRouter } from 'next/router';
import { ReactElement } from 'react';

import { Box } from '@/components';
import { TextErrors } from '@/components/TextErrors';
import { MemberGrid } from '@/features/members';
import { Role, TeamInfo, TeamLayout, useTeam } from '@/features/teams/';
import { NextPageWithLayout } from '@/types/next';

const Page: NextPageWithLayout = () => {
  const {
    query: { id },
  } = useRouter();

  if (typeof id !== 'string') {
    throw new Error('Invalid team id');
  }

  return <Team id={id} />;
};

interface TeamProps {
  id: string;
}

const Team = ({ id }: TeamProps) => {
  const { data: team, isLoading, isError, error } = useTeam({ id });
  const navigate = useNavigate();

  if (isError && error) {
    if (error.status === 404) {
      navigate.replace(`/404`);
      return null;
    }

    return <TextErrors causes={error.cause} />;
  }

  if (isLoading || !team) {
    return (
      <Box $align="center" $justify="center" $height="100%">
        <Loader />
      </Box>
    );
  }

  const currentRole = team.abilities.delete
    ? Role.OWNER
    : team.abilities.manage_accesses
      ? Role.ADMIN
      : Role.MEMBER;

  return (
    <>
      <TeamInfo team={team} currentRole={currentRole} />
      <MemberGrid team={team} currentRole={currentRole} />
    </>
  );
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <TeamLayout>{page}</TeamLayout>;
};

export default Page;
