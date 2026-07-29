"use client";

import { useEffect, useMemo, useState } from "react";
import {
  courseTabs,
  getLessonDetail,
  stageLabels,
  type CourseTab,
} from "./course-data";
import LessonOne from "./lesson-one";
import LessonWorkspace from "./lesson-workspace";

type ProgressSnapshot = Record<
  string,
  {
    completed: number;
    total: number;
  }
>;

function isLessonNumber(value: string | null): value is string {
  return value !== null && courseTabs.some((lesson) => lesson.number === value);
}

function readSavedProgress(): ProgressSnapshot {
  const snapshot: ProgressSnapshot = {};
  for (const lesson of courseTabs) {
    const key = `juc-course.lesson-${lesson.number}.todos.v1`;
    try {
      const value = window.localStorage.getItem(key);
      const completed = value ? JSON.parse(value) : [];
      snapshot[lesson.number] = {
        completed: Array.isArray(completed) ? completed.length : 0,
        total: 8,
      };
    } catch {
      snapshot[lesson.number] = { completed: 0, total: 8 };
    }
  }
  return snapshot;
}

function CourseDock({
  activeLesson,
  progress,
  onSelect,
}: {
  activeLesson: string;
  progress: ProgressSnapshot;
  onSelect: (lesson: CourseTab) => void;
}) {
  const active = courseTabs.find((lesson) => lesson.number === activeLesson)!;
  const finishedLessons = courseTabs.filter((lesson) => {
    const value = progress[lesson.number];
    return value && value.completed >= value.total;
  }).length;

  return (
    <section className="course-dock" aria-label="16 课课程切换">
      <div className="dock-summary">
        <span>COURSE INDEX</span>
        <strong>JUC · 16 LESSONS</strong>
        <small>{finishedLessons} / 16 课完成</small>
      </div>
      <div className="course-tab-rail" role="tablist" aria-label="课程列表">
        {stageLabels.map((stageLabel, stageIndex) => (
          <div className="course-stage-group" key={stageLabel}>
            <span>
              STAGE {String(stageIndex + 1).padStart(2, "0")} · {stageLabel}
            </span>
            <div>
              {courseTabs
                .filter((lesson) => lesson.stage === stageIndex + 1)
                .map((lesson) => {
                  const lessonProgress = progress[lesson.number];
                  const isDone =
                    lessonProgress &&
                    lessonProgress.completed >= lessonProgress.total;
                  return (
                    <button
                      type="button"
                      role="tab"
                      aria-label={`第 ${lesson.number} 课：${lesson.title}`}
                      aria-selected={activeLesson === lesson.number}
                      className={`${activeLesson === lesson.number ? "is-active" : ""} ${
                        isDone ? "is-complete" : ""
                      }`}
                      onClick={() => onSelect(lesson)}
                      key={lesson.number}
                    >
                      <span>{isDone ? "✓" : lesson.number}</span>
                      <strong>{lesson.shortTitle}</strong>
                      <small>
                        {lessonProgress?.completed ?? 0}/
                        {lessonProgress?.total ?? 8}
                      </small>
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
      <div className="dock-active">
        <span>正在学习</span>
        <strong>
          {active.number} · {active.shortTitle}
        </strong>
        <small>横向滚动可查看全部课程</small>
      </div>
    </section>
  );
}

export default function Home() {
  const [activeLesson, setActiveLesson] = useState("01");
  const [progress, setProgress] = useState<ProgressSnapshot>({});

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const requested = new URL(window.location.href).searchParams.get("lesson");
      if (isLessonNumber(requested)) {
        setActiveLesson(requested);
        const selected = courseTabs.find(
          (lesson) => lesson.number === requested,
        );
        if (selected) {
          document.title = `JUC Core Lab · 第 ${selected.number} 课：${selected.title}`;
        }
      }
      setProgress(readSavedProgress());
    });

    function handleProgress(event: Event) {
      const custom = event as CustomEvent<{
        lesson: string;
        completed: number;
        total: number;
      }>;
      setProgress((current) => ({
        ...current,
        [custom.detail.lesson]: {
          completed: custom.detail.completed,
          total: custom.detail.total,
        },
      }));
    }

    function handleStorage() {
      setProgress(readSavedProgress());
    }

    function handlePopState() {
      const requested = new URL(window.location.href).searchParams.get("lesson");
      const nextLesson = isLessonNumber(requested) ? requested : "01";
      const selected = courseTabs.find((lesson) => lesson.number === nextLesson);

      setActiveLesson(nextLesson);
      document.title = selected
        ? `第 ${selected.number} 课 · ${selected.shortTitle} | JUC Core Lab`
        : "JUC Core Lab · 16 课交互学习站";
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
    () => (activeLesson === "01" ? undefined : getLessonDetail(activeLesson)),
    [activeLesson],
  );

  function selectLesson(lesson: CourseTab) {
    if (lesson.number === activeLesson) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setActiveLesson(lesson.number);
    const url = new URL(window.location.href);
    url.searchParams.set("lesson", lesson.number);
    window.history.pushState({}, "", url);
    document.title = `JUC Core Lab · 第 ${lesson.number} 课：${lesson.title}`;
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  return (
    <>
      <CourseDock
        activeLesson={activeLesson}
        progress={progress}
        onSelect={selectLesson}
      />
      {activeLesson === "01" ? (
        <LessonOne />
      ) : detail ? (
        <LessonWorkspace lesson={detail} key={detail.number} />
      ) : null}
    </>
  );
}
