import { Component, inject } from "@angular/core";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
  IonButton,
  IonProgressBar,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  flameOutline,
  timeOutline,
  ribbonOutline,
  trendingUpOutline,
  helpCircleOutline,
} from "ionicons/icons";
import { MockDataService } from "../../services/mock-data.service";
import { readLocal, writeLocal } from "../../services/local-store";
import { GuideTourService, TourStep } from "../../services/guide-tour.service";

@Component({
  selector: "app-stats",
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonIcon,
    IonButton,
    IonProgressBar,
  ],
  templateUrl: "./stats.page.html",
  styleUrls: ["./stats.page.scss"],
})
export class StatsPage {
  private tour = inject(GuideTourService);
  private busy = false;

  readonly guideKey = "lockin.guide.stats";
  readonly guideSteps: TourStep[] = [
    {
      target: '[data-guide="stat-streak"]',
      title: "Day streak",
      text: "How many days in a row you've completed a focus session. Keep it going.",
    },
    {
      target: '[data-guide="stat-hours"]',
      title: "Total study time",
      text: "All the hours you've logged in focus sessions so far.",
    },
    {
      target: '[data-guide="stat-quizzes"]',
      title: "Quizzes completed",
      text: "The number of quizzes you've marked as done.",
    },
    {
      target: '[data-guide="stat-rate"]',
      title: "Today's completion",
      text: "The share of today's tasks you've finished.",
    },
    {
      target: '[data-guide="completion-card"]',
      title: "Today's progress bar",
      text: "Tasks finished versus planned today. It fills as you tick tasks off.",
    },
    {
      target: '[data-guide="week-chart"]',
      title: "Last 7 days",
      text: "Minutes of focus time for each day this past week. Today's bar is the darkest.",
    },
    {
      target: '[data-guide="subject-time"]',
      title: "Study time by subject",
      text: "Where your focus time goes. Choose a subject in the timer on the Study tab to count it here.",
    },
    {
      target: '[data-guide="subject-progress"]',
      title: "Subject progress",
      text: "Each bar shows how many of that subject's tasks are done.",
    },
    {
      target: "ion-tab-bar",
      title: "Navigation",
      text: "Switch between Home, Study, Calendar, Stats and Profile.",
    },
  ];

  constructor(public data: MockDataService) {
    addIcons({
      flameOutline,
      timeOutline,
      ribbonOutline,
      trendingUpOutline,
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

  // 80 -> "1h 20m", 45 -> "45m"
  fmt(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h ? `${h}h ${m}m` : `${m}m`;
  }

  progressMessage(): string {
    const rate = this.data.completionRate();
    if (rate === 100)
      return "Today’s plan is complete. Take a moment to enjoy the win.";
    if (rate >= 50)
      return "You’ve built solid momentum today. Keep the next step simple.";
    if (rate > 0)
      return "Progress is already moving. Every completed task counts.";
    return "Your progress will appear here as you complete tasks and focus sessions.";
  }
}