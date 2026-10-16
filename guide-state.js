(() => {
  "use strict";

  function parseLocation(hash) {
    const params = new URLSearchParams(String(hash || "").replace(/^#/, ""));
    return { lesson: params.get("lesson"), route: params.get("route") };
  }

  function lessonLocation(id, route) {
    const params = new URLSearchParams({ lesson: id });
    if (route) params.set("route", route);
    return "#" + params.toString();
  }

  function lessonSequence(data, id, routeId) {
    const lesson = data.lessons.find((item) => item.id === id);
    if (!lesson)
      return { route: null, lessons: [], previous: null, next: null };
    const route = (data.navigationRoutes || []).find(
      (item) => item.id === routeId && item.lessons.includes(id),
    );
    const lessons = route
      ? route.lessons
          .map((key) => data.lessons.find((item) => item.id === key))
          .filter(Boolean)
      : data.lessons.filter((item) => item.module === lesson.module);
    const index = lessons.findIndex((item) => item.id === id);
    return {
      route: route || null,
      lessons,
      previous: lessons[index - 1] || null,
      next: lessons[index + 1] || null,
    };
  }

  // Content always comes from this release. Only personal fields cross revisions.
  function readUser(saved) {
    const source = saved?.user || saved || {};
    // Preserve unknown personal fields verbatim; retired features do not interpret them.
    const user = { ...source };
    for (const key of [
      "bookmarks",
      "additions",
      "trash",
      "skillProgress",
    ]) {
      user[key] = Array.isArray(source[key]) ? source[key] : [];
    }
    user.skillTarget =
      typeof source.skillTarget === "string" ? source.skillTarget : "all";
    return user;
  }

  function userSnapshot(user, revision) {
    return { schemaVersion: 2, baseRevision: revision, user: readUser(user) };
  }

  function specialist(lesson) {
    return lesson.levelKey === "specialist";
  }

  function checks(lesson) {
    return [
      ...new Set([...(lesson.checks || []), ...(lesson.drill?.success || [])]),
    ];
  }

  window.SnowGuide = {
    parseLocation,
    lessonLocation,
    lessonSequence,
    readUser,
    userSnapshot,
    specialist,
    checks,
  };
})();
