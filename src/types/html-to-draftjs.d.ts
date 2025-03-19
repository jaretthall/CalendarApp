declare module 'html-to-draftjs' {
  interface ContentBlock {
    contentBlocks: any[];
    entityMap: any;
  }
  
  export default function htmlToDraft(
    htmlContent: string,
    blockType?: string
  ): ContentBlock;
} 