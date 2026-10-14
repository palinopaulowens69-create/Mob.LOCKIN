import { TaskListComponent } from "../../components/task-list/task-list.component";
import { localDate, readLocal, writeLocal } from "../../services/local-store";
import { Component, computed, inject, signal } from "@angular/core";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
  IonButton,
  IonFab,
  IonFabButton,
  ModalController,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  chevronBack,
  chevronForward,
  addOutline,
  calendarClearOutline,
  helpCircleOutline,
} from "ionicons/icons";
import { MockDataService } from "../../services/mock-data.service";
import { AddQuizModalComponent } from "../../components/add-quiz-modal/add-quiz-modal.component";
import { GuideTourService, TourStep } from "../../services/guide-tour.service";

@Component({
  selector: "app-calendar",
  standalone: true,
  imports: [
    TaskListComponent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonIcon,
    IonButton,
    IonFab,
    IonFabButton,
  ],
  templateUrl: "./calendar.page.html",
  styleUrls: ["./calendar.page.scss"],
})
export class CalendarPage {
  selectedDate = signal(this.data.today());
  weekOffset = signal(0);

  private tour = inject(GuideTourService);
  private busy = false;

  readonly guideKey = "lockin.guide.calendar";
  readonly guideSteps: TourStep[] = [
    {
      target: '[data-guide="cal-today"]',
      title: "Jump to today",
      text: "Tap to return to the current week and select today's date.",
    },
    {
      target: '[data-guide="cal-nav"]',
      title: "Change week",
      text: "Use the arrows to move to the previous or next week.",
    },
    {
      target: '[data-guide="cal-week"]',
      title: "Pick a day",
      text: "Tap a day to see its tasks. A dot under the date means that day has tasks planned.",
    },
    {
      target: '[data-guide="cal-agenda-title"]',
      title: "Selected day",
      text: "This is the day you are viewing. Its tasks are listed below.",
    },
    {
      target: '[data-guide="cal-add"]',
      title: "Add a task",
      text: "Plan a quiz, activity or study session. It starts on the day you selected.",
    },
    {
      target: '[data-guide="cal-agenda"]',
      title: "Day's tasks",
      text: "Tasks for the selected day show up here. Tap one to mark it complete.",
    },
    {
      target: "ion-tab-bar",
      title: "Navigation",
      text: "Switch between Home, Study, Calendar, Stats and Profile.",
    },
  ];

  constructor(
    public data: MockDataService,
    private modalCtrl: ModalController,
  ) {
    addIcons({
      chevronBack,
      chevronForward,
      addOutline,
      calendarClearOutline,
      helpCircleOutline,
    });
  }

  weekDays = computed(() => {
    const base = new Date(this.data.today() + "T12:00:00");
    base.setDate(base.getDate() - base.getDay() + this.weekOffset() * 7);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      days.push({
        date: localDate(d),
        dow: d.toLocaleDateString(undefined, { weekday: "narrow" }),
        dom: d.getDate(),
      });
    }
    return days;
  });

  monthLabel = computed(() => {
    const first = this.weekDays()[0];
    return new Date(first.date + "T12:00:00").toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  });

  selectedDateLabel = computed(() =>
    new Date(this.selectedDate() + "T12:00:00").toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    }),
  );

  dayTasks = computed(() => this.data.tasksForDate(this.selectedDate()));

  // Shows this page's guide once, the first time the tab is opened.
  async ionViewDidEnter(): Promise<void> {
    if (this.busy || readLocal(this.guideKey, false)) return;
    this.busy = true;
    await this.openGuide();
    writeLocal(this.guideKey, true);
    this.busy = false;
  }

  // Closes the tour if the user leaves the page mid-tour.
  ionViewWillLeave(): void {
    this.tour.stop();
  }

  // Also called by the "?" button in the header.
  async openGuide(): Promise<void> {
    await new Promise((r) => setTimeout(r, 300));
    await this.tour.start(this.guideSteps);
  }

  today(): void {
    this.weekOffset.set(0);
    this.selectedDate.set(this.data.today());
  }
  shiftWeek(dir: number) {
    this.weekOffset.update((v) => v + dir);
    this.selectedDate.set(this.weekDays()[0].date);
  }

  async openAddQuiz() {
    const modal = await this.modalCtrl.create({
      component: AddQuizModalComponent,
      cssClass: "planner-modal",
      componentProps: { initialDate: this.selectedDate() },
    });
    await modal.present();
  }
}
