import { Component, Input, inject } from "@angular/core";
import { IonIcon, ModalController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  closeOutline,
  homeOutline,
  bookOutline,
  calendarOutline,
  barChartOutline,
  personOutline,
  addOutline,
  timerOutline,
  checkmarkCircleOutline,
  folderOutline,
  listOutline,
  alarmOutline,
} from "ionicons/icons";

export interface GuideStep {
  icon: string;
  title: string;
  text: string;
}

@Component({
  selector: "app-page-guide",
  standalone: true,
  imports: [IonIcon],
  templateUrl: "./page-guide.component.html",
  styleUrls: ["./page-guide.component.scss"],
})
export class PageGuideComponent {
  @Input() title = "How this page works";
  @Input() steps: GuideStep[] = [];

  private modalCtrl = inject(ModalController);

  constructor() {
    addIcons({
      closeOutline,
      homeOutline,
      bookOutline,
      calendarOutline,
      barChartOutline,
      personOutline,
      addOutline,
      timerOutline,
      checkmarkCircleOutline,
      folderOutline,
      listOutline,
      alarmOutline,
    });
  }

  close(): void {
    this.modalCtrl.dismiss();
  }
}