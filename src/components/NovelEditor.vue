<template>
  <div class="novel-editor">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <ProjectSelector 
          v-model="selectedProjectId"
          :projects="availableProjects"
          @change="handleProjectChange"
        />
        <span v-if="currentProjectName" class="current-project">
          当前项目：{{ currentProjectName }}
        </span>
      </div>
      <div class="toolbar-right">
        <button @click="saveNovel" class="save-btn" :disabled="saving">
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>

    <!-- 编辑区域 -->
    <div v-if="currentChapter" class="editor-container">
      <textarea
        ref="editor"
        v-model="content"
        class="editor"
        placeholder="开始你的创作之旅..."
        @input="handleContentChange"
        @keydown="handleKeyPress"
        @scroll="handleScroll"
        @contextmenu="handleContextMenu"
        @click="hideContextMenu"
      ></textarea>
      
      <!-- 行号显示 -->
      <div class="line-numbers" ref="lineNumbers">
        <div 
          v-for="n in lineCount" 
          :key="n" 
          class="line-number"
        >
          {{ n }}
        </div>
      </div>
    </div>
    
    <!-- 未选择章节提示 -->
    <div v-else class="no-chapter-selected">
      <div class="no-chapter-message">
        <div class="message-icon">📝</div>
        <h3>请先选择或创建一个章节</h3>
        <p>在左侧章节面板中选择一个章节，或创建新章节开始编辑</p>
      </div>
    </div>

    <!-- 右键菜单组件 -->
    <ContextMenu
      :visible="contextMenu.visible"
      :position="{ x: contextMenu.x, y: contextMenu.y }"
      @close="hideContextMenu"
      @copy="copyText"
      @cut="cutText"
      @paste="pasteText"
      @select-all="selectAll"
      @find-replace="findReplace"
      @insert-datetime="insertDateTime"
      @word-count="wordCountDetails"
    />

    <!-- 底部状态栏 -->
    <div class="status-bar">
      <div class="status-left">
        <span>行: {{ currentLine }}</span>
        <span>列: {{ currentColumn }}</span>
        <span>字数: {{ wordCount }}</span>
      </div>
      <div class="status-right">
        <span>最后保存: {{ lastSaveTime }}</span>
      </div>
    </div>
    
    <!-- 角色选择器组件 -->
    <CharacterSelector
      ref="characterSelectorRef"
      :visible="characterSelector.visible"
      :position="{ x: characterSelector.x, y: characterSelector.y }"
      :projectId="selectedProjectId"
      @select="insertCharacter"
      @create="createNewCharacter"
      @close="hideCharacterSelector"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import ContextMenu from './ContextMenu.vue'
import ProjectSelector from './common/ProjectSelector.vue'
import CharacterSelector from './common/CharacterSelector.vue'
import storageManager from '../utils/storage.js'

export default {
  name: 'NovelEditor',
  components: {
    ContextMenu,
    ProjectSelector,
    CharacterSelector
  },
  props: {
    currentProject: {
      type: Object,
      default: null
    },
    currentChapter: {
      type: Object,
      default: null
    }
  },
  setup(props, { emit }) {
    const selectedProjectId = ref('')
    const availableProjects = ref([])
    const content = ref('')
    const saving = ref(false)
    const lastSaveTime = ref('从未保存')
    const currentLine = ref(1)
    const currentColumn = ref(1)
    const editor = ref(null)
    const lineNumbers = ref(null)
    const contextMenu = ref({
      visible: false,
      x: 0,
      y: 0
    })
    
    // 角色选择器状态
    const characterSelector = ref({
      visible: false,
      x: 0,
      y: 0
    })
    
    // 角色选择器组件引用
    const characterSelectorRef = ref(null)

    // 计算当前项目名称
    const currentProjectName = computed(() => {
      if (props.currentProject) {
        return props.currentProject.name
      }
      if (selectedProjectId.value) {
        const project = availableProjects.value.find(p => p.id === selectedProjectId.value)
        return project ? project.name : ''
      }
      return ''
    })

    // 加载可用项目列表
    const loadAvailableProjects = async () => {
      try {
        console.log('开始加载可用项目列表...')
        // 使用异步方式获取项目列表
        const projects = await storageManager.getProjects()
        availableProjects.value = projects || []
        console.log(`成功加载${projects ? projects.length : 0}个项目`)
        return projects
      } catch (error) {
        console.error('加载项目列表失败:', error)
        availableProjects.value = []
        return []
      }
    }

    // 监听传入的当前项目
    watch(() => props.currentProject, (newProject) => {
      if (newProject) {
        selectedProjectId.value = newProject.id
      }
    }, { immediate: true })

    // 监听当前章节变化
    watch(() => props.currentChapter, async (newChapter, oldChapter) => {
      try {
        console.log('章节变化检测:', 
          newChapter ? (newChapter.title || newChapter.id) : '无章节', 
          '→', 
          oldChapter ? (oldChapter.title || oldChapter.id) : '无章节')
        
        if (newChapter && props.currentProject) {
          // 先清空内容，避免显示旧内容
          content.value = '　　'
          
          // 确保DOM已更新后再加载内容
          await nextTick()
          
          // 添加延迟，确保VolumeChapterSelector的数据已经完全加载
          setTimeout(async () => {
            await loadChapterContent(newChapter)
          }, 100)
        } else {
          console.log('无章节或项目，设置默认内容')
          content.value = '　　'
        }
      } catch (error) {
        console.error('章节变化处理失败:', error)
        content.value = '　　'
      }
    }, { immediate: true })

    // 计算字数（去除空格和换行）
    const wordCount = computed(() => {
      return content.value.replace(/\s/g, '').length
    })

    // 计算行数
    const lineCount = computed(() => {
      return content.value.split('\n').length
    })

    // 处理内容变化
    const handleContentChange = (event) => {
      updateCursorPosition()
      // 触发自动保存
      autoSaveContent()
      
      // 检查是否输入了@符号
      const inputChar = event.data
      if (inputChar === '@') {
        console.log('检测到@符号输入 (input事件)')
        showCharacterSelector()
      }
    }

    // 处理键盘输入事件
    const handleKeyPress = (event) => {
      // 回车键自动缩进
      if (event.key === 'Enter') {
        event.preventDefault()
        const textarea = editor.value
        const cursorPos = textarea.selectionStart
        const textBeforeCursor = content.value.substring(0, cursorPos)
        const textAfterCursor = content.value.substring(cursorPos)
        
        // 插入换行和缩进
        const indent = '　　' // 两个全角空格作为段落缩进
        content.value = textBeforeCursor + '\n' + indent + textAfterCursor
        
        // 设置光标位置到缩进后
        nextTick(() => {
          const newPosition = cursorPos + 1 + indent.length
          textarea.setSelectionRange(newPosition, newPosition)
        })
      }
      // 注意：我们现在在input事件中处理@符号，这里可以保留作为备用
      // else if (event.key === '@') {
      //   console.log('检测到@符号输入 (keyPress事件)')
      //   showCharacterSelector()
      // }
    }

    // 初始化内容缩进
    const initializeContent = () => {
      if (content.value === '' || !content.value.startsWith('　　')) {
        content.value = '　　' + content.value
        nextTick(() => {
          if (editor.value) {
            editor.value.setSelectionRange(2, 2) // 光标放在缩进后
          }
        })
      }
    }

    // 处理项目切换
    const handleProjectChange = async (project) => {
      try {
        console.log('处理项目切换...')
        
        if (project) {
          console.log('使用传入的项目:', project.name)
          emit('project-changed', project)
        } else {
          // 如果没有传递项目对象，则根据selectedProjectId查找
          // 确保项目列表已加载
          if (availableProjects.value.length === 0) {
            console.log('项目列表为空，尝试加载项目列表')
            await loadAvailableProjects()
          }
          
          const foundProject = availableProjects.value.find(p => p.id === selectedProjectId.value)
          if (foundProject) {
            console.log('根据ID找到项目:', foundProject.name)
            emit('project-changed', foundProject)
          } else {
            console.warn('未找到ID对应的项目:', selectedProjectId.value)
          }
        }
      } catch (error) {
        console.error('项目切换处理失败:', error)
      }
    }

    // 加载章节内容 - 完全绕过缓存机制，直接从文件系统加载
    const loadChapterContent = async (chapter, retryCount = 0) => {
      const maxRetries = 3
      
      if (chapter && chapter.id && props.currentProject) {
        try {
          console.log(`开始加载章节内容: ${chapter.title || chapter.id}, 项目ID: ${props.currentProject.id}, 重试次数: ${retryCount}`)
          
          // 直接从文件系统加载所有章节
          const fileName = `project-chapters-${props.currentProject.id}.json`
          let chapters = []
          
          // 如果在Electron环境中
          if (window.electronAPI && window.electronAPI.readFile) {
            try {
              console.log('使用Electron API读取章节文件')
              const result = await window.electronAPI.readFile(fileName)
              if (result.success && result.data) {
                chapters = JSON.parse(result.data)
                console.log(`成功读取到${chapters.length}个章节`)
              }
            } catch (err) {
              console.error('Electron读取章节文件失败:', err)
            }
          } else {
            // 在浏览器环境中使用localStorage
            try {
              console.log('使用localStorage读取章节数据')
              const key = `story_engine_${fileName.replace('.json', '')}`
              const data = localStorage.getItem(key)
              if (data) {
                chapters = JSON.parse(data)
                console.log(`成功从localStorage读取到${chapters.length}个章节`)
              }
            } catch (err) {
              console.error('localStorage读取章节数据失败:', err)
            }
          }
          
          // 查找当前章节
          const currentChapter = chapters.find(c => c.id === chapter.id)
          console.log('查找章节结果:', currentChapter ? '找到章节' : '未找到章节')
          
          // 如果没有找到章节且重试次数未达到上限，进行重试
          if (!currentChapter && retryCount < maxRetries) {
            console.log(`章节未找到，${500 * (retryCount + 1)}ms后进行第${retryCount + 1}次重试`)
            setTimeout(() => {
              loadChapterContent(chapter, retryCount + 1)
            }, 500 * (retryCount + 1))
            return
          }
          
          // 确保组件仍然挂载在DOM上
          if (!editor.value) {
            console.warn('编辑器元素不存在，可能组件已卸载')
            return
          }
          
          // 设置内容
          if (currentChapter && currentChapter.content) {
            content.value = currentChapter.content
            console.log('成功设置章节内容')
          } else {
            content.value = '　　'
            console.log('未找到章节内容，使用默认值')
          }
          
          // 初始化内容缩进
          await nextTick(() => {
            initializeContent()
            updateCursorPosition()
          })
        } catch (error) {
          console.error('加载章节内容失败:', error)
          
          // 如果重试次数未达到上限，进行重试
          if (retryCount < maxRetries) {
            console.log(`加载失败，${1000 * (retryCount + 1)}ms后进行第${retryCount + 1}次重试`)
            setTimeout(() => {
              loadChapterContent(chapter, retryCount + 1)
            }, 1000 * (retryCount + 1))
          } else {
            content.value = '　　'
          }
        }
      } else {
        console.log('无效的章节或项目，设置默认内容')
        content.value = '　　'
      }
    }

    // 自动保存内容
    const autoSaveContent = (() => {
      let timer = null
      return () => {
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => {
          if (props.currentProject && props.currentChapter && content.value && content.value.trim()) {
            try {
              storageManager.saveChapterContent(props.currentProject.id, props.currentChapter.id, content.value)
              // 更新写作统计
              const wordCount = content.value.replace(/\s/g, '').length
              storageManager.updateTodayWriting(props.currentProject.id, wordCount)
            } catch (error) {
              console.error('自动保存失败:', error)
            }
          }
        }, 2000) // 2秒后自动保存
      }
    })()

    // 更新光标位置
    const updateCursorPosition = () => {
      if (editor.value) {
        const textarea = editor.value
        const cursorPos = textarea.selectionStart
        const textBeforeCursor = content.value.substring(0, cursorPos)
        const lines = textBeforeCursor.split('\n')
        
        currentLine.value = lines.length
        currentColumn.value = lines[lines.length - 1].length + 1
      }
    }

    // 处理滚动同步
    const handleScroll = () => {
      if (editor.value && lineNumbers.value) {
        lineNumbers.value.scrollTop = editor.value.scrollTop
      }
    }

    // 处理右键菜单
    const handleContextMenu = (event) => {
      event.preventDefault()
      event.stopPropagation() // 阻止事件冒泡
      contextMenu.value.visible = true
      contextMenu.value.x = event.clientX
      contextMenu.value.y = event.clientY
    }

    // 隐藏右键菜单
    const hideContextMenu = () => {
      contextMenu.value.visible = false
    }
    
    // 显示角色选择器
    const showCharacterSelector = () => {
      console.log('尝试显示角色选择器')
      if (!editor.value) {
        console.log('编辑器引用不存在')
        return
      }
      if (!props.currentProject) {
        console.log('当前项目不存在')
        return
      }
      
      const textarea = editor.value
      const cursorPos = textarea.selectionStart
      
      // 获取光标位置的坐标
      const cursorCoords = getCursorCoordinates(textarea, cursorPos)
      console.log('光标坐标:', cursorCoords)
      
      // 设置角色选择器位置和可见性
      // 使用固定位置进行测试，确保选择器可见
      const editorRect = textarea.getBoundingClientRect()
      const x = editorRect.left + 100 // 固定位置测试
      const y = editorRect.top + 100 // 固定位置测试
      
      console.log('使用固定位置:', { x, y })
      
      // 先确保角色选择器不可见，然后在下一个事件循环中设置为可见
      characterSelector.value.visible = false
      
      // 使用nextTick确保DOM更新后再显示角色选择器
      nextTick(() => {
        // 先尝试使用固定位置，确保选择器可见
        characterSelector.value.x = x
        characterSelector.value.y = y
        characterSelector.value.visible = true
        
        // 确保角色选择器组件已加载角色列表
        if (characterSelectorRef.value && typeof characterSelectorRef.value.loadCharacters === 'function') {
          characterSelectorRef.value.loadCharacters()
        }
        
        console.log('角色选择器已显示', characterSelector.value)
      })
    }
    
    // 隐藏角色选择器
    const hideCharacterSelector = () => {
      characterSelector.value.visible = false
    }
    
    // 获取文本区域中光标的坐标
    const getCursorCoordinates = (textarea, position) => {
      // 创建一个临时元素来计算位置
      const div = document.createElement('div')
      const span = document.createElement('span')
      
      // 复制文本区域的样式
      const computed = window.getComputedStyle(textarea)
      const properties = [
        'direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
        'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
        'borderStyle', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
        'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize', 'fontSizeAdjust',
        'lineHeight', 'fontFamily', 'textAlign', 'textTransform', 'textIndent',
        'textDecoration', 'letterSpacing', 'wordSpacing'
      ]
      
      properties.forEach(prop => {
        div.style[prop] = computed[prop]
      })
      
      // 设置div的位置
      div.style.position = 'absolute'
      div.style.left = '0px'
      div.style.top = '0px'
      div.style.visibility = 'hidden'
      div.style.whiteSpace = 'pre-wrap'
      div.style.overflow = 'hidden'
      
      // 设置文本内容
      div.textContent = textarea.value.substring(0, position)
      
      // 添加一个span来标记光标位置
      span.textContent = '|'
      div.appendChild(span)
      
      // 添加到文档中进行计算
      document.body.appendChild(div)
      
      // 获取span的位置
      const rect = span.getBoundingClientRect()
      const textareaRect = textarea.getBoundingClientRect()
      
      // 清理
      document.body.removeChild(div)
      
      // 返回相对于文本区域的坐标
      return {
        top: rect.top - textareaRect.top + textarea.scrollTop,
        left: rect.left - textareaRect.left + textarea.scrollLeft
      }
    }

    // 复制文本
    const copyText = async () => {
      if (editor.value) {
        const selectedText = editor.value.value.substring(
          editor.value.selectionStart,
          editor.value.selectionEnd
        )
        if (selectedText) {
          try {
            await navigator.clipboard.writeText(selectedText)
          } catch (err) {
            console.error('复制失败:', err)
          }
        }
      }
      hideContextMenu()
    }

    // 剪切文本
    const cutText = async () => {
      if (editor.value) {
        const start = editor.value.selectionStart
        const end = editor.value.selectionEnd
        const selectedText = editor.value.value.substring(start, end)
        
        if (selectedText) {
          try {
            await navigator.clipboard.writeText(selectedText)
            // 删除选中的文本
            content.value = content.value.substring(0, start) + content.value.substring(end)
            // 设置光标位置
            nextTick(() => {
              editor.value.setSelectionRange(start, start)
              editor.value.focus()
            })
          } catch (err) {
            console.error('剪切失败:', err)
          }
        }
      }
      hideContextMenu()
    }

    // 粘贴文本
    const pasteText = async () => {
      if (editor.value) {
        try {
          const clipboardText = await navigator.clipboard.readText()
          const start = editor.value.selectionStart
          const end = editor.value.selectionEnd
          
          // 在光标位置插入文本
          content.value = content.value.substring(0, start) + clipboardText + content.value.substring(end)
          
          // 设置光标位置到插入文本的末尾
          nextTick(() => {
            const newPosition = start + clipboardText.length
            editor.value.setSelectionRange(newPosition, newPosition)
            editor.value.focus()
          })
        } catch (err) {
          console.error('粘贴失败:', err)
        }
      }
      hideContextMenu()
    }

    // 全选
    const selectAll = () => {
      if (editor.value) {
        editor.value.select()
        editor.value.focus()
      }
      hideContextMenu()
    }

    // 查找替换（简单实现）
    const findReplace = () => {
      const searchText = prompt('请输入要查找的文本:')
      if (searchText) {
        const replaceText = prompt('请输入替换文本（留空则只查找）:')
        if (replaceText !== null) {
          if (replaceText === '') {
            // 只查找
            const index = content.value.indexOf(searchText)
            if (index !== -1) {
              editor.value.setSelectionRange(index, index + searchText.length)
              editor.value.focus()
            } else {
              alert('未找到指定文本')
            }
          } else {
            // 替换所有
            content.value = content.value.replaceAll(searchText, replaceText)
          }
        }
      }
      hideContextMenu()
    }

    // 插入日期时间
    const insertDateTime = () => {
      if (editor.value) {
        const now = new Date()
        const dateTimeString = now.toLocaleString('zh-CN')
        const start = editor.value.selectionStart
        
        // 在光标位置插入日期时间
        content.value = content.value.substring(0, start) + dateTimeString + content.value.substring(start)
        
        // 设置光标位置到插入文本的末尾
        nextTick(() => {
          const newPosition = start + dateTimeString.length
          editor.value.setSelectionRange(newPosition, newPosition)
          editor.value.focus()
        })
      }
      hideContextMenu()
    }

    // 显示字数统计详情
    const wordCountDetails = () => {
      const text = content.value
      const characters = text.length
      const charactersNoSpaces = text.replace(/\s/g, '').length
      const words = text.trim() ? text.trim().split(/\s+/).length : 0
      const lines = text.split('\n').length
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length
      
      alert(`字数统计详情：\n字符数（含空格）: ${characters}\n字符数（不含空格）: ${charactersNoSpaces}\n词数: ${words}\n行数: ${lines}\n段落数: ${paragraphs}`)
      
      hideContextMenu()
    }

    // 保存小说
    const saveNovel = async () => {
      if (!props.currentProject) {
        alert('请先选择一个项目')
        return
      }

      if (!props.currentChapter) {
        alert('请先选择一个章节')
        return
      }

      saving.value = true
      try {
        // 保存章节内容到本地存储
        const success = storageManager.saveChapterContent(props.currentProject.id, props.currentChapter.id, content.value)
        
        if (success) {
          // 更新写作统计
          const wordCount = content.value.replace(/\s/g, '').length
          storageManager.updateTodayWriting(props.currentProject.id, wordCount)
          
          // 更新保存时间
          lastSaveTime.value = new Date().toLocaleString('zh-CN')
          
          console.log('章节内容已保存')
        } else {
          throw new Error('保存失败')
        }
      } catch (error) {
        console.error('保存失败:', error)
        alert('保存失败，请重试')
      } finally {
        saving.value = false
      }
    }

    // 自动保存功能
    const autoSave = (() => {
      let timer = null
      return () => {
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => {
          if (content.value.trim()) {
            saveNovel()
          }
        }, 30000) // 30秒后自动保存
      }
    })()

    // 键盘快捷键
    const handleKeydown = (event) => {
      // 隐藏右键菜单
      if (contextMenu.value.visible) {
        hideContextMenu()
      }
      
      // Ctrl+S 保存
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault()
        saveNovel()
      }
      // Ctrl+F 查找
      else if (event.ctrlKey && event.key === 'f') {
        event.preventDefault()
        findReplace()
      }
    }

    // 插入选中的角色
    const insertCharacter = (character) => {
      if (!editor.value) return
      
      const textarea = editor.value
      const cursorPos = textarea.selectionStart
      
      // 在光标位置插入角色名称
      const textBeforeCursor = content.value.substring(0, cursorPos)
      const textAfterCursor = content.value.substring(cursorPos)
      
      // 删除触发的@符号，并插入角色名称
      // 检查是否需要删除@符号（如果刚刚输入了@）
      const newText = textBeforeCursor.endsWith('@') 
        ? textBeforeCursor.slice(0, -1) + character.name + textAfterCursor
        : textBeforeCursor + character.name + textAfterCursor
      
      content.value = newText
      
      // 设置光标位置到插入文本的末尾
      nextTick(() => {
        const newPosition = cursorPos - (textBeforeCursor.endsWith('@') ? 1 : 0) + character.name.length
        textarea.setSelectionRange(newPosition, newPosition)
        textarea.focus()
      })
      
      // 隐藏角色选择器
      hideCharacterSelector()
    }
    
    // 创建新角色
    const createNewCharacter = () => {
      // 隐藏角色选择器
      hideCharacterSelector()
      
      // 弹出创建角色的对话框
      const characterName = prompt('请输入角色名称:')
      if (characterName && characterName.trim()) {
        const characterAlias = prompt('请输入角色别名(可选):')
        
        // 创建新角色
        try {
          // 这里应该调用存储管理器来创建角色
          // 假设storageManager有一个createCharacter方法
          // const newCharacter = storageManager.createCharacter(props.currentProject.id, {
          //   name: characterName.trim(),
          //   alias: characterAlias ? characterAlias.trim() : ''
          // })
          
          // 临时模拟创建角色
          const newCharacter = {
            id: Date.now().toString(),
            name: characterName.trim(),
            alias: characterAlias ? characterAlias.trim() : ''
          }
          
          // 插入新创建的角色
          insertCharacter(newCharacter)
          
          console.log('角色创建成功:', newCharacter)
        } catch (error) {
          console.error('创建角色失败:', error)
          alert('创建角色失败，请重试')
        }
      }
    }
    
    // 处理文档点击事件
    const handleDocumentClick = (event) => {
      // 确保点击事件不是来自编辑器内部
      if (editor.value && !editor.value.contains(event.target)) {
        hideContextMenu()
      }
      
      // 隐藏角色选择器（除非点击的是角色选择器本身）
      const characterSelectorEl = document.querySelector('.character-selector')
      if (characterSelectorEl && !characterSelectorEl.contains(event.target)) {
        hideCharacterSelector()
      }
    }
    
    onMounted(async () => {
      try {
        console.log('NovelEditor组件挂载中...')
        
        // 异步加载可用项目
        await loadAvailableProjects()
        
        // 如果有当前项目，确保选中
        if (props.currentProject) {
          console.log('设置当前项目:', props.currentProject.name)
          selectedProjectId.value = props.currentProject.id
          
          // 如果有当前章节，确保加载内容
          if (props.currentChapter) {
            console.log('组件挂载时加载当前章节:', props.currentChapter.title || props.currentChapter.id)
            // 先清空内容，避免显示旧内容
            content.value = '　　'
            // 确保DOM已更新
            await nextTick()
            await loadChapterContent(props.currentChapter)
          }
        }
        
        // 添加键盘事件监听
        document.addEventListener('keydown', handleKeydown)
        // 添加点击事件监听，用于隐藏右键菜单
        document.addEventListener('click', handleDocumentClick)
        
        // 初始化内容缩进和光标位置
        await nextTick(() => {
          initializeContent()
          updateCursorPosition()
        })
        
        console.log('NovelEditor组件挂载完成')
      } catch (error) {
        console.error('NovelEditor组件挂载失败:', error)
      }
    })
    
    onUnmounted(() => {
      // 清理事件监听器
      document.removeEventListener('keydown', handleKeydown)
      document.removeEventListener('click', handleDocumentClick)
    })

    return {
      selectedProjectId,
      availableProjects,
      currentProjectName,
      content,
      saving,
      lastSaveTime,
      currentLine,
      currentColumn,
      wordCount,
      lineCount,
      editor,
      lineNumbers,
      contextMenu,
      characterSelector,
      characterSelectorRef,
      handleContentChange,
      handleProjectChange,
      loadChapterContent,
      loadAvailableProjects,
      autoSaveContent,
      handleScroll,
      handleContextMenu,
      hideContextMenu,
      showCharacterSelector,
      hideCharacterSelector,
      insertCharacter,
      createNewCharacter,
      copyText,
      cutText,
      pasteText,
      selectAll,
      findReplace,
      insertDateTime,
      wordCountDetails,
      saveNovel,
      updateCursorPosition,
      handleKeyPress,
      initializeContent
    }
  }
}
</script>

<style scoped>
.novel-editor {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background: #f5f5f5;
  font-family: 'Microsoft YaHei', sans-serif;
  padding-bottom: 40px; /* 为底部状态栏留出空间 */
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.toolbar-left {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 15px;
}



.current-project {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.word-count {
  font-size: 14px;
  color: #666;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

.save-btn {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.save-btn:hover:not(:disabled) {
  background: #0056b3;
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.editor-container {
  flex: 1;
  display: flex;
  position: relative;
  background: #fff;
  margin: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  overflow: hidden;
}

.line-numbers {
  width: 60px;
  background: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  padding: 20px 0;
  overflow: hidden;
  user-select: none;
}

.line-number {
  height: 24px;
  line-height: 24px;
  text-align: center;
  font-size: 12px;
  color: #999;
  font-family: 'Consolas', 'Monaco', monospace;
}

.editor {
  flex: 1;
  border: none;
  outline: none;
  padding: 20px;
  font-size: 16px;
  line-height: 24px;
  font-family: 'Microsoft YaHei', sans-serif;
  resize: none;
  background: transparent;
}

.editor::placeholder {
  color: #ccc;
  font-style: italic;
}

.status-bar {
  position: fixed;
  bottom: 0;
  left: 250px; /* 从侧边栏宽度开始 */
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
  font-size: 12px;
  color: #666;
  z-index: 100;
  transition: left 0.3s ease;
}

.status-left {
  display: flex;
  gap: 20px;
}

/* 侧边栏适应样式 */
.sidebar-collapsed .status-bar {
  left: 60px; /* 侧边栏收起时的宽度 */
}

.sidebar-expanded .status-bar {
  left: 250px; /* 侧边栏展开时的宽度 */
}

/* 未选择章节提示样式 */
.no-chapter-selected {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  margin: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.no-chapter-message {
  text-align: center;
  padding: 40px;
  max-width: 400px;
}

.message-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.no-chapter-message h3 {
  margin: 0 0 10px;
  color: #2c3e50;
  font-size: 20px;
}

.no-chapter-message p {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

/* 滚动条样式 */
.editor::-webkit-scrollbar {
  width: 8px;
}

.editor::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.editor::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.editor::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .toolbar-right {
    justify-content: space-between;
  }
  
  .editor-container {
    margin: 10px;
  }
  
  .line-numbers {
    width: 40px;
  }
  
  .editor {
    padding: 15px;
    font-size: 14px;
  }
  
  .status-bar {
    left: 0; /* 移动端时状态栏占满宽度 */
  }
}
</style>