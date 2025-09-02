<template>
  <label class="toggle-switch" :class="{ disabled: disabled }">
    <input 
      type="checkbox" 
      :checked="modelValue" 
      :disabled="disabled"
      @change="$emit('update:modelValue', $event.target.checked)"
    >
    <span class="slider" :class="{ checked: modelValue }"></span>
    <span v-if="label" class="toggle-label">{{ label }}</span>
  </label>
</template>

<script>
export default {
  name: 'ToggleSwitch',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    label: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue']
}
</script>

<style scoped>
.toggle-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.toggle-switch.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}

.slider {
  position: relative;
  width: 50px;
  height: 24px;
  background-color: #ccc;
  border-radius: 24px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
}

.slider:before {
  content: "";
  position: absolute;
  height: 18px;
  width: 18px;
  left: 3px;
  background-color: white;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider.checked {
  background-color: #2196f3;
}

.slider.checked:before {
  transform: translateX(26px);
}

.toggle-switch:hover .slider:not(.disabled) {
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.toggle-label {
  margin-left: 10px;
  font-size: 14px;
  color: #2c3e50;
}

/* 深色主题 */
body.dark-theme .toggle-label {
  color: #ffffff;
}

body.dark-theme .slider {
  background-color: #555;
}

body.dark-theme .slider.checked {
  background-color: #1976d2;
}
</style>