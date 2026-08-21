/**
 * LocalLeadster — Google Maps content script
 * Detects a place listing, injects "Add to LocalLeadster", opens CRM add-lead with prefilled query params.
 */
(function () {
  "use strict";

  const APP_ORIGIN = "https://localleadster.com";
  const BTN_ID = "localleadster-add-btn";

  function parsePlaceFromUrl(href) {
    try {
      const u = new URL(href);
      // /maps/place/Business+Name/@lat,lng or /maps/place/Business+Name/data=...
      const m = u.pathname.match(/\/maps\/place\/([^/]+)/);
      if (!m?.[1]) return null;
      const name = decodeURIComponent(m[1].replace(/\+/g, " ")).trim();
      if (!name || name.startsWith("data=")) return null;
      return { name };
    } catch {
      return null;
    }
  }

  function textOf(el) {
    return (el?.textContent || "").replace(/\s+/g, " ").trim();
  }

  function parsePlaceFromDom() {
    const nameEl =
      document.querySelector("h1.DUwDvf") ||
      document.querySelector("h1[class*='fontHeadline']") ||
      document.querySelector('[role="main"] h1') ||
      document.querySelector("h1");
    const name = textOf(nameEl);
    if (!name) return null;

    const addressBtn =
      document.querySelector('button[data-item-id="address"]') ||
      document.querySelector('[data-item-id="address"]') ||
      document.querySelector('button[aria-label^="Address"]');
    const address = textOf(addressBtn) || textOf(document.querySelector(".Io6YTe"));

    const phoneBtn =
      document.querySelector('button[data-item-id^="phone"]') ||
      document.querySelector('button[aria-label^="Phone"]');
    const phone = textOf(phoneBtn).replace(/^Phone:?\s*/i, "") || undefined;

    let city;
    let state;
    if (address) {
      // "123 Main St, Arlington, MA 02476" or "Arlington, MA"
      const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const last = parts[parts.length - 1] || "";
        const stateZip = last.match(/^([A-Z]{2})\s*\d{0,5}/i);
        if (stateZip) {
          state = stateZip[1].toUpperCase();
          city = parts[parts.length - 2];
        } else if (/^[A-Z]{2}$/i.test(last)) {
          state = last.toUpperCase();
          city = parts[parts.length - 2];
        }
      }
    }

    return { name, address: address || undefined, phone, city, state };
  }

  function buildAppUrl(place) {
    const u = new URL("/dashboard/leads", APP_ORIGIN);
    u.searchParams.set("ext", "1");
    if (place.name) u.searchParams.set("name", place.name);
    if (place.address) u.searchParams.set("address", place.address);
    if (place.city) u.searchParams.set("city", place.city);
    if (place.state) u.searchParams.set("state", place.state);
    if (place.phone) u.searchParams.set("phone", place.phone);
    return u.toString();
  }

  function removeButton() {
    document.getElementById(BTN_ID)?.remove();
  }

  function injectButton(place) {
    removeButton();
    const btn = document.createElement("button");
    btn.id = BTN_ID;
    btn.type = "button";
    btn.textContent = "Add to LocalLeadster";
    btn.setAttribute("aria-label", "Add this place to LocalLeadster");
    Object.assign(btn.style, {
      position: "fixed",
      right: "16px",
      bottom: "24px",
      zIndex: "2147483646",
      padding: "12px 16px",
      borderRadius: "12px",
      border: "none",
      background: "linear-gradient(90deg, #7c3aed, #4f46e5)",
      color: "#fff",
      font: "600 14px/1.2 system-ui, sans-serif",
      cursor: "pointer",
      boxShadow: "0 8px 24px rgba(79,70,229,0.35)",
    });
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const fresh = parsePlaceFromDom() || parsePlaceFromUrl(location.href) || place;
      if (!fresh?.name) {
        window.alert("Couldn’t read this Google Maps place. Open a business listing and try again.");
        return;
      }
      window.open(buildAppUrl(fresh), "_blank", "noopener,noreferrer");
    });
    document.documentElement.appendChild(btn);
  }

  function sync() {
    if (!location.pathname.includes("/maps/")) {
      removeButton();
      return;
    }
    const place = parsePlaceFromDom() || parsePlaceFromUrl(location.href);
    if (place?.name) injectButton(place);
    else removeButton();
  }

  let t = 0;
  const schedule = () => {
    window.clearTimeout(t);
    t = window.setTimeout(sync, 400);
  };

  sync();
  window.addEventListener("popstate", schedule);
  // Maps is an SPA — watch URL + DOM mutations.
  const _push = history.pushState;
  const _replace = history.replaceState;
  history.pushState = function (...args) {
    _push.apply(this, args);
    schedule();
  };
  history.replaceState = function (...args) {
    _replace.apply(this, args);
    schedule();
  };
  const mo = new MutationObserver(schedule);
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();
