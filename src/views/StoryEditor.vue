<template>
  <div class="story-editor">
    <h1>故事编辑</h1>
    <NovelEditor />
  </div>
</template>

<script>
import NovelEditor from '../components/NovelEditor.vue'

export default {
  name: 'StoryEditor',
  components: {
    NovelEditor
  }
}
</script>

<style scoped>
.story-editor {
  padding: 20px;
  height: 100%;
}

h1 {
  margin-bottom: 20px;
  color: #2c3e50;
}
</style>