(() => {
  const sidebar = document.querySelector("aside");
  const mainWrapper = document.querySelector(".main-wrapper");

  if (!sidebar || !mainWrapper) {
    return;
  }

  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = "/static/css/sidebar.css";
  document.head.appendChild(stylesheet);

  document.body.classList.add("sidebar-enabled");
  sidebar.id = sidebar.id || "mainSidebar";

  let toggle = document.querySelector(".menu-toggle");

  if (toggle) {
    const cleanToggle = toggle.cloneNode(true);
    cleanToggle.removeAttribute("onclick");
    toggle.replaceWith(cleanToggle);
    toggle = cleanToggle;
  } else {
    toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "menu-toggle global-sidebar-toggle sidebar-floating-toggle";
    toggle.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    `;
    document.body.appendChild(toggle);
  }

  toggle.classList.add("global-sidebar-toggle");
  toggle.type = "button";
  toggle.setAttribute("aria-label", "Mostrar u ocultar menú");
  toggle.setAttribute("aria-controls", sidebar.id);

  let backdrop = document.querySelector(".sidebar-backdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.className = "sidebar-backdrop";
    backdrop.setAttribute("aria-hidden", "true");
    document.body.appendChild(backdrop);
  }

  sidebar.querySelectorAll(".sidebar-item a").forEach((link) => {
    link.title = link.textContent.trim();
  });

  const breakpoint = 768;
  const isMobile = () => window.innerWidth <= breakpoint;

  const closeMobile = () => {
    sidebar.classList.remove("active");
    backdrop.classList.remove("active");
    backdrop.setAttribute("aria-hidden", "true");
    document.body.classList.remove("sidebar-mobile-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  const applyState = () => {
    if (isMobile()) {
      document.body.classList.remove("sidebar-collapsed");
      closeMobile();
      return;
    }

    sidebar.classList.remove("active");
    backdrop.classList.remove("active");
    document.body.classList.remove("sidebar-mobile-open");

    const collapsed = localStorage.getItem("coffeeadmin-sidebar-collapsed") === "true";
    document.body.classList.toggle("sidebar-collapsed", collapsed);
    toggle.setAttribute("aria-expanded", String(!collapsed));
  };

  toggle.addEventListener("click", (event) => {
    event.stopPropagation();

    if (isMobile()) {
      const open = !sidebar.classList.contains("active");
      sidebar.classList.toggle("active", open);
      backdrop.classList.toggle("active", open);
      backdrop.setAttribute("aria-hidden", String(!open));
      document.body.classList.toggle("sidebar-mobile-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      return;
    }

    const collapsed = document.body.classList.toggle("sidebar-collapsed");
    localStorage.setItem("coffeeadmin-sidebar-collapsed", String(collapsed));
    toggle.setAttribute("aria-expanded", String(!collapsed));
  });

  backdrop.addEventListener("click", closeMobile);

  document.addEventListener("click", (event) => {
    if (isMobile() && !sidebar.contains(event.target) && !toggle.contains(event.target)) {
      closeMobile();
    }
  });

  window.addEventListener("resize", applyState);
  applyState();
})();
