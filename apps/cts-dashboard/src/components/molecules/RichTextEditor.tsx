import React, { useRef, useState, useEffect, type ChangeEvent } from 'react';

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value = '',
  onChange,
  placeholder = 'Start typing...',
  minHeight = '200px',
  className = '',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState<string>('3'); // default medium
  const [textColor, setTextColor] = useState<string>('#000000');

  // Sync external value into the editor
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const exec = (command: string, commandValue?: string) => {
    document.execCommand(command, false, commandValue);
    editorRef.current?.focus();
    triggerChange();
  };

  const triggerChange = () => {
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    triggerChange();
  };

  const handleFontSizeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const size = e.target.value;
    setFontSize(size);
    exec('fontSize', size); // values 1-7
  };

  const handleColorChange = (e: ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setTextColor(color);
    exec('foreColor', color);
  };

  // Toolbar button style
  const btnClass =
    'w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 text-sm font-medium text-gray-700 transition-colors';

  return (
    <div
      className={`border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm ${className}`}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        {/* Bold */}
        <button
          type="button"
          onClick={() => exec('bold')}
          className={btnClass}
          title="Bold"
        >
          <strong>B</strong>
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => exec('italic')}
          className={btnClass}
          title="Italic"
        >
          <em>I</em>
        </button>

        {/* Underline */}
        <button
          type="button"
          onClick={() => exec('underline')}
          className={btnClass}
          title="Underline"
        >
          <span className="underline">U</span>
        </button>

        {/* Strikethrough */}
        <button
          type="button"
          onClick={() => exec('strikeThrough')}
          className={btnClass}
          title="Strikethrough"
        >
          <span className="line-through">S</span>
        </button>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Superscript */}
        <button
          type="button"
          onClick={() => exec('superscript')}
          className={btnClass}
          title="Superscript"
        >
          X<sup>2</sup>
        </button>

        {/* Subscript */}
        <button
          type="button"
          onClick={() => exec('subscript')}
          className={btnClass}
          title="Subscript"
        >
          X<sub>2</sub>
        </button>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Font Size */}
        <select
          value={fontSize}
          onChange={handleFontSizeChange}
          className="h-8 px-2 text-sm border border-gray-300 rounded bg-white"
          title="Font size"
        >
          <option value="1">10</option>
          <option value="2">13</option>
          <option value="3">16</option>
          <option value="4">18</option>
          <option value="5">24</option>
          <option value="6">32</option>
          <option value="7">48</option>
        </select>

        {/* Text Color */}
        <div className="relative">
          <button
            type="button"
            className={`${btnClass} relative`}
            title="Text color"
            style={{
              backgroundColor: textColor === '#000000' ? '#fef08a' : undefined,
            }}
          >
            <span className="font-bold" style={{ color: textColor }}>
              A
            </span>
            <input
              type="color"
              value={textColor}
              onChange={handleColorChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </button>
        </div>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Align Left */}
        <button
          type="button"
          onClick={() => exec('justifyLeft')}
          className={btnClass}
          title="Align left"
        >
          ≡
        </button>

        {/* Align Center */}
        <button
          type="button"
          onClick={() => exec('justifyCenter')}
          className={btnClass}
          title="Align center"
        >
          ≡
        </button>

        {/* Align Right */}
        <button
          type="button"
          onClick={() => exec('justifyRight')}
          className={btnClass}
          title="Align right"
        >
          ≡
        </button>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Ordered List */}
        <button
          type="button"
          onClick={() => exec('insertOrderedList')}
          className={btnClass}
          title="Numbered list"
        >
          1.
        </button>

        {/* Unordered List */}
        <button
          type="button"
          onClick={() => exec('insertUnorderedList')}
          className={btnClass}
          title="Bullet list"
        >
          •
        </button>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Clear Formatting */}
        <button
          type="button"
          onClick={() => exec('removeFormat')}
          className={btnClass}
          title="Clear formatting"
        >
          Tₓ
        </button>
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="p-4 outline-none prose max-w-none"
        style={{ minHeight }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      {/* Placeholder styling */}
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          display: block;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;