import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonToggle,
  IonButton,
  IonIcon,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { helpCircleOutline } from "ionicons/icons";
import { MockDataService } from "../../services/mock-data.service";
import { MockAuthService } from "../../services/mock-auth.service";
import { ThemeService } from "../../services/theme.service";
import { ConfirmService } from "../../services/confirm.service";
import { validEmail, readLocal, writeLocal } from "../../services/local-store";
import { GuideTourService, TourStep } from "../../services/guide-tour.service";

@Component({
  selector: "app-profile",
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonToggle,
    IonButton,
    IonIcon,
  ],
  templateUrl: "./profile.page.html",
  styleUrls: ["./profile.page.scss"],
})
export class ProfilePage {
  readonly data = inject(MockDataService);
  readonly theme = inject(ThemeService);
  private auth = inject(MockAuthService);
  private router = inject(Router);
  private tour = inject(GuideTourService);
  private confirm = inject(ConfirmService);
  private busy = false;

  draft = { ...this.data.profile() };
  message = signal("");
  error = signal("");
  reminders = signal(readLocal("lockin.reminders", true));

  readonly guideKey = "lockin.guide.profile";
  readonly guideSteps: TourStep[] = [
    {
      target: '[data-guide="profile-card"]',
      title: "Your account",
      text: "Your name, email, study goal and school, as saved on this device.",
    },
    {
      target: '[data-guide="profile-stats"]',
      title: "Study summary",
      text: "Your day streak, hours focused and tasks done today at a glance.",
    },
    {
      target: '[data-guide="toggle-dark"]',
      title: "Dark mode",
      text: "Switch to a calmer, darker look for evening study.",
    },
    {
      target: '[data-guide="toggle-reminders"]',
      title: "Study reminders",
      text: "Show or hide your next task on Home. These are not push notifications.",
    },
    {
      target: '[data-guide="profile-form"]',
      title: "Personal details",
      text: "Edit your name, email, study goal and school. Fields marked * are required.",
    },
    {
      target: '[data-guide="profile-save"]',
      title: "Save or cancel",
      text: "Save Changes keeps your edits. Cancel puts back what was saved before.",
    },
    {
      target: '[data-guide="account-options"]',
      title: "Account & support",
      text: "Try the password reset, read Help & Support or Terms & Privacy, and log out here.",
    },
    {
      target: "ion-tab-bar",
      title: "Navigation",
      text: "Switch between Home, Study, Calendar, Stats and Profile.",
    },
  ];

  constructor() {
    addIcons({ helpCircleOutline });
  }

  ionViewWillEnter(): void {
    this.cancel();
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

  cancel(): void {
    this.draft = { ...this.data.profile() };
    this.error.set("");
    this.message.set("");
  }

  save(): void {
    this.error.set("");
    this.message.set("");
    const { name, email, studyGoal, school } = this.draft;
    if (!name.trim() || !email.trim() || !studyGoal.trim()) {
      this.error.set("Full name, email and study goal are required.");
      return;
    }
    if (!validEmail(email)) {
      this.error.set("Enter a valid email address.");
      return;
    }
    this.data.updateProfile({
      name: name.trim(),
      email: email.trim(),
      studyGoal: studyGoal.trim(),
      school: school.trim(),
    });
    this.message.set("Profile saved. Your planner is up to date.");
  }

  setReminders(value: boolean): void {
    this.reminders.set(value);
    writeLocal("lockin.reminders", value);
  }

  // Asks for confirmation before logging out.
  async logout(): Promise<void> {
    const ok = await this.confirm.ask({
      title: "Log out?",
      message: "You'll need to log in again to open your planner.",
      confirmText: "Log out",
      cancelText: "Cancel",
      danger: true,
    });
    if (!ok) return;
    this.auth.logout();
    this.router.navigateByUrl("/login", { replaceUrl: true });
  }
}