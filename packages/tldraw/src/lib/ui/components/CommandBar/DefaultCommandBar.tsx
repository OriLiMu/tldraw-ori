import { useEditor } from '@tldraw/editor'
import * as React from 'react'
import { TLUiActionItem, useActions } from '../../context/actions'
import { useTranslation } from '../../hooks/useTranslation/useTranslation'

/** @public */
export interface TldrawUiCommandBarProps {
	isOpen: boolean
	onClose: () => void
}

/** @public */
export function DefaultCommandBar({ isOpen, onClose }: TldrawUiCommandBarProps) {
	const actions = useActions()
	const editor = useEditor()
	const msg = useTranslation()
	const [query, setQuery] = React.useState('')
	const [selectedIndex, setSelectedIndex] = React.useState(0)
	const inputRef = React.useRef<HTMLInputElement>(null)

	// Memoize base actions filter (tools and debug filtering)
	const baseActions = React.useMemo(() => {
		return Object.values(actions)
			.filter((action) => !action.id.includes('tool') && !action.id.includes('debug'))
			.filter((action) => {
				// Check if action is enabled (if it has an enabled function)
				if (action.enabled && typeof action.enabled === 'function') {
					try {
						return action.enabled(editor)
					} catch (error) {
						console.warn(`Error checking enabled state for action ${action.id}:`, error)
						return false
					}
				}
				return true
			})
	}, [actions, editor])

	// Debounced search query for better performance
	const debouncedQuery = React.useMemo(() => {
		let timeoutId: NodeJS.Timeout
		let currentQuery = ''

		return (newQuery: string) => {
			currentQuery = newQuery
			clearTimeout(timeoutId)

			timeoutId = setTimeout(() => {
				return currentQuery
			}, 150) // 150ms debounce delay
		}
	}, [])

	// Memoize search query and filtering with improved algorithm and scoring
	const filteredActions = React.useMemo(() => {
		if (!query) return baseActions.slice(0, 6)

		const lowerQuery = query.toLowerCase().trim()

		// Split query into words for better matching
		const queryWords = lowerQuery.split(/\s+/).filter((word) => word.length > 0)

		const scoredActions = baseActions
			.map((action) => {
				try {
					// Get searchable text from action
					const label =
						typeof action.label === 'string' ? action.label : action.label?.['en'] || action.id
					const searchableText = `${label.toLowerCase()} ${action.id.toLowerCase()}`

					// Calculate relevance score
					let score = 0

					if (queryWords.length === 1) {
						const word = queryWords[0]

						// Exact label match gets highest score
						if (label.toLowerCase() === word) score = 100
						// Label starts with query gets high score
						else if (label.toLowerCase().startsWith(word)) score = 80
						// Label contains query gets medium score
						else if (label.toLowerCase().includes(word)) score = 60
						// ID contains query gets low score
						else if (action.id.toLowerCase().includes(word)) score = 40
						// No match gets zero score
						else score = 0
					} else {
						// Multi-word queries: check if all words are present
						const allWordsPresent = queryWords.every((word) => searchableText.includes(word))
						if (allWordsPresent) {
							// Score based on how many words match the start of label
							const startMatches = queryWords.filter((word) =>
								label.toLowerCase().startsWith(word)
							).length
							score = 50 + startMatches * 10
						} else {
							score = 0
						}
					}

					return { action, score }
				} catch (error) {
					console.warn(`Error processing action ${action.id}:`, error)
					return { action, score: 0 }
				}
			})
			.filter((item) => item.score > 0)
			.sort((a, b) => b.score - a.score) // Sort by score (highest first)
			.map((item) => item.action)

		return scoredActions.slice(0, 6)
	}, [baseActions, query])

	// Handle focus management when command bar opens
	React.useEffect(() => {
		if (isOpen && inputRef.current) {
			// Use setTimeout to ensure focus happens after render
			const timeoutId = setTimeout(() => {
				if (inputRef.current) {
					inputRef.current.focus()
					// Scroll the input into view if needed
					inputRef.current.scrollIntoView({
						block: 'center',
						behavior: 'smooth',
					})
				}
			}, 0)

			return () => clearTimeout(timeoutId)
		}
	}, [isOpen])

	React.useEffect(() => {
		setSelectedIndex(0)
	}, [query])

	// Handle clearing query
	const handleClearQuery = React.useCallback(() => {
		setQuery('')
		setSelectedIndex(0)
		// Refocus the input after clearing
		if (inputRef.current) {
			inputRef.current.focus()
		}
	}, [])

	// Enhanced keyboard event handler with comprehensive navigation
	const handleKeyDown = React.useCallback(
		(e: React.KeyboardEvent) => {
			const isModifierKey = e.ctrlKey || e.metaKey || e.altKey || e.shiftKey

			switch (e.key) {
				case 'ArrowDown':
					e.preventDefault()
					setSelectedIndex((prev) => {
						const nextIndex = prev + 1
						// Wrap around to top when reaching bottom
						return nextIndex >= filteredActions.length ? 0 : nextIndex
					})
					break
				case 'ArrowUp':
					e.preventDefault()
					setSelectedIndex((prev) => {
						const prevIndex = prev - 1
						// Wrap around to bottom when reaching top
						return prevIndex < 0 ? Math.max(0, filteredActions.length - 1) : prevIndex
					})
					break
				case 'Home':
					e.preventDefault()
					// Jump to first item
					setSelectedIndex(0)
					break
				case 'End':
					e.preventDefault()
					// Jump to last item
					setSelectedIndex(Math.max(0, filteredActions.length - 1))
					break
				case 'PageDown':
					e.preventDefault()
					// Jump 10 items down (or to bottom)
					setSelectedIndex((prev) => Math.min(prev + 10, Math.max(0, filteredActions.length - 1)))
					break
				case 'PageUp':
					e.preventDefault()
					// Jump 10 items up (or to top)
					setSelectedIndex((prev) => Math.max(prev - 10, 0))
					break
				case 'Enter': {
					e.preventDefault()
					const action = filteredActions[selectedIndex]
					if (action) {
						// Double check if action is still enabled before executing
						if (action.enabled && typeof action.enabled === 'function' && !action.enabled(editor)) {
							return // Don't execute disabled actions
						}
						action.onSelect('kbd' as any) // Using 'kbd' as a valid event source
						onClose()
						// Focus back to the editor canvas after executing action
						setTimeout(() => {
							editor.focus()
						}, 0)
					}
					break
				}
				case 'Escape':
					e.preventDefault()
					// Restore focus to the editor when closing with Escape
					const previousFocus = document.activeElement as HTMLElement
					onClose()
					// Focus back to the editor canvas after closing
					setTimeout(() => {
						editor.focus()
					}, 0)
					break
				case 'Backspace':
					// Allow clearing with Backspace when query is empty and input is focused
					if (query === '' && document.activeElement === inputRef.current) {
						e.preventDefault()
						onClose()
						// Focus back to the editor canvas after closing
						setTimeout(() => {
							editor.focus()
						}, 0)
					} else if (query.length > 0) {
						e.preventDefault()
						handleClearQuery()
					}
					break
				case 'Delete':
					// Allow clearing with Delete when query is empty and input is focused
					if (query === '' && document.activeElement === inputRef.current) {
						e.preventDefault()
						onClose()
						// Focus back to the editor canvas after closing
						setTimeout(() => {
							editor.focus()
						}, 0)
					} else if (query.length > 0) {
						e.preventDefault()
						handleClearQuery()
					}
					break
				case 'Tab':
					if (!isModifierKey) {
						e.preventDefault()
						// Navigate to next item on Tab, previous on Shift+Tab
						if (e.shiftKey) {
							setSelectedIndex((prev) => Math.max(prev - 1, 0))
						} else {
							setSelectedIndex((prev) =>
								Math.min(prev + 1, Math.max(0, filteredActions.length - 1))
							)
						}
					}
					break
				// Support Ctrl/Cmd+A to select all text in input
				case 'a':
				case 'A':
					if ((e.ctrlKey || e.metaKey) && document.activeElement === inputRef.current) {
						// Let the browser handle select all
						return
					}
					break
				// Support Ctrl/Cmd+C to copy selected action info
				case 'c':
				case 'C':
					if ((e.ctrlKey || e.metaKey) && document.activeElement !== inputRef.current) {
						e.preventDefault()
						const action = filteredActions[selectedIndex]
						if (action) {
							const label =
								typeof action.label === 'string' ? action.label : action.label?.['en'] || action.id
							navigator.clipboard.writeText(`${label} (${action.id})`)
						}
					}
					break
				// Number keys for quick selection
				case '1':
				case '2':
				case '3':
				case '4':
				case '5':
				case '6':
				case '7':
				case '8':
				case '9':
					if (!isModifierKey && query === '') {
						e.preventDefault()
						const index = parseInt(e.key) - 1
						if (index < filteredActions.length) {
							const action = filteredActions[index]
							if (action && (!action.enabled || action.enabled(editor))) {
								action.onSelect('kbd' as any)
								onClose()
								setTimeout(() => {
									editor.focus()
								}, 0)
							}
						}
					}
					break
			}
		},
		[filteredActions, selectedIndex, onClose, editor, query, handleClearQuery]
	)

	const handleActionClick = React.useCallback(
		(action: TLUiActionItem) => {
			try {
				// Check if action is enabled before executing
				if (action.enabled && typeof action.enabled === 'function' && !action.enabled(editor)) {
					return // Don't execute disabled actions
				}

				// Execute the action safely
				const result = action.onSelect('kbd' as any)

				// Handle async actions if they return a Promise
				if (result instanceof Promise) {
					result.catch((error) => {
						console.error(`Error executing action ${action.id}:`, error)
					})
				}

				onClose()
				// Focus back to the editor canvas after executing action
				setTimeout(() => {
					editor.focus()
				}, 0)
			} catch (error) {
				console.error(`Error executing action ${action.id}:`, error)
				// Still close the command bar and focus back even on error
				onClose()
				setTimeout(() => {
					editor.focus()
				}, 0)
			}
		},
		[onClose, editor]
	)

	// Extract action item rendering to separate component with performance optimizations
	const ActionItem = React.useMemo(() => {
		return React.memo(
			({
				action,
				index,
				isSelected,
				onClick,
				onMouseEnter,
			}: {
				action: TLUiActionItem
				index: number
				isSelected: boolean
				onClick: () => void
				onMouseEnter: () => void
			}) => {
				const isEnabled = !action.enabled || action.enabled(editor)

				// Memoize expensive calculations
				const actionLabel = React.useMemo(
					() =>
						typeof action.label === 'string' ? action.label : action.label?.['en'] || action.id,
					[action.label, action.id]
				)

				const showNumberHint = React.useMemo(
					() => index < 9, // Only show number hints for first 9 items
					[index]
				)

				const disabledDescription = React.useMemo(
					() => (!isEnabled && action.disabledDescription ? msg(action.disabledDescription) : null),
					[isEnabled, action.disabledDescription, msg]
				)

				return (
					<div
						id={`command-bar-item-${index}`}
						className={`tlui-command-bar__item ${
							isSelected ? 'tlui-command-bar__item--selected' : ''
						} ${!isEnabled ? 'tlui-command-bar__item--disabled' : ''}`}
						onClick={() => isEnabled && onClick()}
						onMouseEnter={() => isEnabled && onMouseEnter()}
						role="option"
						aria-selected={isSelected}
						aria-disabled={!isEnabled}
						aria-label={actionLabel}
						tabIndex={isSelected ? 0 : -1}
					>
						{action.icon && (
							<span className="tlui-command-bar__item__icon">
								{typeof action.icon === 'string' ? (
									<span className={`tlui-icon tlui-icon-${action.icon}`} />
								) : (
									action.icon
								)}
							</span>
						)}
						<span className="tlui-command-bar__item__label">{actionLabel}</span>
						{showNumberHint && (
							<span className="tlui-command-bar__item__number-hint">{index + 1}</span>
						)}
						{action.kbd && <span className="tlui-command-bar__item__kbd">{action.kbd}</span>}
						{disabledDescription && (
							<span className="tlui-command-bar__item__disabled-desc">{disabledDescription}</span>
						)}
					</div>
				)
			}
		)
	}, [editor, msg])

	// Memoize empty state rendering
	const EmptyState = React.useMemo(() => {
		return React.memo(() => (
			<div className="tlui-command-bar__empty">
				{msg('command-bar.no-results') || 'No results found'}
			</div>
		))
	}, [msg])

	// Memoize action items rendering
	const actionItems = React.useMemo(() => {
		if (filteredActions.length === 0) {
			return <EmptyState />
		}

		return (
			<React.Fragment>
				{filteredActions.map((action, index) => (
					<ActionItem
						key={action.id}
						action={action}
						index={index}
						isSelected={index === selectedIndex}
						onClick={() => handleActionClick(action)}
						onMouseEnter={() => setSelectedIndex(index)}
					/>
				))}
			</React.Fragment>
		)
	}, [filteredActions, selectedIndex, ActionItem, EmptyState, handleActionClick])

	if (!isOpen) return null

	return (
		<div className="tlui-command-bar__wrapper">
			<div
				className="tlui-command-bar"
				role="dialog"
				aria-modal="true"
				aria-label={msg('command-bar.title') || 'Command Palette'}
				onKeyDown={handleKeyDown}
			>
				<div className="tlui-command-bar__input-wrapper">
					<input
						ref={inputRef}
						className="tlui-command-bar__input"
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={msg('command-bar.placeholder') || 'Type a command...'}
						role="combobox"
						aria-autocomplete="list"
						aria-expanded={filteredActions.length > 0}
						aria-activedescendant={
							filteredActions.length > 0 ? `command-bar-item-${selectedIndex}` : undefined
						}
						aria-describedby="command-bar-instructions"
						autoFocus
					/>
					{query && (
						<button
							className="tlui-command-bar__clear"
							onClick={handleClearQuery}
							title={msg('command-bar.clear') || 'Clear'}
							aria-label={msg('command-bar.clear') || 'Clear search query'}
							type="button"
						>
							×
						</button>
					)}
				</div>
				<div
					className="tlui-command-bar__list"
					role="listbox"
					aria-label={msg('command-bar.results') || 'Search results'}
				>
					{actionItems}
				</div>
				<div
					id="command-bar-instructions"
					className="tlui-command-bar__instructions"
					aria-live="polite"
					aria-atomic="true"
				>
					{filteredActions.length > 0
						? `${filteredActions.length} ${msg('command-bar.results-count') || 'results available'}`
						: msg('command-bar.no-results') || 'No results found'}
				</div>
			</div>
			<div
				className="tlui-command-bar__backdrop"
				onClick={onClose}
				aria-label={msg('command-bar.close') || 'Close command palette'}
				role="button"
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault()
						onClose()
					}
				}}
			/>
		</div>
	)
}
