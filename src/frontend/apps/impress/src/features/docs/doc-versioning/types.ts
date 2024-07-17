import { Doc } from '../doc-management';

export interface Versions {
  etag: string;
  is_latest: boolean;
  last_modified: string;
  version_id: string;
}

export interface Version {
  content: Doc['content'];
  last_modified: string;
}
