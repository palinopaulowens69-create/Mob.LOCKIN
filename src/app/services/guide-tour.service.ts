import { Injectable } from "@angular/core";

export interface TourStep {
  target: string; // CSS selector of the real element
  title: string;
  text: string;
}

@Injectable({ providedIn: "root" })
export class GuideTourService {
  private root?: HTMLElement;
  private spot?: HTMLElement;
  private bubble?: HTMLElement;
  private steps: TourStep[] = [];
  private index = 0;
  private done?: () => void;
  private onResize = () => this.render();

  start(steps: TourStep[]): Promise<void> {
    this.stop();
    this.injectStyles();
    this.steps = steps.filter((s) => this.find(s.target));
    if (!this.steps.length) return Promise.resolve();
    this.index = 0;
    this.build();
    window.addEventListener("resize", this.onResize);
    this.render();
    return new Promise((resolve) => (this.done = resolve));
  }

  stop(): void {
    window.removeEventListener("resize", this.onResize);
    this.root?.remove();
    this.root = this.spot = this.bubble = undefined;
    this.done?.();
    this.done = undefined;
  }

  // Ionic keeps old pages in the DOM, so pick the one that is actually visible.
  private find(selector: string): HTMLElement | null {
    const all = Array.from(document.querySelectorAll<HTMLElement>(selector));
    return all.find((e) => e.getBoundingClientRect().width > 0) ?? null;
  }

  private build(): void {
    this.root = document.createElement("div");
    this.root.className = "gt-root";
    this.spot = document.createElement("div");
    this.spot.className = "gt-spot";
    this.bubble = document.createElement("div");
    this.bubble.className = "gt-bubble";
    this.root.append(this.spot, this.bubble);
    this.root.addEventListener("click", (e) => {
      const act = (e.target as HTMLElement).closest<HTMLElement>("[data-act]")
        ?.dataset["act"];
      if (act === "next") this.go(1);
      else if (act === "back") this.go(-1);
      else if (act === "skip") this.stop();
    });
    document.body.appendChild(this.root);
  }

  private go(delta: number): void {
    this.index += delta;
    if (this.index >= this.steps.length) return this.stop();
    if (this.index < 0) this.index = 0;
    this.render();
  }

  private async render(): Promise<void> {
    if (!this.root || !this.spot || !this.bubble) return;
    const step = this.steps[this.index];
    const el = this.find(step.target);
    if (!el) return this.go(1);

    el.scrollIntoView({ block: "center" });
    await new Promise((r) => setTimeout(r, 80));
    if (!this.root) return;

    const pad = 6;
    const r = el.getBoundingClientRect();
    Object.assign(this.spot.style, {
      top: `${r.top - pad}px`,
      left: `${r.left - pad}px`,
      width: `${r.width + pad * 2}px`,
      height: `${r.height + pad * 2}px`,
    });

    const last = this.index === this.steps.length - 1;
    this.bubble.innerHTML = `
      <strong>${step.title}</strong>
      <p>${step.text}</p>
      <div class="gt-row">
        <span>${this.index + 1} / ${this.steps.length}</span>
        <div>
          <button data-act="skip" class="gt-ghost">Skip</button>
          ${this.index > 0 ? '<button data-act="back" class="gt-ghost">Back</button>' : ""}
          <button data-act="next" class="gt-next">${last ? "Done" : "Next"}</button>
        </div>
      </div>
      <i class="gt-arrow"></i>`;

    // Position the bubble below the element, or above if there's no room.
    const b = this.bubble;
    const w = Math.min(300, window.innerWidth - 24);
    b.style.width = `${w}px`;
    const h = b.offsetHeight;
    const below = r.bottom + pad + 14 + h < window.innerHeight - 8;
    const top = below ? r.bottom + pad + 12 : r.top - pad - 12 - h;
    const left = Math.min(
      Math.max(12, r.left + r.width / 2 - w / 2),
      window.innerWidth - w - 12,
    );
    b.style.top = `${Math.max(8, top)}px`;
    b.style.left = `${left}px`;
    b.classList.toggle("gt-above", !below);

    const arrow = b.querySelector<HTMLElement>(".gt-arrow")!;
    arrow.style.left = `${Math.min(Math.max(18, r.left + r.width / 2 - left), w - 18)}px`;
  }

  private injectStyles(): void {
    if (document.getElementById("gt-styles")) return;
    const s = document.createElement("style");
    s.id = "gt-styles";
    s.textContent = `
      .gt-root{position:fixed;inset:0;z-index:99999;}
      .gt-spot{position:fixed;border-radius:14px;pointer-events:none;
        box-shadow:0 0 0 9999px rgba(10,20,16,.62);
        outline:2px solid #fff;transition:all .25s ease;}
      .gt-bubble{position:fixed;background:#fff;color:#1c2b24;border-radius:14px;
        padding:14px 14px 12px;box-shadow:0 10px 30px rgba(0,0,0,.3);
        font-size:13px;line-height:1.4;}
      .gt-bubble strong{font-size:15px;}
      .gt-bubble p{margin:4px 0 10px;opacity:.8;}
      .gt-row{display:flex;justify-content:space-between;align-items:center;font-size:12px;opacity:.95;}
      .gt-row span{opacity:.55;}
      .gt-row button{border:0;border-radius:10px;padding:7px 12px;font-weight:600;margin-left:4px;}
      .gt-ghost{background:transparent;color:#315d50;}
      .gt-next{background:#315d50;color:#fff;}
      .gt-arrow{position:absolute;top:-6px;width:12px;height:12px;background:#fff;
        transform:translateX(-50%) rotate(45deg);}
      .gt-above .gt-arrow{top:auto;bottom:-6px;}
    `;
    document.head.appendChild(s);
  }
}