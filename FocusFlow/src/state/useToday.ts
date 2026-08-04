import { useMemo } from 'react';
import { useApp } from './AppContext';
import { Ranked, manualOrder, rankTasks } from '../domain/recommender';
import { DayAssessment, assessDay } from '../domain/planning';
import { Task } from '../domain/types';
import { minutesLeftInDay } from '../domain/time';

export interface TodayView {
  /** Open tasks planned for today, in the order the current version says to work them. */
  ordered: Task[];
  /** Version 2 only: score, likelihood and explanation per task, keyed by task id. */
  rankings: Map<string, Ranked>;
  done: Task[];
  assessment: DayAssessment;
  /** Version 2 only: the single task the app is nudging toward right now. */
  nextUp: Ranked | null;
  predictive: boolean;
}

/**
 * The one place the version gate changes behaviour on Today: Version 1 sorts by
 * the user's manual order, Version 2 sorts by the recommender and attaches a
 * completion likelihood to each row.
 */
export function useToday(): TodayView {
  const { tasks, today, settings, intelligence, now } = useApp();

  return useMemo(() => {
    const planned = tasks.filter((t) => t.scheduledFor === today);
    const open = planned.filter((t) => t.status === 'open');
    const done = planned.filter((t) => t.status === 'done');
    const predictive = settings.appVersion >= 2;

    if (!predictive) {
      return {
        ordered: manualOrder(open),
        rankings: new Map<string, Ranked>(),
        done,
        assessment: assessDay(open, intelligence.profile, settings.dailyCapacityMin, null),
        nextUp: null,
        predictive,
      };
    }

    const ranked = rankTasks(open, {
      now,
      profile: intelligence.profile,
      weights: intelligence.weights,
      model: intelligence.model,
      remainingMin: minutesLeftInDay(now),
      capacityMin: settings.dailyCapacityMin,
    });

    return {
      ordered: ranked.map((r) => r.task),
      rankings: new Map(ranked.map((r) => [r.task.id, r])),
      done,
      assessment: assessDay(open, intelligence.profile, settings.dailyCapacityMin, ranked),
      nextUp: ranked[0] ?? null,
      predictive,
    };
  }, [tasks, today, settings.appVersion, settings.dailyCapacityMin, intelligence, now]);
}
