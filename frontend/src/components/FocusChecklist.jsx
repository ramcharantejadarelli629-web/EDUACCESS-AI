import React, { useState } from 'react';
import { CheckSquare, Square, RotateCcw, Clock, Award } from 'lucide-react';

export default function FocusChecklist({ initialTasks = [] }) {
  const [tasks, setTasks] = useState(initialTasks);

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const resetAll = () => {
    setTasks((prev) => prev.map((t) => ({ ...t, completed: false })));
  };

  const markAllComplete = () => {
    setTasks((prev) => prev.map((t) => ({ ...t, completed: true })));
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  if (tasks.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Actionable study checklist"
      className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm card-panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
            <CheckSquare className="w-5 h-5 text-brand-600 dark:text-brand-400 mr-2" aria-hidden="true" />
            Actionable Study Checklist
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Break complex material into manageable steps (keyboard friendly)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={resetAll}
            aria-label="Reset checklist progress"
            className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
            Reset
          </button>
          <button
            type="button"
            onClick={markAllComplete}
            aria-label="Mark all checklist tasks as complete"
            className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-brand-700 dark:text-brand-300 hover:text-brand-900 bg-brand-50 dark:bg-brand-950/50 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            Mark All
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
          <span>{completedCount} of {tasks.length} tasks completed</span>
          <span>{progressPercent}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Checklist completion progress"
          className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden"
        >
          <div
            className="bg-brand-600 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {progressPercent === 100 && (
          <p
            role="status"
            aria-live="polite"
            className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center"
          >
            <Award className="w-4 h-4 mr-1" aria-hidden="true" />
            All tasks completed! Great work mastering this material.
          </p>
        )}
      </div>

      {/* Interactive Task Items */}
      <ul className="space-y-2" role="list">
        {tasks.map((task, idx) => (
          <li
            key={task.id || `task-${idx}`}
            onClick={() => toggleTask(task.id)}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                toggleTask(task.id);
              }
            }}
            tabIndex={0}
            role="checkbox"
            aria-checked={task.completed}
            aria-label={`Task: ${task.task}`}
            className={`flex items-start p-3 rounded-lg border transition-colors cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-brand-500 ${
              task.completed
                ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-brand-300 dark:hover:border-brand-600'
            }`}
          >
            <div className="mt-0.5 mr-3 flex-shrink-0 text-brand-600 dark:text-brand-400">
              {task.completed ? (
                <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              ) : (
                <Square className="w-5 h-5 text-slate-400" aria-hidden="true" />
              )}
            </div>

            <div className="flex-1">
              <span className={`text-sm ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'font-medium'}`}>
                {task.task}
              </span>
            </div>

            {task.estimated_minutes && (
              <span className="ml-2 flex items-center text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
                ~{task.estimated_minutes}m
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
