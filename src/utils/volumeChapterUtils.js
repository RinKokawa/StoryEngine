/**
 * 卷章管理工具函数
 */

/**
 * 格式化字数显示
 * @param {number} wordCount 字数
 * @returns {string} 格式化后的字数字符串
 */
export function formatWordCount(wordCount) {
  if (!wordCount || wordCount === 0) return ''
  if (wordCount >= 10000) {
    return `${(wordCount / 10000).toFixed(1)}万字`
  }
  return `${wordCount}字`
}

/**
 * 计算字数（去除HTML标签和空白字符）
 * @param {string} content 内容
 * @returns {number} 字数
 */
export function calculateWordCount(content) {
  if (!content) return 0
  // 去除HTML标签
  const textContent = content.replace(/<[^>]*>/g, '')
  // 去除多余空白字符并计算字数
  return textContent.replace(/\s+/g, '').length
}

/**
 * 更新章节字数
 * @param {string} projectId 项目ID
 * @param {string} chapterId 章节ID
 * @param {string} content 章节内容
 * @param {Array} chapters 章节数组
 * @returns {Promise<number>} 更新后的字数
 */
export async function updateChapterWordCount(projectId, chapterId, content, chapters) {
  try {
    const { ServiceFactory } = await import('../services/storage/index.ts')
    const wordCount = calculateWordCount(content)
    
    // 更新本地数据
    const chapterIndex = chapters.findIndex(c => c.id === chapterId)
    if (chapterIndex !== -1) {
      chapters[chapterIndex] = {
        ...chapters[chapterIndex],
        wordCount: wordCount,
        lastModified: new Date().toISOString()
      }
    }

    // 保存到存储
    const chapter = chapters[chapterIndex]
    if (chapter) {
      const chapterService = ServiceFactory.getChapterService()
      await chapterService.updateChapter(projectId, {
        ...chapter,
        wordCount: wordCount
      })
    }

    return wordCount
  } catch (error) {
    console.error('更新章节字数失败:', error)
    return 0
  }
}

/**
 * 批量更新所有章节字数
 * @param {string} projectId 项目ID
 * @param {Array} chapters 章节数组
 * @returns {Promise<void>}
 */
export async function refreshAllWordCounts(projectId, chapters) {
  try {
    for (const chapter of chapters) {
      if (chapter.content) {
        await updateChapterWordCount(projectId, chapter.id, chapter.content, chapters)
      }
    }
  } catch (error) {
    console.error('批量更新字数失败:', error)
    throw error
  }
}

/**
 * 验证卷数据
 * @param {Object} volumeData 卷数据
 * @returns {boolean} 是否有效
 */
export function validateVolumeData(volumeData) {
  return volumeData && volumeData.title && volumeData.title.trim().length > 0
}

/**
 * 验证章节数据
 * @param {Object} chapterData 章节数据
 * @returns {boolean} 是否有效
 */
export function validateChapterData(chapterData) {
  return chapterData && 
         chapterData.title && 
         chapterData.title.trim().length > 0 &&
         chapterData.volumeId
}

/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * 深拷贝对象
 * @param {Object} obj 要拷贝的对象
 * @returns {Object} 拷贝后的对象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (typeof obj === 'object') {
    const clonedObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}

/**
 * 防抖函数
 * @param {Function} func 要防抖的函数
 * @param {number} wait 等待时间
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * 节流函数
 * @param {Function} func 要节流的函数
 * @param {number} limit 限制时间
 * @returns {Function} 节流后的函数
 */
export function throttle(func, limit) {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}