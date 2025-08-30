import { computed, ref } from 'vue'
import { useCharacterStore } from '../stores/characterStore'
import { Character } from '../../domain/entities/Character'

export function useCharacter() {
  const characterStore = useCharacterStore()
  
  // 角色选择相关状态
  const showSuggestions = ref(false)
  const selectedIndex = ref(0)
  const suggestionPosition = ref({ top: '0px', left: '0px' })
  const searchQuery = ref('')

  // 获取过滤后的角色建议
  const getFilteredSuggestions = async (query: string): Promise<Character[]> => {
    searchQuery.value = query
    return await characterStore.getCharacterSuggestions(query)
  }

  // 在光标位置显示角色建议
  const showSuggestionsAtCursor = (textarea: HTMLTextAreaElement) => {
    const rect = textarea.getBoundingClientRect()
    const textBeforeCursor = textarea.value.substring(0, textarea.selectionStart)
    const lines = textBeforeCursor.split('\n')
    const currentLine = lines[lines.length - 1]
    
    // 计算光标位置
    const lineHeight = 20 // 估算行高
    const charWidth = 10 // 估算字符宽度
    const top = rect.top + (lines.length - 1) * lineHeight + 30
    const left = rect.left + (currentLine.length * charWidth)
    
    suggestionPosition.value = {
      top: `${Math.min(top, window.innerHeight - 200)}px`,
      left: `${Math.min(left, window.innerWidth - 250)}px`
    }
    
    showSuggestions.value = true
    selectedIndex.value = 0
  }

  // 隐藏角色建议
  const hideSuggestions = () => {
    showSuggestions.value = false
    selectedIndex.value = 0
    searchQuery.value = ''
  }

  // 选择角色并插入到文本中
  const selectCharacter = (
    character: Character, 
    textarea: HTMLTextAreaElement,
    content: string,
    onContentChange: (newContent: string) => void
  ) => {
    const cursorPos = textarea.selectionStart
    const textBeforeCursor = content.substring(0, cursorPos)
    const textAfterCursor = content.substring(cursorPos)
    
    // 找到 @ 符号的位置
    const atIndex = textBeforeCursor.lastIndexOf('@')
    if (atIndex === -1) return
    
    // 替换 @ 为角色名称
    const newText = textBeforeCursor.substring(0, atIndex) + character.name + textAfterCursor
    onContentChange(newText)
    
    // 设置光标位置到角色名称后
    const newCursorPos = atIndex + character.name.length
    setTimeout(() => {
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      textarea.focus()
    }, 0)
    
    hideSuggestions()
  }

  // 处理键盘导航
  const handleKeyNavigation = (
    event: KeyboardEvent, 
    suggestions: Character[],
    onSelect?: (character: Character) => void
  ) => {
    if (!showSuggestions.value) return false

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        selectedIndex.value = Math.min(selectedIndex.value + 1, suggestions.length - 1)
        return true
      case 'ArrowUp':
        event.preventDefault()
        selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
        return true
      case 'Enter':
        event.preventDefault()
        if (suggestions[selectedIndex.value] && onSelect) {
          onSelect(suggestions[selectedIndex.value])
        }
        return true
      case 'Escape':
        event.preventDefault()
        hideSuggestions()
        return true
      default:
        return false
    }
  }

  // 处理图片加载错误
  const handleImageError = (event: Event) => {
    const img = event.target as HTMLImageElement
    img.src = '/avatar_default.png'
  }

  return {
    // Store 状态
    characters: computed(() => characterStore.characters),
    loading: computed(() => characterStore.loading),
    error: computed(() => characterStore.error),
    characterCount: computed(() => characterStore.characterCount),

    // Store 操作
    loadCharacters: characterStore.loadCharacters,
    createCharacter: characterStore.createCharacter,
    updateCharacter: characterStore.updateCharacter,
    deleteCharacter: characterStore.deleteCharacter,
    searchCharacters: characterStore.searchCharacters,
    getCharacterById: characterStore.getCharacterById,
    clearError: characterStore.clearError,

    // 角色建议相关状态
    showSuggestions: computed(() => showSuggestions.value),
    selectedIndex: computed(() => selectedIndex.value),
    suggestionPosition: computed(() => suggestionPosition.value),
    searchQuery: computed(() => searchQuery.value),

    // 角色建议相关操作
    getFilteredSuggestions,
    showSuggestionsAtCursor,
    hideSuggestions,
    selectCharacter,
    handleKeyNavigation,
    handleImageError
  }
}