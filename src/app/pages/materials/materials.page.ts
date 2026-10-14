import { FormsModule } from "@angular/forms";
import { Material } from "../../models/models";
import { Component, computed, inject, signal } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonContent,
  IonIcon,
  IonButton,
  IonChip,
  IonLabel,
  ModalController,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  documentTextOutline,
  imageOutline,
  trashOutline,
  addOutline,
  helpCircleOutline,
} from "ionicons/icons";
import { MockDataService } from "../../services/mock-data.service";
import { ConfirmService } from "../../services/confirm.service";
import { AddMaterialModalComponent } from "../../components/add-material-modal/add-material-modal.component";
import { readLocal, writeLocal } from "../../services/local-store";
import { GuideTourService, TourStep } from "../../services/guide-tour.service";

@Component({
  selector: "app-materials",
  standalone: true,
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonIcon,
    IonButton,
    IonChip,
    IonLabel,
  ],
  templateUrl: "./materials.page.html",
  styleUrls: ["./materials.page.scss"],
})
export class MaterialsPage {
  activeFilter = signal("");
  query = signal("");

  private tour = inject(GuideTourService);
  private confirm = inject(ConfirmService);
  private busy = false;

  readonly guideKey = "lockin.guide.materials";
  readonly guideSteps: TourStep[] = [
    {
      target: '[data-guide="mat-add"]',
      title: "Add material",
      text: "Save a new note, image, document or study link.",
    },
    {
      target: '[data-guide="mat-search"]',
      title: "Search",
      text: "Type to find a material by its name.",
    },
    {
      target: '[data-guide="mat-filters"]',
      title: "Filter by subject",
      text: "Tap a subject to show only its materials, or All to see everything.",
    },
    {
      target: '[data-guide="mat-card"]',
      title: "Material card",
      text: "Shows the type, date added, subject and size. Tap “Open reference” to visit a saved link.",
    },
    {
      target: '[data-guide="mat-edit"]',
      title: "Edit or delete",
      text: "Edit changes a material's details. Delete removes it after you confirm.",
    },
    {
      target: ".back-button, ion-back-button",
      title: "Back to Study",
      text: "Return to your study space.",
    },
  ];

  constructor(
    public data: MockDataService,
    private route: ActivatedRoute,
    private modalCtrl: ModalController,
  ) {
    addIcons({
      documentTextOutline,
      imageOutline,
      trashOutline,
      addOutline,
      helpCircleOutline,
    });
    const qp = this.route.snapshot.queryParamMap.get("subjectId");
    if (qp) this.activeFilter.set(qp);
  }

  filtered = computed(() => {
    const filter = this.activeFilter();
    return this.data
      .materials()
      .filter(
        (m) =>
          (!filter || m.subjectId === filter) &&
          m.name.toLowerCase().includes(this.query().toLowerCase()),
      );
  });

  setFilter(id: string) {
    this.activeFilter.set(id);
  }

  subjectName(id: string) {
    return this.data.subjectById(id)?.name ?? "";
  }

  async remove(id: string) {
    const ok = await this.confirm.ask({
      title: "Delete material?",
      message: "This removes the saved reference.",
      confirmText: "Delete",
      cancelText: "Cancel",
      danger: true,
    });
    if (ok) this.data.removeMaterial(id);
  }

  ionViewWillEnter(): void {
    this.activeFilter.set(
      this.route.snapshot.queryParamMap.get("subjectId") || "",
    );
  }

  // Shows this page's guide once, the first time it is opened.
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

  async edit(material: Material) {
    const modal = await this.modalCtrl.create({
      component: AddMaterialModalComponent,
      componentProps: { material },
      cssClass: "planner-modal",
    });
    await modal.present();
  }

  safeUrl(url?: string): string | null {
    try {
      const parsed = new URL(url || "");
      return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : null;
    } catch {
      return null;
    }
  }

  async openAddMaterial() {
    const modal = await this.modalCtrl.create({
      component: AddMaterialModalComponent,
      cssClass: "planner-modal",
      componentProps: { initialSubject: this.activeFilter() },
    });
    await modal.present();
  }
}