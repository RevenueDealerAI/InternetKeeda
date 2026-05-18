import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';

interface TipTapViewerProps {
  content: string;
}

export default function TipTapViewer({ content }: TipTapViewerProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-blue-600 hover:underline cursor-pointer',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
    ],
    content,
    editable: false,
  });

  if (!editor) {
    return null;
  }

  return (
    <EditorContent
      editor={editor}
      className="prose prose-lg max-w-none"
    />
  );
} 