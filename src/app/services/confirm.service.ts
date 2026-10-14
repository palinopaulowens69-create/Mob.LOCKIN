import { Injectable } from "@angular/core";

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean; // red confirm button
}

@Injectable({ providedIn: "root" })
export class ConfirmService {
  // Resolves true if the user confirms, false if they cancel or dismiss.
  ask(opts: ConfirmOptions): Promise<boolean> {
    this.injectStyles();
    return new Promise((resolve) => {
      const root = document.createElement("div");
      root.className = "cf-backdrop";
      root.innerHTML = `
        <div class="cf-card" role="alertdialog" aria-modal="true">
          <h2 class="cf-title"></h2>
          <p class="cf-msg"></p>
          <div class="cf-actions">
            <button type="button" class="cf-btn cf-cancel"></button>
            <button type="button" class="cf-btn cf-ok"></button>
          </div>
        </div>`;

      const q = <T extends HTMLElement>(s: string) =>
        root.querySelector(s) as T;
      q(".cf-title").textContent = opts.title;
      q(".cf-msg").textContent = opts.message;
      q(".cf-cancel").textContent = opts.cancelText ?? "Cancel";
      const ok = q(".cf-ok");
      ok.textContent = opts.confirmText ?? "Confirm";
      ok.classList.add(opts.danger ? "cf-danger" : "cf-primary");

      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") close(false);
      };
      const close = (result: boolean) => {
        document.removeEventListener("keydown", onKey);
        root.remove();
        resolve(result);
      };

      q(".cf-cancel").addEventListener("click", () => close(false));
      ok.addEventListener("click", () => close(true));
      root.addEventListener("click", (e) => {
        if (e.target === root) close(false); // tap outside the card
      });
      document.addEventListener("keydown", onKey);

      document.body.appendChild(root);
      q<HTMLButtonElement>(".cf-cancel").focus();
    });
  }

  private injectStyles(): void {
    if (document.getElementById("cf-styles")) return;
    const s = document.createElement("style");
    s.id = "cf-styles";
    s.textContent = `
      .cf-backdrop{position:fixed;inset:0;z-index:99998;display:flex;
        align-items:center;justify-content:center;padding:24px;
        background:rgba(10,20,16,.5);animation:cf-fade .15s ease;}
      .cf-card{width:min(100%,340px);box-sizing:border-box;padding:24px 22px 22px;
        border-radius:20px;background:var(--surface,#fff);
        color:var(--ion-text-color,#202b26);border:1px solid var(--line,#d9e1dc);
        box-shadow:0 18px 50px rgba(0,0,0,.28);
        font-family:var(--ion-font-family,sans-serif);animation:cf-pop .18s ease;}
      .cf-title{margin:0 0 8px;font-size:20px;line-height:1.25;font-weight:700;
        font-family:var(--app-font-heading,inherit);}
      .cf-msg{margin:0 0 22px;font-size:14px;line-height:1.5;opacity:.75;}
      .cf-actions{display:flex;gap:10px;}
      .cf-btn{flex:1;height:46px;padding:0 12px;border-radius:12px;border:0;
        display:flex;align-items:center;justify-content:center;
        font:inherit;font-size:15px;font-weight:600;cursor:pointer;}
      .cf-cancel{background:transparent;color:inherit;
        border:1px solid var(--line-strong,#c7d2cb);}
      .cf-primary{background:var(--ion-color-primary);
        color:var(--ion-color-primary-contrast);}
      .cf-danger{background:var(--ion-color-danger);
        color:var(--ion-color-danger-contrast);}
      .cf-btn:focus-visible{outline:2px solid var(--ion-color-primary);outline-offset:2px;}
      @keyframes cf-fade{from{opacity:0}to{opacity:1}}
      @keyframes cf-pop{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
      @media (prefers-reduced-motion:reduce){.cf-backdrop,.cf-card{animation:none}}
    `;
    document.head.appendChild(s);
  }
}