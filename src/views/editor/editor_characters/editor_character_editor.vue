<script setup lang="ts">
import Titlebar from '../../components/titlebar.vue'
import { onMounted, onBeforeUnmount, ref, watch, computed } from 'vue'
import AvatarCropper from './avatarCropper.vue'

const props = defineProps<{
  projectName: string
  projectPath: string
  character?: {
  id?: string | null
  name?: string
  gender?: string
  birthday?: string
  age?: string | number
  height?: string
  weight?: string
  blood?: string
  avatar?: string | null
}
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const close = () => emit('close')
const minimize = () => window.ipcRenderer.invoke('window-control', 'minimize')
const maximize = () => window.ipcRenderer.invoke('window-control', 'maximize')
const name = ref('')
const gender = ref('')
const birthday = ref('')
const age = ref('')
const height = ref('')
const weight = ref('')
const blood = ref('')
const avatar = ref<string | null>(null)
const cropImage = ref<string | null>(null)
const showCropper = ref(false)
const hasSaved = ref(false)
const currentId = ref<string | null>(null)
const statusText = computed(() => (hasSaved.value ? '已保存' : '未保存'))
const statusColor = computed(() => (hasSaved.value ? '#16982b' : '#e81123'))

const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    e.preventDefault()
    e.stopPropagation()
    if (typeof e.stopImmediatePropagation === 'function') {
      e.stopImmediatePropagation()
    }
    handleCloseRequest()
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault()
    e.stopPropagation()
    handleSaveOnly()
  }
}

onMounted(() => window.addEventListener('keydown', onKey, true))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey, true))

const saveCharacter = async () => {
  if (!name.value.trim()) {
    window.alert('请输入角色名称')
    return false
  }
  try {
    const result = await window.ipcRenderer.invoke('save-character', props.projectPath, {
      name: name.value,
      gender: gender.value,
      birthday: birthday.value,
      age: age.value,
      height: height.value,
      weight: weight.value,
      blood: blood.value,
      avatar: avatar.value,
    }, currentId.value)
    if (result?.id) {
      currentId.value = result.id as string
    }
    return true
  } catch (err) {
    console.error(err)
    window.alert('保存失败，请检查路径或权限')
    return false
  }
}

const handleSaveAndClose = async () => {
  const ok = await saveCharacter()
  if (ok) {
    hasSaved.value = true
    emit('saved')
    close()
  }
}

const handleCloseRequest = async () => {
  if (hasSaved.value) {
    close()
    return
  }
  const shouldSave = window.confirm('是否保存当前角色？')
  if (shouldSave) {
    await handleSaveAndClose()
  } else {
    close()
  }
}

const handleSaveOnly = async () => {
  const ok = await saveCharacter()
  if (ok) {
    hasSaved.value = true
    emit('saved')
  }
}

watch([name, gender, birthday, age, height, weight, blood], () => {
  hasSaved.value = false
})
watch(avatar, () => {
  hasSaved.value = false
})

const applyCharacter = (data?: typeof props.character) => {
  name.value = data?.name ?? ''
  gender.value = data?.gender ?? ''
  birthday.value = data?.birthday ?? ''
  age.value = data?.age ? String(data.age) : ''
  height.value = data?.height ?? ''
  weight.value = data?.weight ?? ''
  blood.value = data?.blood ?? ''
  avatar.value = data?.avatar ?? null
  currentId.value = (data?.id as string | undefined) ?? null
  hasSaved.value = !!data
}

watch(
  () => props.character,
  (val) => {
    applyCharacter(val)
  },
  { immediate: true },
)

const pickAvatar = async () => {
  const result = await window.ipcRenderer.invoke('select-avatar-image')
  if (result?.dataUrl) {
    cropImage.value = result.dataUrl as string
    showCropper.value = true
  }
}

const closeCropper = () => {
  showCropper.value = false
}

const handleCropSave = (dataUrl: string) => {
  avatar.value = dataUrl
  showCropper.value = false
}
</script>

<template>
  <div class="window">
    <Titlebar
      :name="`${props.projectName} | 创建角色`"
      :status-text="statusText"
      :status-color="statusColor"
      @close="handleCloseRequest"
      @minimize="minimize"
      @maximize="maximize"
    />
    <div class="content">
      <button type="button" class="avatar-placeholder" @click="pickAvatar">
        <template v-if="avatar">
          <img :src="avatar" alt="avatar" />
        </template>
        <template v-else>
          <span class="plus">＋</span>
          <span class="hint">选择头像</span>
        </template>
      </button>
      <div class="grid">
        <div class="field">
          <label for="character-name">
            <span class="required">*</span>角色名称
          </label>
          <input
            id="character-name"
            v-model="name"
            type="text"
            placeholder="请输入角色名称"
          />
        </div>
        <div class="field">
          <label for="gender">性别</label>
          <input id="gender" v-model="gender" type="text" placeholder="男/女/未知" />
        </div>
        <div class="field">
          <label for="birthday">出生日期</label>
          <input id="birthday" v-model="birthday" type="date" />
        </div>
        <div class="field">
          <label for="age">年龄</label>
          <input id="age" v-model="age" type="number" min="0" placeholder="年龄" />
        </div>
        <div class="field">
          <label for="height">身高</label>
          <input id="height" v-model="height" type="text" placeholder="cm" />
        </div>
        <div class="field">
          <label for="weight">体重</label>
          <input id="weight" v-model="weight" type="text" placeholder="kg" />
        </div>
        <div class="field">
          <label for="blood">血型</label>
          <input id="blood" v-model="blood" type="text" placeholder="A/B/O/AB" />
        </div>
      </div>
    </div>

    <AvatarCropper
      v-if="showCropper && cropImage"
      :image="cropImage"
      @cancel="closeCropper"
      @save="handleCropSave"
    />
  </div>
</template>

<style scoped>
.window {
  position: fixed;
  inset: 0;
  background: #f5f6fa;
  z-index: 40;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.titlebar {
  height: 32px;
}

.content {
  flex: 1;
  padding: 1rem 1.5rem;
  color: #2c2f36;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.avatar-placeholder {
  width: 96px;
  height: 96px;
  border: 1px dashed #d0d4dd;
  border-radius: 4px;
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 0.25rem;
  cursor: pointer;
  padding: 0.25rem;
}

.avatar-placeholder img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder:focus,
.avatar-placeholder:focus-visible {
  outline: none;
  box-shadow: none;
}

.plus {
  font-size: 1.4rem;
  line-height: 1;
  color: #6c7180;
}

.hint {
  font-size: 0.9rem;
  color: #6c7180;
}

.grid {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.field {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

label {
  font-weight: 600;
  min-width: 90px;
}

input {
  padding: 0.5rem 0.65rem;
  border: 1px solid #d0d4dd;
  border-radius: 4px;
  font-size: 0.95rem;
  box-sizing: border-box;
}

input:focus,
input:focus-visible {
  outline: none;
  box-shadow: none;
  border-color: #646cff;
}

.required {
  color: #e81123;
  margin-right: 4px;
}

</style>
