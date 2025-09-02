<template>
  <div class="setting-item" :class="{ 'danger-zone': isDanger }">
    <div class="setting-header">
      <label>{{ label }}</label>
      <div class="setting-control">
        <slot></slot>
      </div>
    </div>
    <p v-if="description" class="setting-description">{{ description }}</p>
  </div>
</template>

<script>
export default {
  name: 'SettingItem',
  props: {
    label: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    isDanger: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
.setting-item {
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f1f3f4;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item.danger-zone {
  background-color: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 6px;
  padding: 20px;
  margin-top: 20px;
}

.setting-item.danger-zone label {
  color: #c53030;
}

.setting-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.setting-header label {
  font-weight: 500;
  color: #2c3e50;
  font-size: 14px;
  flex: 1;
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.setting-description {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: #6c757d;
  line-height: 1.4;
}

/* 深色主题 */
body.dark-theme .setting-item {
  border-bottom-color: #404040;
}

body.dark-theme .setting-header label {
  color: #ffffff;
}

body.dark-theme .setting-description {
  color: #b0b0b0;
}

body.dark-theme .setting-item.danger-zone {
  background-color: #2d1b1b;
  border-color: #5c2626;
}

body.dark-theme .setting-item.danger-zone label {
  color: #ff6b6b;
}
</style>