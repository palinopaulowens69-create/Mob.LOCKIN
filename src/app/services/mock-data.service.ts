import { readLocal, writeLocal, localDate, timeMinutes } from "./local-store";
import { Injectable, computed, signal, effect } from "@angular/core";
import {
  FocusSession,
  Material,
  StudyTask,
  Subject,
  UserProfile,
} from "../models/models";

// Built-in subject catalog. The app has no "add subject" screen, so these stay
// as fixed defaults; topicCount and progress are computed from real tasks.
const SUBJECTS: Subject[] = [
  {
    id: "calc",
    name: "Calculus",
    icon: "calculator-outline",
    color: "var(--subject-calculus)",
    topicCount: 0,
    progress: 0,
  },
  {
    id: "phys",
    name: "Physics",
    icon: "planet-outline",
    color: "var(--subject-physics)",
    topicCount: 0,
    progress: 0,
  },
  {
    id: "chem",
    name: "Chemistry",
    icon: "flask-outline",
    color: "var(--subject-chemistry)",
    topicCount: 0,
    progress: 0,
  },
  {
    id: "bio",
    name: "Biology",
    icon: "leaf-outline",
    color: "var(--subject-biology)",
    topicCount: 0,
    progress: 0,
  },
];

const EMPTY_PROFILE: UserProfile = {
  name: "",
  email: "",
  avatarInitials: "?",
  studyGoal: "",
  school: "",
};

function readList<T>(key: string): T[] {
  const value = readLocal<unknown>(key, []);
  return Array.isArray(value) ? (value as T[]) : [];
}

@Injectable({ providedIn: "root" })
export class MockDataService {
  readonly now = signal(new Date());
  private readonly clock = setInterval(() => this.now.set(new Date()), 30000);
  ngOnDestroy(): void {
    clearInterval(this.clock);
  }

  // Everything below starts from what is saved on the device (empty on first run).
  private readonly _subjects = signal<Subject[]>(SUBJECTS);
  private readonly _tasks = signal<StudyTask[]>(readList<StudyTask>("lockin.tasks"));
  private readonly _materials = signal<Material[]>(
    readList<Material>("lockin.materials"),
  );
  private readonly _profile = signal<UserProfile>({
    ...EMPTY_PROFILE,
    ...readLocal<Partial<UserProfile>>("lockin.profile", {}),
  });

  readonly sessions = signal<FocusSession[]>(
    readList<FocusSession>("lockin.sessions"),
  );
  readonly studyHours = computed(() =>
    (this.sessions().reduce((sum, s) => sum + s.seconds, 0) / 3600).toFixed(1),
  );

  // Study minutes for each of the last 7 days (oldest first, today last).
  readonly weekMinutes = computed(() => {
    const out: { date: string; label: string; minutes: number; today: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(this.now());
      d.setDate(d.getDate() - i);
      const date = localDate(d);
      const seconds = this.sessions()
        .filter((s) => s.date === date)
        .reduce((sum, s) => sum + s.seconds, 0);
      out.push({
        date,
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        minutes: Math.round(seconds / 60),
        today: i === 0,
      });
    }
    return out;
  });
  // Tallest bar. Never below 30 so one short session doesn't fill the chart.
  readonly weekMax = computed(() =>
    Math.max(30, ...this.weekMinutes().map((d) => d.minutes)),
  );
  readonly weekTotalMinutes = computed(() =>
    this.weekMinutes().reduce((sum, d) => sum + d.minutes, 0),
  );

  // All-time study minutes per subject. Older sessions with no subject are
  // grouped under "No subject".
  readonly subjectMinutes = computed(() => {
    const totals = new Map<string, number>();
    for (const s of this.sessions()) {
      const key = s.subjectId ?? "";
      totals.set(key, (totals.get(key) ?? 0) + s.seconds);
    }
    const rows = this._subjects().map((sub) => ({
      id: sub.id,
      name: sub.name,
      color: sub.color,
      minutes: Math.round((totals.get(sub.id) ?? 0) / 60),
    }));
    const other = Math.round((totals.get("") ?? 0) / 60);
    if (other)
      rows.push({
        id: "",
        name: "No subject",
        color: "var(--ion-color-medium)",
        minutes: other,
      });
    return rows;
  });
  readonly subjectMax = computed(() =>
    Math.max(1, ...this.subjectMinutes().map((r) => r.minutes)),
  );

  readonly completedQuizzes = computed(
    () => this.tasks().filter((t) => t.type === "quiz" && t.done).length,
  );
  readonly streak = computed(() => {
    const dates = new Set(this.sessions().map((s) => s.date));
    let count = 0;
    const day = new Date(this.now());
    if (!dates.has(localDate(day))) day.setDate(day.getDate() - 1);
    while (dates.has(localDate(day))) {
      count++;
      day.setDate(day.getDate() - 1);
    }
    return count;
  });
  readonly upcoming = computed(
    () =>
      this.tasks()
        .filter(
          (t) =>
            !t.done &&
            (t.date > this.today() ||
              (t.date === this.today() &&
                timeMinutes(t.startTime) >=
                  new Date().getHours() * 60 + new Date().getMinutes())),
        )
        .sort(
          (a, b) =>
            a.date.localeCompare(b.date) ||
            timeMinutes(a.startTime) - timeMinutes(b.startTime),
        )[0],
  );

  constructor() {
    // Save to the device whenever anything changes.
    effect(() => writeLocal("lockin.tasks", this._tasks()), {
      allowSignalWrites: true,
    });
    effect(() => writeLocal("lockin.materials", this._materials()), {
      allowSignalWrites: true,
    });
    effect(() => writeLocal("lockin.profile", this._profile()), {
      allowSignalWrites: true,
    });
    effect(() => writeLocal("lockin.sessions", this.sessions()), {
      allowSignalWrites: true,
    });
  }
  updateProfile(
    value: Pick<UserProfile, "name" | "email" | "studyGoal" | "school">,
  ): void {
    const parts = value.name.trim().split(/\s+/);
    this._profile.update((p) => ({
      ...p,
      ...value,
      avatarInitials: (
        parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")
      ).toUpperCase(),
    }));
  }
  updateTask(id: string, task: Partial<StudyTask>): void {
    this._tasks.update((list) =>
      list.map((t) => (t.id === id ? { ...t, ...task, id } : t)),
    );
  }
  removeTask(id: string): void {
    this._tasks.update((list) => list.filter((t) => t.id !== id));
  }
  updateMaterial(id: string, material: Partial<Material>): void {
    this._materials.update((list) =>
      list.map((m) => (m.id === id ? { ...m, ...material, id } : m)),
    );
  }
  addFocus(seconds: number, subjectId?: string): void {
    if (seconds > 0)
      this.sessions.update((list) => [
        ...list,
        { id: crypto.randomUUID(), date: this.today(), seconds, subjectId },
      ]);
  }

  // Public read-only signals
  readonly subjects = computed(() =>
    this._subjects().map((subject) => {
      const tasks = this._tasks().filter((t) => t.subjectId === subject.id);
      return {
        ...subject,
        topicCount: tasks.length,
        progress: tasks.length
          ? Math.round(
              (tasks.filter((t) => t.done).length / tasks.length) * 100,
            )
          : 0,
      };
    }),
  );
  readonly tasks = this._tasks.asReadonly();
  readonly materials = this._materials.asReadonly();
  readonly profile = this._profile.asReadonly();

  readonly todaysTasks = computed(() =>
    this._tasks()
      .filter((t) => t.date === this.today())
      .sort((a, b) => timeMinutes(a.startTime) - timeMinutes(b.startTime)),
  );

  readonly completionRate = computed(() => {
    const tasks = this.todaysTasks();
    if (!tasks.length) return 0;
    return Math.round(
      (tasks.filter((t) => t.done).length / tasks.length) * 100,
    );
  });

  readonly todaysCompleted = computed(
    () => this.todaysTasks().filter((task) => task.done).length,
  );

  // ---- helpers ----
  today(): string {
    return localDate(this.now());
  }

  addDays(offset: number): string {
    const d = new Date(this.now());
    d.setDate(d.getDate() + offset);
    return localDate(d);
  }

  subjectById(id: string): Subject | undefined {
    return this.subjects().find((s) => s.id === id);
  }

  tasksForDate(date: string): StudyTask[] {
    return this._tasks()
      .filter((t) => t.date === date)
      .sort((a, b) => timeMinutes(a.startTime) - timeMinutes(b.startTime));
  }

  // ---- mutations ----
  toggleTaskDone(id: string): void {
    this._tasks.update((list) =>
      list.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  }

  addTask(task: Omit<StudyTask, "id" | "done">): void {
    const id = "t" + Math.random().toString(36).slice(2, 9);
    this._tasks.update((list) => [...list, { ...task, id, done: false }]);
  }

  addMaterial(material: Omit<Material, "id" | "addedOn">): void {
    const id = "m" + Math.random().toString(36).slice(2, 9);
    this._materials.update((list) => [
      { ...material, id, addedOn: this.today() },
      ...list,
    ]);
  }

  removeMaterial(id: string): void {
    this._materials.update((list) => list.filter((m) => m.id !== id));
  }
}