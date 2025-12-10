<template>
  <div class="manuscript-body">
    <h4>正文内容</h4>
    <textarea placeholder="在这里撰写正文..." />
  </div>
</template>

<style scoped>
.manuscript-body h4 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.manuscript-body textarea {
  width: 100%;
  height: 100%;
  min-height: 240px;
  resize: vertical;
  border: 1px solid #d0d4dd;
  padding: 0.65rem;
  font-size: 0.95rem;
  box-sizing: border-box;
}

.manuscript-body textarea:focus,
.manuscript-body textarea:focus-visible {
  outline: none;
  box-shadow: none;
  border-color: #646cff;
}
</style>
