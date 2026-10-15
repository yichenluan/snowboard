(() => {
  'use strict';
  const legacy = window.SnowDemo;
  const runtime = window.SnowLesson3D;
  if (!legacy || !runtime || typeof runtime.canRender !== 'function') throw new Error('课程三维程序未正确打包');
  // Keep the established type/variant metadata for imports and pending lessons.
  window.SnowDemo = {...legacy, types:[...new Set([...legacy.types,...runtime.types])], mount(container, config) {
    return runtime.canRender(config) ? runtime.mount(container, config) : legacy.mount(container, config);
  }};
})();
