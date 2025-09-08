<template>
  <div class="ide-demo">
    <div class="demo-header">
      <h1>StoryEngine IDE 模式演示</h1>
      <p>体验像写代码一样写小说的全新创作方式</p>
      <div class="demo-actions">
        <button @click="loadDemoProject" class="btn btn-primary">
          <span class="icon">🚀</span>
          加载演示项目
        </button>
        <button @click="createNewProject" class="btn btn-secondary">
          <span class="icon">📝</span>
          创建新项目
        </button>
      </div>
    </div>

    <div class="demo-content" v-if="demoProject">
      <StoryEditorIDE 
        :current-project="demoProject"
        :current-chapter="currentChapter"
        :context-data="contextData"
        @content-changed="handleContentChanged"
        @mention-trigger="handleMentionTrigger"
        @project-changed="handleProjectChanged"
      />
    </div>

    <div class="demo-features" v-else>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">💻</div>
          <h3>IDE式界面</h3>
          <p>多面板布局，所有创作资源一屏显示，提升写作效率</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">🎯</div>
          <h3>智能提示</h3>
          <p>@人物、#设定、/大纲，智能补全让创作更流畅</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">📚</div>
          <h3>上下文感知</h3>
          <p>根据当前章节自动显示相关人物和设定信息</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">📝</div>
          <h3>快速笔记</h3>
          <p>随时记录灵感，支持章节关联和标签分类</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">🔄</div>
          <h3>实时同步</h3>
          <p>自动保存，多设备同步，永不丢失创作内容</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">🎨</div>
          <h3>个性化定制</h3>
          <p>可调整面板布局，支持主题切换和快捷键自定义</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import StoryEditorIDE from './StoryEditorIDE.vue'

export default {
  name: 'IDEDemo',
  components: {
    StoryEditorIDE
  },
  setup() {
    const demoProject = ref(null)
    const currentChapter = ref(null)
    const contextData = ref(null)

    // 创建演示项目数据
    const createDemoData = () => {
      const project = {
        id: 'demo-project-1',
        title: '魔法学院的秘密',
        description: '一个关于魔法、友谊与成长的奇幻故事',
        author: '演示作者',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const chapter = {
        id: 'demo-chapter-1',
        projectId: project.id,
        title: '初入学院',
        order: 1,
        content: `　　艾莉娅站在魔法学院的大门前，心中既兴奋又紧张。

　　这座古老的建筑在夕阳下显得格外神秘，高耸的尖塔直插云霄，墙壁上爬满了会发光的藤蔓。她深深吸了一口气，推开了厚重的橡木门。

　　"欢迎来到阿卡迪亚魔法学院。"一个温和的声音响起。

　　艾莉娅转过头，看到一位穿着深蓝色长袍的中年女性正微笑着看着她。女性的眼中闪烁着智慧的光芒，手中握着一根雕刻精美的法杖。

　　"我是@教授麦格，负责新生入学事宜。"女性继续说道，"你一定就是艾莉娅·斯通吧？我们已经等你很久了。"

　　艾莉娅点点头，声音有些颤抖："是的，教授。我...我真的能在这里学习魔法吗？"

　　麦格教授温和地笑了笑："当然，孩子。不过首先，让我带你了解一下#魔法学院的规则和传统。"`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const characters = [
        {
          id: 'char-1',
          projectId: project.id,
          name: '艾莉娅·斯通',
          type: '主角',
          description: '16岁的魔法新生，来自普通家庭，拥有罕见的元素魔法天赋',
          appearance: '棕色长发，绿色眼睛，身材娇小但意志坚定',
          personality: '勇敢、善良、好奇心强，但有时过于冲动',
          background: '在普通世界长大，直到16岁才发现自己的魔法天赋',
          relationships: '与室友莉莉成为好友，暗恋学长亚历克斯',
          abilities: '元素魔法（火、水、土、风），治愈术',
          goals: '掌握魔法，保护朋友，揭开家族秘密'
        },
        {
          id: 'char-2',
          projectId: project.id,
          name: '教授麦格',
          type: '导师',
          description: '阿卡迪亚魔法学院的变形术教授，严厉但关爱学生',
          appearance: '中年女性，银白色头发，深蓝色长袍',
          personality: '严格、智慧、公正，对学生要求很高但内心温暖',
          background: '学院毕业生，曾是著名的魔法师，后回到学院任教',
          relationships: '艾莉娅的导师，与校长关系密切',
          abilities: '变形术大师，防御魔法专家',
          goals: '培养优秀的魔法师，保护学院安全'
        }
      ]

      const worldSettings = [
        {
          id: 'world-1',
          projectId: project.id,
          title: '魔法学院',
          type: '地点',
          description: '阿卡迪亚魔法学院是世界上最古老的魔法教育机构',
          details: `建筑特色：
- 主楼：哥特式建筑，有七座高塔
- 图书馆：藏有数万本魔法书籍和古老卷轴
- 练习场：用于魔法实战训练
- 宿舍：按照魔法属性分配房间

学院规则：
- 禁止在宿舍使用攻击性魔法
- 图书馆内必须保持安静
- 晚上10点后不得离开宿舍
- 严禁私自进入禁书区`,
          tags: ['学院', '建筑', '规则']
        },
        {
          id: 'world-2',
          projectId: project.id,
          title: '魔法系统',
          type: '设定',
          description: '这个世界的魔法分为多个流派和等级',
          details: `魔法流派：
- 元素魔法：操控火、水、土、风四大元素
- 变形术：改变物体形态和性质
- 治愈术：恢复伤势和治疗疾病
- 预言术：预知未来和感知危险
- 黑魔法：被禁止的危险魔法

魔法等级：
- 初学者：刚入门的学生
- 学徒：掌握基础魔法
- 法师：能独立施展复杂魔法
- 大法师：魔法造诣极高
- 传奇法师：传说中的存在`,
          tags: ['魔法', '系统', '等级']
        }
      ]

      const outline = [
        {
          id: 'outline-1',
          projectId: project.id,
          title: '第一章：初入学院',
          order: 1,
          description: '艾莉娅来到魔法学院，遇到麦格教授，开始了解学院生活',
          plotPoints: [
            '艾莉娅到达学院大门',
            '遇到麦格教授',
            '参观学院设施',
            '分配宿舍',
            '遇到室友莉莉'
          ],
          status: 'writing'
        },
        {
          id: 'outline-2',
          projectId: project.id,
          title: '第二章：第一堂课',
          order: 2,
          description: '艾莉娅参加第一堂魔法课，展现出惊人的天赋',
          plotPoints: [
            '早晨的魔法理论课',
            '下午的实践课',
            '艾莉娅的魔法爆发',
            '同学们的惊讶反应',
            '麦格教授的特别关注'
          ],
          status: 'planned'
        }
      ]

      return {
        project,
        chapter,
        characters,
        worldSettings,
        outline
      }
    }

    // 加载演示项目
    const loadDemoProject = () => {
      const demoData = createDemoData()
      demoProject.value = demoData.project
      currentChapter.value = demoData.chapter
      contextData.value = {
        characters: demoData.characters,
        worldSettings: demoData.worldSettings,
        outline: demoData.outline
      }
    }

    // 创建新项目
    const createNewProject = () => {
      // 这里可以打开项目创建对话框
      alert('创建新项目功能正在开发中...')
    }

    // 处理内容变化
    const handleContentChanged = (content) => {
      console.log('内容已更改:', content.length, '字符')
    }

    // 处理提及触发
    const handleMentionTrigger = (trigger, query) => {
      if (!contextData.value) return []

      switch (trigger) {
        case '@':
          return contextData.value.characters
            .filter(char => char.name.toLowerCase().includes(query.toLowerCase()))
            .map(char => ({
              id: char.id,
              name: char.name,
              type: char.type,
              icon: char.type === '主角' ? '👤' : char.type === '导师' ? '👨‍🏫' : '👥'
            }))
        
        case '#':
          return contextData.value.worldSettings
            .filter(setting => setting.title.toLowerCase().includes(query.toLowerCase()))
            .map(setting => ({
              id: setting.id,
              title: setting.title,
              description: setting.type,
              icon: setting.type === '地点' ? '🏛️' : setting.type === '设定' ? '⚙️' : '📚'
            }))
        
        case '/':
          return contextData.value.outline
            .filter(item => item.title.toLowerCase().includes(query.toLowerCase()))
            .map(item => ({
              id: item.id,
              title: item.title,
              description: `第${item.order}章`,
              icon: '📋'
            }))
        
        default:
          return []
      }
    }

    // 处理项目变化
    const handleProjectChanged = (project) => {
      console.log('项目已切换:', project.title)
    }

    onMounted(() => {
      // 可以在这里加载用户的项目列表
    })

    return {
      demoProject,
      currentChapter,
      contextData,
      loadDemoProject,
      createNewProject,
      handleContentChanged,
      handleMentionTrigger,
      handleProjectChanged
    }
  }
}
</script>

<style scoped>
.ide-demo {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

.demo-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 20px;
  text-align: center;
}

.demo-header h1 {
  margin: 0 0 12px 0;
  font-size: 32px;
  font-weight: 700;
}

.demo-header p {
  margin: 0 0 32px 0;
  font-size: 18px;
  opacity: 0.9;
}

.demo-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
}

.btn-primary {
  background: #28a745;
  color: white;
}

.btn-primary:hover {
  background: #218838;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.demo-content {
  flex: 1;
  overflow: hidden;
}

.demo-features {
  flex: 1;
  padding: 60px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
}

.feature-card {
  background: white;
  padding: 32px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.3s, box-shadow 0.3s;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.feature-card h3 {
  margin: 0 0 16px 0;
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
}

.feature-card p {
  margin: 0;
  color: #6c757d;
  line-height: 1.6;
}

.icon {
  font-size: 18px;
}

@media (max-width: 768px) {
  .demo-header {
    padding: 30px 15px;
  }
  
  .demo-header h1 {
    font-size: 24px;
  }
  
  .demo-header p {
    font-size: 16px;
  }
  
  .demo-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .btn {
    width: 200px;
    justify-content: center;
  }
  
  .demo-features {
    padding: 40px 15px;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .feature-card {
    padding: 24px;
  }
}
</style>