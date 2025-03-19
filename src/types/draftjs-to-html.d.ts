declare module 'draftjs-to-html' {
  import { RawDraftContentState } from 'draft-js';
  
  export default function draftToHtml(
    contentState: RawDraftContentState,
    hashConfig?: any,
    directional?: boolean,
    customEntityTransform?: (entity: any, text: string) => string
  ): string;
} 