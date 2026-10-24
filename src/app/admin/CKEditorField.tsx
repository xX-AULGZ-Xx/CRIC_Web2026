'use client';

import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    CKEDITOR?: any;
  }
}

let ckScriptPromise: Promise<void> | null = null;

function loadCKEditorScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.CKEDITOR) return Promise.resolve();
  if (ckScriptPromise) return ckScriptPromise;

  ckScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[src*="cdn.ckeditor.com/4.22.1"]'
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', (e) => reject(e));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.ckeditor.com/4.22.1/full/ckeditor.js';
    script.async = true;
    script.onload = () => {
      if (window.CKEDITOR) {
        window.CKEDITOR.config.versionCheck = false;
        window.CKEDITOR.config.allowedContent = true;
      }
      resolve();
    };
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });

  return ckScriptPromise;
}

interface CKEditorFieldProps {
  value: string;
  onChange: (html: string) => void;
  height?: number | string;
  placeholder?: string;
  compact?: boolean;
}

export default function CKEditorField({
  value,
  onChange,
  height = 360,
  placeholder,
  compact = false,
}: CKEditorFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editorRef = useRef<any>(null);
  const lastEmittedValueRef = useRef<string>(value || '');
  const onChangeRef = useRef(onChange);
  const [ready, setReady] = useState(false);

  onChangeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;

    loadCKEditorScript()
      .then(() => {
        if (cancelled || !textareaRef.current || !window.CKEDITOR) return;

        window.CKEDITOR.config.versionCheck = false;
        window.CKEDITOR.config.allowedContent = true;

        const config: Record<string, any> = {
          height,
          allowedContent: true,
          versionCheck: false,
          removePlugins: 'resize,exportpdf',
          filebrowserUploadUrl: '/api/admin/ckeditor-upload',
          filebrowserImageUploadUrl: '/api/admin/ckeditor-upload',
          uploadUrl: '/api/admin/ckeditor-upload',
          language: 'th',
        };

        if (compact) {
          config.toolbarGroups = [
            { name: 'document', groups: ['mode'] },
            { name: 'basicstyles', groups: ['basicstyles', 'cleanup'] },
            { name: 'paragraph', groups: ['list', 'indent', 'blocks', 'align'] },
            { name: 'links' },
            { name: 'insert' },
            { name: 'styles' },
            { name: 'colors' },
          ];
        } else {
          config.toolbarGroups = [
            { name: 'document', groups: ['mode', 'document', 'doctools'] },
            { name: 'clipboard', groups: ['clipboard', 'undo'] },
            { name: 'editing', groups: ['find', 'selection', 'editing'] },
            { name: 'basicstyles', groups: ['basicstyles', 'cleanup'] },
            {
              name: 'paragraph',
              groups: ['list', 'indent', 'blocks', 'align', 'paragraph'],
            },
            { name: 'links', groups: ['links'] },
            { name: 'insert', groups: ['insert'] },
            { name: 'styles', groups: ['styles'] },
            { name: 'colors', groups: ['colors'] },
            { name: 'tools', groups: ['tools'] },
          ];
        }

        const instance = window.CKEDITOR.replace(textareaRef.current, config);
        editorRef.current = instance;

        instance.on('instanceReady', () => {
          if (cancelled) return;
          setReady(true);
          if (value !== instance.getData()) {
            instance.setData(value || '');
            lastEmittedValueRef.current = value || '';
          }
        });

        const syncData = () => {
          if (cancelled || !editorRef.current) return;
          const data = editorRef.current.getData();
          if (data !== lastEmittedValueRef.current) {
            lastEmittedValueRef.current = data;
            onChangeRef.current(data);
          }
        };

        instance.on('change', syncData);
        instance.on('blur', syncData);
        instance.on('key', () => {
          setTimeout(syncData, 50);
        });
      })
      .catch((err) => {
        console.error('Failed to load CKEditor:', err);
      });

    return () => {
      cancelled = true;
      if (editorRef.current) {
        try {
          editorRef.current.destroy(true);
        } catch {
          // Ignore destroy errors when unmounting modal
        }
        editorRef.current = null;
      }
    };
  }, [compact, height]);

  // Keep editor in sync when value changes externally (e.g. switching items or inserting blocks)
  useEffect(() => {
    if (
      ready &&
      editorRef.current &&
      value !== lastEmittedValueRef.current &&
      value !== editorRef.current.getData()
    ) {
      lastEmittedValueRef.current = value || '';
      editorRef.current.setData(value || '');
    }
  }, [value, ready]);

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
      <textarea
        ref={textareaRef}
        defaultValue={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={8}
        className="w-full px-4 py-2.5 text-sm text-slate-800 outline-none"
      />
    </div>
  );
}
