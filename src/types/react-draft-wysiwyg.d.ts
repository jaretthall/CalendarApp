declare module 'react-draft-wysiwyg' {
  import { Component } from 'react';
  import { EditorState } from 'draft-js';
  
  export interface EditorProps {
    editorState?: EditorState;
    onEditorStateChange?: (editorState: EditorState) => void;
    onContentStateChange?: (contentState: any) => void;
    defaultEditorState?: EditorState;
    defaultContentState?: any;
    toolbarClassName?: string;
    wrapperClassName?: string;
    editorClassName?: string;
    toolbar?: any;
    toolbarOnFocus?: boolean;
    toolbarHidden?: boolean;
    locale?: any;
    localization?: any;
    placeholder?: string;
    textAlignment?: string;
    readOnly?: boolean;
    spellCheck?: boolean;
    tabIndex?: number;
    ariaLabel?: string;
    ariaOwneeID?: string;
    ariaActiveDescendantID?: string;
    ariaAutoComplete?: string;
    ariaDescribedBy?: string;
    ariaExpanded?: boolean;
    ariaHasPopup?: boolean;
    customBlockRenderFunc?: any;
    customDecorators?: any[];
    handleKeyCommand?: Function;
    handlePastedText?: Function;
    handleReturn?: Function;
    handlePastedFiles?: Function;
    handleDroppedFiles?: Function;
    handleDrop?: Function;
    onFocus?: Function;
    onBlur?: Function;
    onTab?: Function;
    onEscape?: Function;
    stripPastedStyles?: boolean;
    mentionClassName?: string;
    hashtag?: any;
    [key: string]: any;
  }
  
  export class Editor extends Component<EditorProps> {}
} 