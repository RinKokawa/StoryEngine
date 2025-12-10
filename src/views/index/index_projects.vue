<template>
  <div class="projects">
    <div class="top-bar">
      <button type="button">新建项目</button>
      <button type="button" class="secondary">打开项目</button>
    </div>
    <section class="content">
      <h3>项目</h3>
      <ul>
        <li>当前没有项目，点击“新建项目”。</li>
        <li>导入已有项目以继续编辑。</li>
      </ul>
    </section>
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

.content {
  width: min(760px, calc(100% - 32px));
  margin: 2.5rem auto 0;
}

.top-bar {
  display: flex;
  gap: 0.75rem;
  position: fixed;
  top: 1rem;
  right: 1rem;
}

.projects {
  padding-top: 3rem;
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
