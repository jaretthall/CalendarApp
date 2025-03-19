import React, { useState, useEffect } from 'react';
import { EditorState, convertToRaw, ContentState } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { Box, Paper } from '@mui/material';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  height?: number | string;
  toolbarHidden?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  readOnly = false,
  placeholder = 'Enter text here...',
  height = 200,
  toolbarHidden = false
}) => {
  const [editorState, setEditorState] = useState(() => {
    try {
      if (content) {
        const blocksFromHtml = htmlToDraft(content);
        if (blocksFromHtml) {
          const { contentBlocks, entityMap } = blocksFromHtml;
          const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
          return EditorState.createWithContent(contentState);
        }
      }
    } catch (error) {
      console.error('Error converting HTML to Draft.js state:', error);
    }
    return EditorState.createEmpty();
  });

  useEffect(() => {
    try {
      if (content && !editorState.getCurrentContent().hasText()) {
        const blocksFromHtml = htmlToDraft(content);
        if (blocksFromHtml) {
          const { contentBlocks, entityMap } = blocksFromHtml;
          const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
          setEditorState(EditorState.createWithContent(contentState));
        }
      }
    } catch (error) {
      console.error('Error updating Draft.js content:', error);
    }
  }, [content, editorState]);

  const handleEditorChange = (state: EditorState) => {
    setEditorState(state);
    try {
      const htmlContent = draftToHtml(convertToRaw(state.getCurrentContent()));
      onChange(htmlContent);
    } catch (error) {
      console.error('Error converting Draft.js state to HTML:', error);
    }
  };

  const toolbarOptions = {
    options: ['inline', 'blockType', 'list', 'textAlign', 'colorPicker', 'link', 'history'],
    inline: {
      options: ['bold', 'italic', 'underline', 'strikethrough'],
    },
    blockType: {
      options: ['Normal', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'],
    },
    list: {
      options: ['unordered', 'ordered'],
    },
    textAlign: {
      options: ['left', 'center', 'right'],
    },
  };

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Box
        sx={{
          '.rdw-editor-toolbar': {
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            padding: '8px',
            display: toolbarHidden ? 'none' : 'flex',
            borderBottom: '1px solid #ccc',
          },
          '.rdw-editor-main': {
            padding: '0 12px',
            height: typeof height === 'number' ? `${height}px` : height,
            overflowY: 'auto',
          },
          '.public-DraftStyleDefault-block': {
            margin: '8px 0',
          }
        }}
      >
        <Editor
          editorState={editorState}
          onEditorStateChange={handleEditorChange}
          readOnly={readOnly}
          placeholder={placeholder}
          toolbar={toolbarOptions}
          toolbarHidden={toolbarHidden}
        />
      </Box>
    </Paper>
  );
};

export default RichTextEditor; 