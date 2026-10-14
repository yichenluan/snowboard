(() => {
  'use strict';
  const legacy = window.SnowDemo;
  const runtime = window.SnowLesson3D;
  if (!legacy || !runtime || !Array.isArray(runtime.types)) throw new Error('课程三维程序未正确打包');
  const modern = new Set(runtime.types);
  // Keep the established type/variant metadata for imports and pending lessons.
  window.SnowDemo = {...legacy, mount(container, config) {
    return modern.has(config.type) ? runtime.mount(container, config) : legacy.mount(container, config);
  }};
})();
