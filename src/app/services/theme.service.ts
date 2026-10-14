import { Injectable, signal } from "@angular/core";
import { readLocal, writeLocal } from "./local-store";

@Injectable({ providedIn: "root" })
export class ThemeService {
  // Light is the default. A saved choice from the Profile toggle still wins.
  private readonly saved: string = readLocal<string>("lockin.theme", "light");
  readonly dark = signal(this.saved === "dark");

  constructor() {
    writeLocal("lockin.theme", this.dark() ? "dark" : "light");
    this.apply();
  }

  setDark(dark: boolean): void {
    this.dark.set(dark);
    writeLocal("lockin.theme", dark ? "dark" : "light");
    this.apply();
  }

  private apply(): void {
    document.documentElement.classList.toggle("dark", this.dark());
    document.documentElement.style.colorScheme = this.dark() ? "dark" : "light";
  }
}