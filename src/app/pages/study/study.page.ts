import { FocusTimerComponent } from "../../components/focus-timer/focus-timer.component";
import { readLocal, writeLocal } from "../../services/local-store";
import { FormsModule } from "@angular/forms";
import { Component, computed, inject } from "@angular/core";
import { Router } from "@angular/router";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
  IonButton,
  IonProgressBar,
  ModalController,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  searchOutline,
  documentTextOutline,
  imageOutline,
  addOutline,
  folderOutline,
  helpCircleOutline,
} from "ionicons/icons";
import { MockDataService } from "../../services/mock-data.service";
import { AddQuizModalComponent } from "../../components/add-quiz-modal/add-quiz-modal.component";
import { AddMaterialModalComponent } from "../../components/add-material-modal/add-material-modal.component";
import { GuideTourService, TourStep } from "../../services/guide-tour.service";

@Component({
  selector: "app-study",
  standalone: true,
  imports: [
    FormsModule,
    FocusTimerComponent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonIcon,
    IonButton,
    IonProgressBar,
  ],
  templateUrl: "./study.page.html",
  styleUrls: ["./study.page.scss"],
})
export class StudyPage {
  query = "";
  filteredSubjects() {
    return this.data
      .subjects()
      .filter((s) => s.name.toLowerCase().includes(this.query.toLowerCase()));
  }
  public data = inject(MockDataService);
  private router = inject(Router);
  private modalCtrl = inject(ModalController);
  private tour = inject(GuideTourService);
  private busy = false;

  readonly guideKey = "lockin.guide.study";
  readonly guideSteps: TourStep[] = [
    {
      target: '[data-guide="search"]',
      title: "Find a subject",
      text: "Type here to filter your subjects by name.",
    },
    {
      target: '[data-guide="subject-list"]',
      title: "Your subjects",
      text: "Tap a subject to open its materials. The bar shows your progress.",
    },
    {
      target: '[data-guide="recent-materials"]',
      title: "Recent materials",
      text: "Your latest notes and references. Tap one to open it.",
    },
    {
      target: '[data-guide="view-all"]',
      title: "View all",
      text: "See every material you've saved, across all subjects.",
    },
    {
      target: '[data-guide="add-material"]',
      title: "Add material",
      text: "Save a new note or reference to keep it near your study plan.",
    },
        {
      target: '[data-guide="timer-options"]',
      title: "Choose a duration",
      text: "Pick 15, 25 or 50 minutes. You can only change it before you start.",
    },
        {
      target: '[data-guide="timer-subject"]',
      title: "Pick a subject",
      text: "Choose what you're studying so the time counts toward that subject on Stats. Leave it on Any if you don't need that.",
    },
    {
      target: '[data-guide="timer-clock"]',
      title: "Time remaining",
      text: "The countdown for your current focus session.",
    },
    {
      target: '[data-guide="timer-start"]',
      title: "Start, pause, resume",
      text: "Starts the timer. While it runs, this button becomes Pause, then Resume.",
    },
    {
      target: '[data-guide="timer-finish"]',
      title: "Finish & save",
      text: "Ends the session early and saves your progress. It unlocks once the timer has started.",
    },
    {
      target: '[data-guide="plan-task"]',
      title: "Plan a task",
      text: "Schedule a quiz, activity or study session.",
    },
    {
      target: "ion-tab-bar",
      title: "Navigation",
      text: "Switch between Home, Study, Calendar, Stats and Profile.",
    },
  ];

  readonly recentMaterials = computed(() => {
    return this.data.materials().slice(0, 4);
  });

  constructor() {
    addIcons({
      searchOutline,
      documentTextOutline,
      imageOutline,
      addOutline,
      folderOutline,
      helpCircleOutline,
    });
  }

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

  goMaterials(subjectId?: string): void {
    this.router.navigate(
      ["/materials"],
      subjectId ? { queryParams: { subjectId } } : {},
    );
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
