import { Injectable, inject, signal, computed, OnDestroy } from "@angular/core";
import { MockDataService } from "./mock-data.service";
import { readLocal, writeLocal } from "./local-store";

interface FocusState {
  duration: number;
  remaining: number;
  end: number | null;
  subjectId?: string;
}

@Injectable({ providedIn: "root" })
export class FocusService implements OnDestroy {
  private data = inject(MockDataService);
  private state = readLocal<FocusState>("lockin.focus", {
    duration: 1500,
    remaining: 1500,
    end: null,
  });
  readonly remaining = signal(this.state.remaining);
  readonly running = signal(this.state.end !== null);
  readonly duration = signal(this.state.duration);
  readonly subjectId = signal<string>(this.state.subjectId ?? "");
  readonly subjects = this.data.subjects;
  readonly message = signal("");
  // True once a session has started and until it is finished or reset.
  readonly locked = computed(
    () => this.running() || this.remaining() !== this.duration(),
  );
  readonly clock = computed(
    () =>
      String(Math.floor(this.remaining() / 60)).padStart(2, "0") +
      ":" +
      String(this.remaining() % 60).padStart(2, "0"),
  );
  private interval = setInterval(() => this.tick(), 1000);
  constructor() {
    this.tick();
  }
  private persist(): void {
    writeLocal("lockin.focus", this.state);
  }
  private tick(): void {
    if (this.state.end === null) return;
    this.remaining.set(
      Math.max(0, Math.ceil((this.state.end - Date.now()) / 1000)),
    );
    if (this.remaining() === 0) this.finish();
  }
  choose(minutes: number): void {
    if (this.running() || this.remaining() !== this.duration()) return;
    this.state = {
      duration: minutes * 60,
      remaining: minutes * 60,
      end: null,
      subjectId: this.subjectId(),
    };
    this.duration.set(minutes * 60);
    this.remaining.set(minutes * 60);
    this.persist();
  }
  setSubject(id: string): void {
    if (this.locked()) return;
    this.subjectId.set(id);
    this.state.subjectId = id;
    this.persist();
  }
  toggle(): void {
    this.message.set("");
    if (this.running()) {
      this.tick();
      if (!this.running()) return;
      this.state.remaining = this.remaining();
      this.state.end = null;
      this.running.set(false);
    } else {
      this.state.end = Date.now() + this.remaining() * 1000;
      this.running.set(true);
    }
    this.persist();
  }
  finish(): void {
    if (this.state.end !== null)
      this.remaining.set(
        Math.max(0, Math.ceil((this.state.end - Date.now()) / 1000)),
      );
    const elapsed = this.duration() - this.remaining();
    const subject = this.subjectId();
    this.data.addFocus(elapsed, subject || undefined);
    const name = this.data.subjectById(subject)?.name;
    this.message.set(
      elapsed > 0
        ? name
          ? `Session saved to ${name}. A little progress adds up.`
          : "Session saved. A little progress adds up."
        : "Start the timer to record a session.",
    );
    this.reset();
  }
  reset(): void {
    this.state = {
      duration: this.duration(),
      remaining: this.duration(),
      end: null,
      subjectId: this.subjectId(),
    };
    this.remaining.set(this.duration());
    this.running.set(false);
    this.persist();
  }
  ngOnDestroy(): void {
    clearInterval(this.interval);
  }
}