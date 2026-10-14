import { Component, computed, inject, signal } from "@angular/core";
import {
  IonContent,
  IonIcon,
  ModalController,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  sparklesOutline,
  homeOutline,
  calendarOutline,
  bookOutline,
  personOutline,
} from "ionicons/icons";

interface TourStep {
  icon: string;
  title: string;
  body: string;
  tips: string[];
}

@Component({
  selector: "app-welcome-tour",
  standalone: true,
  imports: [IonContent, IonIcon],
  template: `
    <ion-content class="ion-padding">
      <div class="tour">
        <button class="skip" type="button" (click)="finish()">Skip</button>

        <div class="icon"><ion-icon [name]="current().icon"></ion-icon></div>
        <h2>{{ current().title }}</h2>
        <p class="lead">{{ current().body }}</p>

        <ul>
          @for (tip of current().tips; track tip) {
            <li>{{ tip }}</li>
          }
        </ul>

        <div class="dots">
          @for (s of steps; track $index) {
            <span [class.on]="$index === step()"></span>
          }
        </div>

        <div class="actions">
          @if (step() > 0) {
            <button type="button" class="secondary" (click)="back()">
              Back
            </button>
          }
          <button type="button" class="primary" (click)="next()">
            {{ isLast() ? "Get started" : "Next" }}
          </button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .tour {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 24px 8px 8px;
        min-height: 100%;
      }
      .skip {
        position: absolute;
        top: 4px;
        right: 4px;
        background: none;
        border: 0;
        color: var(--ion-color-medium);
        font-size: 14px;
        padding: 8px;
      }
      .icon {
        width: 72px;
        height: 72px;
        border-radius: 22px;
        display: grid;
        place-items: center;
        background: var(--ion-color-primary);
        color: var(--ion-color-primary-contrast, #fff);
        font-size: 34px;
        margin-bottom: 18px;
      }
      h2 {
        margin: 0 0 8px;
        font-size: 22px;
        font-weight: 700;
      }
      .lead {
        margin: 0 0 16px;
        color: var(--ion-color-medium);
        line-height: 1.5;
      }
      ul {
        list-style: none;
        margin: 0 0 20px;
        padding: 0;
        width: 100%;
        text-align: left;
      }
      li {
        padding: 10px 12px;
        margin-bottom: 8px;
        border-radius: 12px;
        background: var(--ion-color-light, rgba(127, 127, 127, 0.12));
        font-size: 14px;
        line-height: 1.4;
      }
      .dots {
        display: flex;
        gap: 6px;
        margin: auto 0 16px;
        padding-top: 8px;
      }
      .dots span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--ion-color-medium);
        opacity: 0.35;
      }
      .dots span.on {
        background: var(--ion-color-primary);
        opacity: 1;
        width: 22px;
        border-radius: 4px;
      }
      .actions {
        display: flex;
        gap: 10px;
        width: 100%;
      }
      .actions button {
        flex: 1;
        border: 0;
        border-radius: 14px;
        padding: 14px;
        font-size: 16px;
        font-weight: 600;
      }
      .primary {
        background: var(--ion-color-primary);
        color: var(--ion-color-primary-contrast, #fff);
      }
      .secondary {
        background: var(--ion-color-light, rgba(127, 127, 127, 0.12));
        color: var(--ion-text-color);
      }
    `,
  ],
})
export class WelcomeTourComponent {
  private modalCtrl = inject(ModalController);

  readonly steps: TourStep[] = [
    {
      icon: "sparkles-outline",
      title: "Welcome to Lock In",
      body: "Plan your study time, track your focus, and keep your materials in one place.",
      tips: [
        "Everything you add is saved on this phone only.",
        "You start with a clean slate. Nothing is pre-filled.",
        "This quick tour covers each tab. You can skip it any time.",
      ],
    },
    {
      icon: "home-outline",
      title: "Home",
      body: "Your day at a glance.",
      tips: [
        "See today's tasks and tick them off as you finish.",
        "Use the + buttons to add a quiz or task, or a study material.",
        "Edit or delete a task from the list if plans change.",
      ],
    },
    {
      icon: "calendar-outline",
      title: "Calendar",
      body: "Plan ahead week by week.",
      tips: [
        "Tap a day in the week strip to see what's planned.",
        "Use the arrows to move between weeks, and Today to jump back.",
        "Tap the + button to add a task to the day you selected.",
      ],
    },
    {
      icon: "book-outline",
      title: "Study",
      body: "Your subjects, focus timer and materials.",
      tips: [
        "Each subject shows progress based on the tasks you finish.",
        "Run the focus timer to log study time and build your streak.",
        "Tap a subject to see its materials, or add PDFs, images and links.",
      ],
    },
    {
      icon: "person-outline",
      title: "Profile",
      body: "Make the app yours. A good first stop.",
      tips: [
        "Add your name, email and study goal, then save.",
        "Switch dark mode and reminders on or off.",
        "Your study hours, streak and completed quizzes show up here too.",
      ],
    },
  ];

  readonly step = signal(0);
  readonly current = computed(() => this.steps[this.step()]);
  readonly isLast = computed(() => this.step() === this.steps.length - 1);

  constructor() {
    addIcons({
      sparklesOutline,
      homeOutline,
      calendarOutline,
      bookOutline,
      personOutline,
    });
  }

  next(): void {
    if (this.isLast()) this.finish();
    else this.step.update((s) => s + 1);
  }

  back(): void {
    this.step.update((s) => Math.max(0, s - 1));
  }

  finish(): void {
    this.modalCtrl.dismiss(null, "done");
  }
}