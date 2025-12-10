<template>
  <div>
    <div class="top-bar">
      <button type="button">新建项目</button>
      <button type="button" class="secondary">打开项目</button>
    </div>
    <div class="panel">
    <h3>项目</h3>
    <ul>
      <li>当前没有项目，点击“新建项目”。</li>
      <li>导入已有项目以继续编辑。</li>
    </ul>
    </div>
  </div>
</template>

<style scoped>
h3 {
  margin: 0 0 0.5rem;
}

ul {
  margin: 0;
  padding-left: 1rem;
  color: #6c7180;
}

.panel {
  padding: 1rem 1.25rem;
  border-radius: 20px;
  border: 1px solid #e2e4ea;
  background: #fff;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.04);
  width: calc(100% - 32px);
  max-width: 760px;
  margin: 1rem auto 0;
}

.top-bar {
  display: flex;
  gap: 0.75rem;
  position: fixed;
  top: 1rem;
  right: 1rem;
}

.secondary {
  background-color: transparent;
  border: 1px solid #646cff;
  color: #646cff;
}

.secondary:hover {
  color: #535bf2;
}
</style>
