export interface DocAttachment {
  file: string;
}

export type HeadingBlock = {
  id: string;
  type: string;
  text: string;
  content: HeadingBlock[];
  contentText: string;
  props: {
    level: number;
  };
};
