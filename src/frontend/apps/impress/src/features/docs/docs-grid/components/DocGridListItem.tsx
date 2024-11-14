import { Doc } from '../../doc-management';
import { SimpleDocItem } from '../../doc-management/components/items/SimpleDocItem';

type Props = {
  doc: Doc;
};

export const DocGridListItem = ({ doc }: Props) => {
  return (
    <div>
      <SimpleDocItem doc={doc} />
    </div>
  );
};
