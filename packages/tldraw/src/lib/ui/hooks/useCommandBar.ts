import { useEditor } from '@tldraw/editor'
import { useCallback, useEffect, useState } from 'react'

/** @public */
export function useCommandBar() {
	const [isOpen, setIsOpen] = useState(false)
	const editor = useEditor()

	const openCommandBar = useCallback(() => {
		setIsOpen(true)
	}, [])

	const closeCommandBar = useCallback(() => {
		setIsOpen(false)
	}, [])

	const toggleCommandBar = useCallback(() => {
		setIsOpen((prev) => !prev)
	}, [])

	// Global keyboard shortcut handler
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			// Check for Cmd+K or Ctrl+K
			if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
				event.preventDefault()

				// Only open if not in readonly mode and shortcuts are not disabled
				if (editor.getIsReadonly()) return

				const isDisabled =
					editor.getEditingShapeId() !== null ||
					editor.menus.hasAnyOpenMenus() ||
					editor.getCrashingError()

				if (!isDisabled) {
					toggleCommandBar()
				}
			}

			// Close on Escape
			if (event.key === 'Escape' && isOpen) {
				event.preventDefault()
				closeCommandBar()
			}
		}

		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [editor, isOpen, toggleCommandBar, closeCommandBar])

	return {
		isOpen,
		openCommandBar,
		closeCommandBar,
		toggleCommandBar,
	}
}
