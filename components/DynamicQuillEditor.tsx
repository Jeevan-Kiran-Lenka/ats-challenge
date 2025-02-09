"use client"

import dynamic from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'

const QuillEditor = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <p>Loading editor...</p>
})

interface DynamicQuillEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function DynamicQuillEditor({ value, onChange, className }: DynamicQuillEditorProps) {
  return (
    <QuillEditor
      theme="snow"
      value={value}
      onChange={onChange}
      className={className}
    />
  )
} 