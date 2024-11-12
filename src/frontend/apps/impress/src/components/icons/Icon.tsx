import * as React from 'react';

type Props = {
  icon: string;
  className?: string;
};
export const Icon = ({ icon, className }: Props) => {
  return <span className={`material-icons ${className}`}>{icon}</span>;
};
