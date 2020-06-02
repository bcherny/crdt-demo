import {
  Editor as DraftJSEditor,
  EditorState,
  ContentState,
  SelectionState,
} from 'draft-js'
import React from 'react'

type Props = {
  onChange?: (value: string) => void
  onKeyDown?: (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
    selectedText: string,
    selection: [number, number]
  ) => void
  placeholder?: string
  value: string
}

let FN = () => {}

export function Editor({
  onChange = FN,
  onKeyDown = FN,
  placeholder,
  value,
}: Props) {
  const editor = React.useRef<any>(null)
  let editorState = React.useMemo(() => {
    return EditorState.createWithContent(ContentState.createFromText(value))
  }, [value])
  function focusEditor() {
    editor.current?.focus()
  }
  React.useEffect(focusEditor, [])
  let onDraftJSChange = React.useCallback(() => {
    return (editorState: EditorState) => {
      onChange(editorState.join(''))
    }
  }, [onChange])
  let onDraftJSKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    let selectionState = editorState.getSelection()
    let anchorKey = selectionState.getAnchorKey()
    let currentContent = editorState.getCurrentContent()
    let currentContentBlock = currentContent.getBlockForKey(anchorKey)
    let start = selectionState.getStartOffset()
    let end = selectionState.getEndOffset()
    let selectedText = currentContentBlock.getText().slice(start, end)
    onKeyDown(event, selectedText, [start, end])

    console.log('editor.current', start, end)

    let s = SelectionState.createEmpty(anchorKey)
    console.log(s)

    EditorState.forceSelection(
      editorState,
      s.set('startOffset', start + 1).set('endOffset', end + 1) as any
    )

    return null
  }
  return (
    <DraftJSEditor
      editorState={editorState}
      keyBindingFn={onDraftJSKeyDown}
      onChange={onDraftJSChange}
      placeholder={placeholder}
      ref={editor}
    />
  )
}
