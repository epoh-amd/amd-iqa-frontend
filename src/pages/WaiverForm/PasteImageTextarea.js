import React from 'react';
import ReactDOM from 'react-dom';
import api from '../../services/api';

const HANDLE_SIZE = 8;
const HANDLES = [
  { dir: 'nw', yFrac: 0,   xFrac: 0,   cursor: 'nw-resize' },
  { dir: 'n',  yFrac: 0,   xFrac: 0.5, cursor: 'n-resize'  },
  { dir: 'ne', yFrac: 0,   xFrac: 1,   cursor: 'ne-resize' },
  { dir: 'e',  yFrac: 0.5, xFrac: 1,   cursor: 'e-resize'  },
  { dir: 'se', yFrac: 1,   xFrac: 1,   cursor: 'se-resize' },
  { dir: 's',  yFrac: 1,   xFrac: 0.5, cursor: 's-resize'  },
  { dir: 'sw', yFrac: 1,   xFrac: 0,   cursor: 'sw-resize' },
  { dir: 'w',  yFrac: 0.5, xFrac: 0,   cursor: 'w-resize'  },
];

const PasteImageTextarea = ({ value, onChange, toFileUrl, placeholder, style = {}, className }) => {
  const editorRef = React.useRef(null);
  const lastEmitted = React.useRef(value || '');
  const [empty, setEmpty] = React.useState(!value);

  // Resize overlay state
  const selImgRef = React.useRef(null);
  const dragRef = React.useRef(null);
  const [handleBox, setHandleBox] = React.useState(null); // viewport-relative rect

  // ── Init / sync ─────────────────────────────────────────────────────────────
  React.useLayoutEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = value || '';
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (editorRef.current && value !== lastEmitted.current) {
      editorRef.current.innerHTML = value || '';
      lastEmitted.current = value || '';
      setEmpty(!value);
    }
  }, [value]);

  const notify = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const isNowEmpty = html === '' || html === '<br>';
    setEmpty(isNowEmpty);
    const next = isNowEmpty ? '' : html;
    lastEmitted.current = next;
    onChange?.({ target: { value: next } });
  };

  // ── Image selection ──────────────────────────────────────────────────────────
  const updateHandleBox = (img) => {
    const r = img.getBoundingClientRect();
    setHandleBox({ top: r.top, left: r.left, width: r.width, height: r.height });
  };

  const selectImage = (img) => {
    selImgRef.current = img;
    updateHandleBox(img);
  };

  const clearSelection = () => {
    selImgRef.current = null;
    setHandleBox(null);
  };

  const handleEditorClick = (e) => {
    if (e.target.tagName === 'IMG') selectImage(e.target);
    else clearSelection();
  };

  // Dismiss when clicking outside the editor or handles
  React.useEffect(() => {
    const onDown = (e) => {
      const inEditor = editorRef.current?.contains(e.target);
      const onHandle = e.target.closest?.('[data-resize-handle]');
      if (!inEditor && !onHandle) clearSelection();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // Keep handles aligned when page scrolls
  React.useEffect(() => {
    const onScroll = () => { if (selImgRef.current) updateHandleBox(selImgRef.current); };
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, []);

  // ── Drag-to-resize ───────────────────────────────────────────────────────────
  const startResize = (e, dir) => {
    e.preventDefault();
    e.stopPropagation();
    const img = selImgRef.current;
    if (!img) return;
    const r = img.getBoundingClientRect();
    dragRef.current = { dir, startX: e.clientX, startY: e.clientY, startW: r.width, startH: r.height };
    document.body.style.userSelect = 'none';

    const onMove = (me) => {
      const { dir, startX, startY, startW, startH } = dragRef.current;
      const dx = me.clientX - startX;
      const dy = me.clientY - startY;
      let w = startW, h = startH;
      if (dir.includes('e')) w = Math.max(50, startW + dx);
      if (dir.includes('w')) w = Math.max(50, startW - dx);
      if (dir.includes('s')) h = Math.max(50, startH + dy);
      if (dir.includes('n')) h = Math.max(50, startH - dy);
      img.style.width = `${Math.round(w)}px`;
      img.style.height = `${Math.round(h)}px`;
      updateHandleBox(img);
    };

    const onUp = () => {
      dragRef.current = null;
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      notify();
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // ── Paste ────────────────────────────────────────────────────────────────────
  // Strip all inline styles from pasted HTML — browser adds font-family, color, background etc from source element
  const stripInlineStyles = (node) => {
    if (node.nodeType === 1) {
      node.removeAttribute('style');
      node.removeAttribute('class');
      node.removeAttribute('id');
      Array.from(node.childNodes).forEach(stripInlineStyles);
    }
  };

  const handlePaste = (e) => {
    // Check for image in clipboard first — if found, handle image only and skip HTML paste
    if (e.clipboardData && e.clipboardData.items) {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const blob = items[i].getAsFile();
          if (!blob) continue;

          const URLObj = window.URL || window.webkitURL;
          const blobUrl = URLObj.createObjectURL(blob);

          const sel = window.getSelection();
          const savedRange = sel?.rangeCount ? sel.getRangeAt(0).cloneRange() : null;

          const image = new Image();
          image.style.cssText = 'max-width:100%;display:block;margin:4px 0;border-radius:3px;cursor:pointer;';

          image.onload = async () => {
            if (!editorRef.current) return;
            if (savedRange && editorRef.current.contains(savedRange.commonAncestorContainer)) {
              savedRange.deleteContents();
              savedRange.insertNode(image);
              savedRange.setStartAfter(image);
              savedRange.collapse(true);
              if (sel) { sel.removeAllRanges(); sel.addRange(savedRange); }
            } else {
              editorRef.current.appendChild(image);
            }
            notify();

            // Upload in background; only swap src once server URL confirmed loadable
            try {
              const ext = blob.type.split('/')[1] || 'png';
              const fd = new FormData();
              fd.append('file', new File([blob], `pasted-image.${ext}`, { type: blob.type }));
              const res = await api.uploadDraft(fd);
              image.dataset.filePath = res.filePath;
              const serverUrl = toFileUrl ? toFileUrl(res.filePath) : res.filePath;
              const probe = new Image();
              probe.onload = () => { image.src = serverUrl; URLObj.revokeObjectURL(blobUrl); notify(); };
              probe.src = serverUrl;
            } catch (err) {
              console.error('Paste image upload failed:', err);
            }
          };

          image.src = blobUrl;
          return; // image handled — skip HTML paste below
        }
      }
    }

    // For HTML text paste — strip background-color silently added by browser from source element styling
    const html = e.clipboardData?.getData('text/html');
    if (html) {
      e.preventDefault();
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      stripInlineStyles(tmp);

      // Remove comment nodes and empty block elements browsers add around clipboard content
      const isEmptyBlock = (n) =>
        n.nodeType === 8 || // comment node (<!--StartFragment--> etc)
        (n.nodeType === 1 && ['P','DIV','SPAN'].includes(n.tagName) && !n.textContent.trim() && !n.querySelector('img,table,br'));
      const nodes = Array.from(tmp.childNodes).filter(n => !isEmptyBlock(n));

      const sel = window.getSelection();
      if (sel?.rangeCount) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const frag = document.createDocumentFragment();
        nodes.forEach(n => frag.appendChild(n));
        range.insertNode(frag);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      } else if (editorRef.current) {
        nodes.forEach(n => editorRef.current.appendChild(n));
      }
      notify();
      return;
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  const { marginBottom, flex, width, ...editorStyle } = style;

  return (
    <div style={{ position: 'relative', marginBottom, flex, width }}>
      {empty && placeholder && (
        <span style={{
          position: 'absolute', top: '6px', left: '10px',
          color: '#9ca3af', fontSize: '13px', pointerEvents: 'none', userSelect: 'none', zIndex: 1,
        }}>
          {placeholder}
        </span>
      )}

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={notify}
        onPaste={handlePaste}
        onClick={handleEditorClick}
        className={className}
        style={{
          minHeight: editorStyle.minHeight || '70px',
          padding: editorStyle.padding || '6px 10px',
          border: editorStyle.border || '1px solid #ccc',
          borderRadius: editorStyle.borderRadius || '4px',
          fontSize: editorStyle.fontSize || '13px',
          boxSizing: 'border-box',
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          outline: 'none',
          width: '100%',
        }}
      />

      {/* Render handles via portal into document.body so position:fixed is
          always relative to the viewport, unaffected by ancestor transforms */}
      {handleBox && ReactDOM.createPortal(
        <>
          {/* Selection border */}
          <div style={{
            position: 'fixed',
            top: handleBox.top, left: handleBox.left,
            width: handleBox.width, height: handleBox.height,
            border: '1.5px solid #0d6efd',
            pointerEvents: 'none',
            zIndex: 9999,
            boxSizing: 'border-box',
          }} />

          {/* Resize handles */}
          {HANDLES.map(({ dir, yFrac, xFrac, cursor }) => (
            <div
              key={dir}
              data-resize-handle="true"
              onMouseDown={(e) => startResize(e, dir)}
              style={{
                position: 'fixed',
                top: handleBox.top + yFrac * handleBox.height - HANDLE_SIZE / 2,
                left: handleBox.left + xFrac * handleBox.width - HANDLE_SIZE / 2,
                width: HANDLE_SIZE,
                height: HANDLE_SIZE,
                background: '#fff',
                border: '1.5px solid #0d6efd',
                borderRadius: '2px',
                cursor,
                zIndex: 10000,
              }}
            />
          ))}
        </>,
        document.body
      )}
    </div>
  );
};

export default PasteImageTextarea;
