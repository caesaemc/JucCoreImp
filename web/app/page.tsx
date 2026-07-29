"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fastCourseTabs,
  getFastLessonDetail,
} from "./fast-course-data";
import type { CourseTab } from "./course-data";
import LessonWorkspace from "./lesson-workspace";

type Theme = "light" | "dark";

type ProgressSnapshot = Record<
  string,
  {
    completed: number;
    total: number;
  }
>;

const DEFAULT_LESSON = "02";
const TODO_TOTAL = 5;
const THEME_STORAGE_KEY = "juc-course.theme.v1";

function isLessonNumber(value: string | null): value is string {
  return (
    value !== null &&
    fastCourseTabs.some((lesson) => lesson.number === value)
  );
}

function readSavedProgress(): ProgressSnapshot {
  const snapshot: ProgressSnapshot = {};
  for (const lesson of fastCourseTabs) {
    try {
      const value = window.localStorage.getItem(
        `juc-course.lesson-${lesson.number}.todos.v2`,
      );
      const completed = value ? JSON.parse(value) : [];
      snapshot[lesson.number] = {
        completed: Array.isArray(completed)
          ? Math.min(completed.length, TODO_TOTAL)
          : 0,
        total: TODO_TOTAL,
      };
    } catch {
      snapshot[lesson.number] = { completed: 0, total: TODO_TOTAL };
    }
  }
  return snapshot;
}

function CourseDock({
  activeLesson,
  progress,
  theme,
  onSelect,
  onToggleTheme,
}: {
  activeLesson: string;
  progress: ProgressSnapshot;
  theme: Theme;
  onSelect: (lesson: CourseTab) => void;
  onToggleTheme: () => void;
}) {
  return (
    <section className="fast-course-dock" aria-label="6 课快速面试课程切换">
      <div className="fast-course-brand">
        <span>JC</span>
        <div>
          <strong>JUC 快速面试课</strong>
          <small>16 课已合并为 6 课</small>
        </div>
      </div>

      <nav className="fast-course-tabs" aria-label="课程列表">
        {fastCourseTabs.map((lesson) => {
          const value = progress[lesson.number] ?? {
            completed: 0,
            total: TODO_TOTAL,
          };
          const done = value.completed === value.total;
          return (
            <button
              type="button"
              aria-label={`第 ${lesson.number} 课：${lesson.title}`}
              aria-current={activeLesson === lesson.number ? "page" : undefined}
              className={`${activeLesson === lesson.number ? "is-active" : ""} ${
                done ? "is-done" : ""
              }`}
              onClick={() => onSelect(lesson)}
              key={lesson.number}
            >
              <span>{done ? "✓" : lesson.number}</span>
              <strong>{lesson.shortTitle}</strong>
              <small>{value.completed}/{value.total}</small>
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        className="simple-theme-toggle"
        aria-label={`切换为${theme === "light" ? "深色" : "浅色"}模式`}
        onClick={onToggleTheme}
      >
        <span aria-hidden="true">{theme === "light" ? "☀" : "☾"}</span>
        <strong>{theme === "light" ? "浅色" : "深色"}</strong>
      </button>
    </section>
  );
}

export default function Home() {
  const [activeLesson, setActiveLesson] = useState(DEFAULT_LESSON);
  const [progress, setProgress] = useState<ProgressSnapshot>({});
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setTheme(
        document.documentElement.dataset.theme === "dark" ? "dark" : "light",
      );

      const requested = new URL(window.location.href).searchParams.get("lesson");
      const selectedNumber = isLessonNumber(requested)
        ? requested
        : DEFAULT_LESSON;
      setActiveLesson(selectedNumber);
      setProgress(readSavedProgress());

      const selected = fastCourseTabs.find(
        (lesson) => lesson.number === selectedNumber,
      );
      if (selected) {
        document.title = `第 ${selected.number} 课 · ${selected.title} | JUC 快速面试课`;
      }
    });

    function handleProgress(event: Event) {
      const detail = (
        event as CustomEvent<{
          lesson: string;
          completed: number;
          total: number;
        }>
      ).detail;
      setProgress((current) => ({
        ...current,
        [detail.lesson]: {
          completed: detail.completed,
          total: detail.total,
        },
      }));
    }

    function handleStorage(event: StorageEvent) {
      setProgress(readSavedProgress());
      if (
        event.key === THEME_STORAGE_KEY &&
        (event.newValue === "light" || event.newValue === "dark")
      ) {
        document.documentElement.dataset.theme = event.newValue;
        document.documentElement.style.colorScheme = event.newValue;
        setTheme(event.newValue);
      }
    }

    function handlePopState() {
      const requested = new URL(window.location.href).searchParams.get("lesson");
      setActiveLesson(
        isLessonNumber(requested) ? requested : DEFAULT_LESSON,
      );
    }

    window.addEventListener("juc-progress-update", handleProgress);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("juc-progress-update", handleProgress);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const detail = useMemo(
    () => getFastLessonDetail(activeLesson),
    [activeLesson],
  );

  function selectLesson(lesson: CourseTab) {
    setActiveLesson(lesson.number);
    const url = new URL(window.location.href);
    url.searchParams.set("lesson", lesson.number);
    window.history.pushState({}, "", url);
    document.title = `第 ${lesson.number} 课 · ${lesson.title} | JUC 快速面试课`;
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function toggleTheme() {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // 本地存储不可用时，当前页面仍可切换配色。
    }
    setTheme(nextTheme);
  }

  return (
    <>
      <CourseDock
        activeLesson={activeLesson}
        progress={progress}
        theme={theme}
        onSelect={selectLesson}
        onToggleTheme={toggleTheme}
      />
      {detail ? <LessonWorkspace lesson={detail} key={detail.number} /> : null}
    </>
  );
}
