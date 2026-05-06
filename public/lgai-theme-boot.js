/* Sync with src/lib/theme-preference.ts (THEME_BOOT_SCRIPT + THEME_STORAGE_KEY). */
!(function () {
  try {
    var k = "localleadster-theme",
      d = document.documentElement,
      m = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches,
      s = null;
    try {
      s = localStorage.getItem(k);
    } catch (e) {}
    if (s === "dark") {
      d.classList.add("dark");
      d.style.colorScheme = "dark";
    } else if (s === "light") {
      d.classList.remove("dark");
      d.style.colorScheme = "light";
    } else {
      d.classList.toggle("dark", !!m);
      d.style.colorScheme = m ? "dark" : "light";
    }
  } catch (e) {}
})();
