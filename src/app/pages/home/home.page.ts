import { TaskListComponent } from "../../components/task-list/task-list.component";
import { readLocal, writeLocal } from "../../services/local-store";
import { Component, inject } from "@angular/core";
import { TitleCasePipe } from "@angular/common";
import { Router } from "@angular/router";
import {
  IonContent,
  IonIcon,
  ModalController,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  notificationsOutline,
  checkmarkCircle,
  ellipseOutline,
  chevronForward,
  addOutline,
  folderOutline,
  calculatorOutline,
  planetOutline,
  flaskOutline,
  leafOutline,
  helpCircleOutline,
} from "ionicons/icons";
import { MockDataService } from "../../services/mock-data.service";
import { AddQuizModalComponent } from "../../components/add-quiz-modal/add-quiz-modal.component";
import { AddMaterialModalComponent } from "../../components/add-material-modal/add-material-modal.component";
import { WelcomeTourComponent } from "../../components/welcome-tour/welcome-tour.component";
import { GuideTourService, TourStep } from "../../services/guide-tour.service";

@Component({
  selector: "app-home",
  standalone: true,
  imports: [TaskListComponent, IonContent, IonIcon, TitleCasePipe],
  templateUrl: "./home.page.html",
  styleUrls: ["./home.page.scss"],
})
export class HomePage {
  public data = inject(MockDataService);
  private router = inject(Router);
  private modalCtrl = inject(ModalController);
  private tour = inject(GuideTourService);
  private busy = false; // blocks any tour/modal from opening while one is active

  readonly guideKey = "lockin.guide.home";
  readonly guideSteps: TourStep[] = [
    {
      target: '[data-guide="profile"]',
      title: "Your profile",
      text: "Tap here to open your profile and settings.",
    },
    {
      target: '[data-guide="progress"]',
      title: "Daily progress",
      text: "This ring shows how many of today's tasks you've finished.",
    },
    {
      target: '[data-guide="add-task"]',
      title: "Add a task",
      text: "Plan a quiz, activity or study session for today.",
    },
    {
      target: '[data-guide="calendar-link"]',
      title: "Calendar",
      text: "Open the calendar to schedule tasks on other days.",
    },
    {
      target: '[data-guide="up-next"]',
      title: "Up next",
      text: "Your next scheduled task shows up here.",
    },
    {
      target: '[data-guide="focus"]',
      title: "Focus session",
      text: "Pick one subject and study without distractions.",
    },
    {
      target: '[data-guide="material"]',
      title: "Study material",
      text: "Save notes and references so they're always nearby.",
    },
    {
      target: '[data-guide="subjects"]',
      title: "Your subjects",
      text: "Track tasks and progress per subject. Tap one to open it.",
    },
    {
      target: "ion-tab-bar",
      title: "Navigation",
      text: "Switch between Home, Study, Calendar, Stats and Profile.",
    },
  ];

  greeting(): string {
    const hour = new Date().getHours();
    return hour < 12
      ? "Good morning"
      : hour < 18
        ? "Good afternoon"
        : "Good evening";
  }

  todayLabel(): string {
    return this.data.now().toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }

  motivation(): string {
    const total = this.data.todaysTasks().length;
    const done = this.data.todaysCompleted();
    if (!total) return "A clear day is a good chance to plan ahead.";
    if (done === total) return "All tasks completed — great work today.";
    if (done === 0)
      return "Start small. Your first task is ready when you are.";
    if (done * 2 < total)
      return "You’re off to a good start. Keep the momentum.";
    if (done * 2 === total)
      return "Halfway there — one focused block at a time.";
    return "The finish line is close. Keep going.";
  }
  constructor() {
    addIcons({
      notificationsOutline,
      checkmarkCircle,
      ellipseOutline,
      chevronForward,
      addOutline,
      folderOutline,
      calculatorOutline,
      planetOutline,
      flaskOutline,
      leafOutline,
      helpCircleOutline,
    });
  }

  // Welcome tour first (once), then this page's guide (once).
  async ionViewDidEnter(): Promise<void> {
    if (this.busy) return;
    this.busy = true;

    if (!readLocal("lockin.onboarded", false)) {
      const tour = await this.modalCtrl.create({
        component: WelcomeTourComponent,
        cssClass: "planner-modal",
        backdropDismiss: false,
      });
      await tour.present();
      await tour.onDidDismiss();
      writeLocal("lockin.onboarded", true);
    }

    if (!readLocal(this.guideKey, false)) {
      await this.openGuide();
      writeLocal(this.guideKey, true);
    }

    this.busy = false;
  }

  // Also called by the "?" button in the header.
  async openGuide(): Promise<void> {
    await new Promise((r) => setTimeout(r, 300)); // let the previous modal finish closing
    await this.tour.start(this.guideSteps);
  }

  ionViewWillLeave(): void {
  this.tour.stop();
}

  showUpcoming(): boolean {
    return readLocal("lockin.reminders", true);
  }

  goProfile(): void {
    this.router.navigateByUrl("/tabs/profile");
  }

  goCalendar(): void {
    this.router.navigateByUrl("/tabs/calendar");
  }

  goStudy(): void {
    this.router.navigateByUrl("/tabs/study");
  }

  async openAddQuiz(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: AddQuizModalComponent,
      cssClass: "planner-modal",
    });
    await modal.present();
  }

  async openAddMaterial(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: AddMaterialModalComponent,
      cssClass: "planner-modal",
    });
    await modal.present();
  }
}
