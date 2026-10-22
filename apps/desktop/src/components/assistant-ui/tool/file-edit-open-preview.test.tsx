import type { ThreadMessage } from '@assistant-ui/react'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it } from 'vitest'

import { $previewTabs } from '@/store/preview'
import { $toolDisclosureStates, setHideCodeDiffs, setToolViewMode } from '@/store/tool-view'

import { assistantMessage, stubThreadEnvironment, stubThreadViewportSize, ThreadRuntime } from '../test-utils'
import { Thread } from '../thread'

stubThreadEnvironment()
stubThreadViewportSize()

const diff = '--- a/demo.ts\n+++ b/demo.ts\n@@ -1 +1,2 @@\n-beforeEdit\n+afterEdit\n+addedLine'

function editMessage(): ThreadMessage {
  return {
    ...assistantMessage(),
    content: [
      {
        type: 'tool-call',
        toolCallId: 'edit-patch',
        toolName: 'patch',
        args: { path: '/repo/src/demo.ts' },
        argsText: '{}',
        result: { success: true, path: '/repo/src/demo.ts', inline_diff: diff }
      }
    ]
  } as ThreadMessage
}

beforeEach(() => {
  $toolDisclosureStates.set({})
  $previewTabs.set([])
  setHideCodeDiffs(false)
  setToolViewMode('product')
})

afterEach(() => {
  cleanup()
})

async function renderEditRow() {
  render(
    <ThreadRuntime messages={[editMessage()]}>
      <Thread />
    </ThreadRuntime>
  )

  // The card title carries the full path, not just the basename.
  return screen.findByRole('link', { name: '/repo/src/demo.ts' })
}

it('opens the edited file in the preview rail when its path is clicked', async () => {
  const title = await renderEditRow()

  act(() => {
    fireEvent.click(title)
  })

  await waitFor(() => expect($previewTabs.get()).toHaveLength(1))
  expect($previewTabs.get()[0]?.target).toMatchObject({ kind: 'file', path: '/repo/src/demo.ts' })
})

it('treats Enter on the path as the same open action', async () => {
  const title = await renderEditRow()

  act(() => {
    fireEvent.keyDown(title, { key: 'Enter' })
  })

  await waitFor(() => expect($previewTabs.get()).toHaveLength(1))
  expect($previewTabs.get()[0]?.target).toMatchObject({ kind: 'file', path: '/repo/src/demo.ts' })
})

it('does not toggle the card open when the path itself is clicked', async () => {
  const title = await renderEditRow()

  act(() => {
    fireEvent.click(title)
  })

  await waitFor(() => expect($previewTabs.get()).toHaveLength(1))
  expect($toolDisclosureStates.get()).toEqual({})
})
