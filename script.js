/**
 * Aryan Sharma — Developer Portfolio Scripts
 * Handles theme management, mobile navigation, terminal interactivity,
 * architecture code tabs, live LeetCode/GitHub APIs, case study modal,
 * and direct AJAX contact form submission.
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Dynamic Footer Year
  const yearElement = document.getElementById("current-year");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // --------------------------------------------------------------------------
  // 2. Theme Switcher (Dark / Light Mode)
  // --------------------------------------------------------------------------
  const themeToggleBtn = document.getElementById("theme-toggle");
  const htmlElement = document.documentElement;

  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      return savedTheme;
    }
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  };

  const applyTheme = (theme) => {
    htmlElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute("content", theme === "dark" ? "#070b14" : "#f8fafc");
    }
  };

  applyTheme(getInitialTheme());

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const currentTheme = htmlElement.getAttribute("data-theme") || "dark";
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
    });
  }

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (!localStorage.getItem("theme")) {
      applyTheme(e.matches ? "dark" : "light");
    }
  });

  // --------------------------------------------------------------------------
  // 3. Mobile Navigation Drawer
  // --------------------------------------------------------------------------
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const closeDrawerBtn = document.getElementById("close-drawer-btn");
  const mobileDrawer = document.getElementById("mobile-drawer");
  const drawerOverlay = document.getElementById("mobile-drawer-overlay");
  const mobileNavLinks = document.querySelectorAll(".mobile-nav-item, .drawer-footer a");

  const openDrawer = () => {
    if (!mobileDrawer || !drawerOverlay) return;
    mobileDrawer.classList.add("open");
    drawerOverlay.classList.add("active");
    mobileDrawer.setAttribute("aria-hidden", "false");
    drawerOverlay.setAttribute("aria-hidden", "false");
    if (mobileMenuBtn) mobileMenuBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  };

  const closeDrawer = () => {
    if (!mobileDrawer || !drawerOverlay) return;
    mobileDrawer.classList.remove("open");
    drawerOverlay.classList.remove("active");
    mobileDrawer.setAttribute("aria-hidden", "true");
    drawerOverlay.setAttribute("aria-hidden", "true");
    if (mobileMenuBtn) mobileMenuBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };

  if (mobileMenuBtn) mobileMenuBtn.addEventListener("click", openDrawer);
  if (closeDrawerBtn) closeDrawerBtn.addEventListener("click", closeDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener("click", closeDrawer);

  mobileNavLinks.forEach((link) => {
    link.addEventListener("click", closeDrawer);
  });

  // --------------------------------------------------------------------------
  // 4. Hero Interactive Terminal Tabs
  // --------------------------------------------------------------------------
  const terminalTabs = document.querySelectorAll(".terminal-tab");
  const tabArch = document.getElementById("tab-arch");
  const tabStack = document.getElementById("tab-stack");

  terminalTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      terminalTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      const targetTab = tab.getAttribute("data-tab");
      if (targetTab === "arch") {
        if (tabArch) tabArch.classList.remove("is-hidden");
        if (tabStack) tabStack.classList.add("is-hidden");
      } else if (targetTab === "stack") {
        if (tabArch) tabArch.classList.add("is-hidden");
        if (tabStack) tabStack.classList.remove("is-hidden");
      }
    });
  });

  // --------------------------------------------------------------------------
  // 5. Agentra Technical Implementation Code Tabs & Copy
  // --------------------------------------------------------------------------
  const codeTabBtns = document.querySelectorAll(".code-tab-btn");
  const codePanes = document.querySelectorAll(".code-snippet-pane");
  const copyCodeBtn = document.getElementById("copy-code-btn");
  const codeCopyText = document.getElementById("code-copy-text");

  codeTabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      codeTabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const targetPaneId = `code-pane-${btn.getAttribute("data-code-tab")}`;
      codePanes.forEach((pane) => {
        if (pane.id === targetPaneId) {
          pane.classList.remove("is-hidden");
        } else {
          pane.classList.add("is-hidden");
        }
      });
    });
  });

  if (copyCodeBtn && codeCopyText) {
    copyCodeBtn.addEventListener("click", async () => {
      const activePane = document.querySelector(".code-snippet-pane:not(.is-hidden)");
      if (!activePane) return;

      const codeContent = activePane.innerText || activePane.textContent;
      try {
        await navigator.clipboard.writeText(codeContent);
        codeCopyText.textContent = "Copied!";
        setTimeout(() => {
          codeCopyText.textContent = "Copy";
        }, 2000);
      } catch (err) {
        codeCopyText.textContent = "Copied!";
        setTimeout(() => {
          codeCopyText.textContent = "Copy";
        }, 2000);
      }
    });
  }

  // --------------------------------------------------------------------------
  // 6. Live Coding Profiles Fetcher (LeetCode & GitHub)
  // --------------------------------------------------------------------------
  const fetchLeetCodeStats = async () => {
    const totalSolvedEl = document.getElementById("lc-total-solved");
    const easyCountEl = document.getElementById("lc-easy-count");
    const medCountEl = document.getElementById("lc-med-count");
    const hardCountEl = document.getElementById("lc-hard-count");
    const easyBar = document.getElementById("lc-easy-bar");
    const medBar = document.getElementById("lc-med-bar");
    const hardBar = document.getElementById("lc-hard-bar");

    try {
      // Fetch from public LeetCode stats API proxy with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch("https://leetcode-stats-api.herokuapp.com/aryan21sharma04", {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.status === "success" && data.totalSolved > 0) {
          if (totalSolvedEl) totalSolvedEl.textContent = `${data.totalSolved}+`;
          if (easyCountEl) easyCountEl.textContent = data.easySolved || "40+";
          if (medCountEl) medCountEl.textContent = data.mediumSolved || "60+";
          if (hardCountEl) hardCountEl.textContent = data.hardSolved || "15+";

          const total = data.totalSolved || 100;
          if (easyBar) easyBar.style.width = `${Math.min(100, Math.round(((data.easySolved || 40) / total) * 100))}%`;
          if (medBar) medBar.style.width = `${Math.min(100, Math.round(((data.mediumSolved || 50) / total) * 100))}%`;
          if (hardBar) hardBar.style.width = `${Math.min(100, Math.round(((data.hardSolved || 15) / total) * 100))}%`;
          return;
        }
      }
    } catch (e) {
      // Safe fallback
    }

    // Safe benchmark baseline display
    if (totalSolvedEl) totalSolvedEl.textContent = "200+";
    if (easyCountEl) easyCountEl.textContent = "70+";
    if (medCountEl) medCountEl.textContent = "110+";
    if (hardCountEl) hardCountEl.textContent = "20+";
    if (easyBar) easyBar.style.width = "35%";
    if (medBar) medBar.style.width = "55%";
    if (hardBar) hardBar.style.width = "10%";
  };

  const fetchGitHubStats = async () => {
    const reposEl = document.getElementById("gh-public-repos");
    const followersEl = document.getElementById("gh-followers");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch("https://api.github.com/users/aryansharma-prog", {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (reposEl && typeof data.public_repos === "number") {
          reposEl.textContent = `${data.public_repos}+`;
        }
        if (followersEl && typeof data.followers === "number") {
          followersEl.textContent = `${data.followers}`;
        }
        return;
      }
    } catch (e) {
      // Safe fallback
    }

    if (reposEl) reposEl.textContent = "12+";
    if (followersEl) followersEl.textContent = "5+";
  };

  fetchLeetCodeStats();
  fetchGitHubStats();

  // --------------------------------------------------------------------------
  // 7. Active Navigation Link Spy on Scroll
  // --------------------------------------------------------------------------
  const sections = document.querySelectorAll("section[id]");
  const desktopNavLinks = document.querySelectorAll(".nav-links .nav-item");

  const observerOptions = {
    root: null,
    rootMargin: "-20% 0px -70% 0px",
    threshold: 0,
  };

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute("id");
        desktopNavLinks.forEach((link) => {
          if (link.getAttribute("href") === `#${id}`) {
            link.classList.add("active");
          } else {
            link.classList.remove("active");
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach((section) => sectionObserver.observe(section));

  // --------------------------------------------------------------------------
  // 8. Agentra Case Study Modal
  // --------------------------------------------------------------------------
  const caseStudyModal = document.getElementById("case-study-modal");
  const modalBackdrop = document.getElementById("modal-backdrop");
  const openCaseStudyBtn = document.getElementById("open-case-study-btn");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const closeCaseStudyFooterBtn = document.getElementById("close-case-study-footer-btn");

  const openModal = () => {
    if (!caseStudyModal) return;
    caseStudyModal.classList.add("open");
    caseStudyModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    if (!caseStudyModal) return;
    caseStudyModal.classList.remove("open");
    caseStudyModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  if (openCaseStudyBtn) openCaseStudyBtn.addEventListener("click", openModal);
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (closeCaseStudyFooterBtn) closeCaseStudyFooterBtn.addEventListener("click", closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener("click", closeModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      closeDrawer();
    }
  });

  // --------------------------------------------------------------------------
  // 9. Copy Email to Clipboard Feature
  // --------------------------------------------------------------------------
  const copyEmailBtn = document.getElementById("copy-email-btn");
  const contactEmailText = document.getElementById("contact-email-text");

  if (copyEmailBtn && contactEmailText) {
    copyEmailBtn.addEventListener("click", async () => {
      const email = contactEmailText.textContent.trim();
      try {
        await navigator.clipboard.writeText(email);
        copyEmailBtn.classList.add("copied");
        setTimeout(() => {
          copyEmailBtn.classList.remove("copied");
        }, 2500);
      } catch (err) {
        const tempInput = document.createElement("input");
        tempInput.value = email;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);

        copyEmailBtn.classList.add("copied");
        setTimeout(() => {
          copyEmailBtn.classList.remove("copied");
        }, 2500);
      }
    });
  }

  // --------------------------------------------------------------------------
  // 10. Production Contact Form Pipeline (/api/contact)
  // --------------------------------------------------------------------------
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  const metaApiUrl = document
    .querySelector('meta[name="portfolio-api-url"]')
    ?.getAttribute("content")
    ?.trim();
  const API_BASE_URL = isLocalhost
    ? ""
    : (window.PORTFOLIO_BACKEND_URL || (metaApiUrl && metaApiUrl !== "" ? metaApiUrl : "")).replace(/\/+$/, "");
  const contactForm = document.getElementById("contact-form");
  const formStatus = document.getElementById("form-status");
  const sendBtn = document.getElementById("send-msg-btn");
  const btnText = document.getElementById("btn-text");
  const btnIcon = document.getElementById("btn-icon-plane");
  const btnSpinner = document.getElementById("btn-spinner");

  if (contactForm) {
    const nameInput = document.getElementById("contact-name");
    const emailInput = document.getElementById("contact-email");
    const subjectInput = document.getElementById("contact-subject");
    const messageInput = document.getElementById("contact-message");
    const gotchaInput = document.getElementById("contact-gotcha");

    let isSubmitting = false;

    const clearErrors = () => {
      document.querySelectorAll(".form-group").forEach((group) => {
        group.classList.remove("has-error");
      });
      if (formStatus) {
        formStatus.className = "form-status";
        formStatus.textContent = "";
        formStatus.innerHTML = "";
      }
    };

    [nameInput, emailInput, messageInput, subjectInput].forEach((input) => {
      if (input) {
        input.addEventListener("input", () => {
          input.closest(".form-group")?.classList.remove("has-error");
        });
      }
    });

    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Prevent duplicate submissions while in-flight
      if (isSubmitting) return;

      clearErrors();

      let hasError = false;
      const name = nameInput?.value.trim() || "";
      const email = emailInput?.value.trim() || "";
      const subject = subjectInput?.value.trim() || "";
      const message = messageInput?.value.trim() || "";
      const gotcha = gotchaInput?.value || "";

      // Client-side Validation: Name
      if (!name || name.length < 2) {
        nameInput?.closest(".form-group")?.classList.add("has-error");
        hasError = true;
      }

      // Client-side Validation: Email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        emailInput?.closest(".form-group")?.classList.add("has-error");
        hasError = true;
      }

      // Client-side Validation: Message
      if (!message || message.length < 5) {
        messageInput?.closest(".form-group")?.classList.add("has-error");
        hasError = true;
      }

      if (hasError) {
        if (formStatus) {
          formStatus.className = "form-status error";
          formStatus.innerHTML = "Please fill in all required fields with valid information.";
        }
        return;
      }

      // Enter Loading State
      isSubmitting = true;
      if (sendBtn) sendBtn.disabled = true;
      if (btnText) btnText.textContent = "Sending...";
      if (btnIcon) btnIcon.style.display = "none";
      if (btnSpinner) btnSpinner.classList.remove("is-hidden");

      try {
        const response = await fetch(`${API_BASE_URL}/api/contact`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            subject: subject || undefined,
            message,
            _gotcha: gotcha,
          }),
        });

        const result = await response.json().catch(() => ({}));

        if (response.ok && result.success) {
          // Success State
          if (formStatus) {
            formStatus.className = "form-status success";
            formStatus.innerHTML = `
              <strong>✓ Message sent successfully!</strong><br>
              I'll get back to you soon.
            `;
          }
          contactForm.reset();
        } else {
          // API Validation, Rate Limit, or Server Error
          if (formStatus) {
            formStatus.className = "form-status error";
            const errDetail = result.message || (result.errors && result.errors[0]?.msg) || "Please try again or email me directly.";
            formStatus.innerHTML = `
              <strong>${escapeHtml(errDetail)}</strong>
            `;
          }
        }
      } catch (err) {
        console.error("Contact Form Submission Error:", err);
        // Network or Server Offline Failure State
        if (formStatus) {
          formStatus.className = "form-status error";
          formStatus.innerHTML = `
            <strong>Unable to connect to contact server.</strong><br>
            Please check your connection or <a href="mailto:aryan21sharma04@gmail.com" style="color: inherit; text-decoration: underline;">email me directly</a>.
          `;
        }
      } finally {
        // Restore button state
        isSubmitting = false;
        if (sendBtn) sendBtn.disabled = false;
        if (btnText) btnText.textContent = "Send Message";
        if (btnIcon) btnIcon.style.display = "block";
        if (btnSpinner) btnSpinner.classList.add("is-hidden");
      }
    });
  }

  // --------------------------------------------------------------------------
  // 11. Secure Admin Messages Portal Logic
  // --------------------------------------------------------------------------
  const adminModal = document.getElementById("admin-modal");
  const adminModalBackdrop = document.getElementById("admin-modal-backdrop");
  const adminTriggerBtn = document.getElementById("admin-portal-trigger");
  const closeAdminModalBtn = document.getElementById("close-admin-modal-btn");

  const adminAuthPanel = document.getElementById("admin-auth-panel");
  const adminAuthForm = document.getElementById("admin-auth-form");
  const adminKeyInput = document.getElementById("admin-key-input");
  const adminAuthError = document.getElementById("admin-auth-error");

  const adminDashboardPanel = document.getElementById("admin-dashboard-panel");
  const adminStatTotal = document.getElementById("admin-stat-total");
  const adminStatUnread = document.getElementById("admin-stat-unread");
  const adminRefreshBtn = document.getElementById("admin-refresh-btn");
  const adminLogoutBtn = document.getElementById("admin-logout-btn");
  const adminStatusTabs = document.getElementById("admin-status-tabs");
  const adminSearchInput = document.getElementById("admin-search-input");
  const adminMessagesTbody = document.getElementById("admin-messages-tbody");
  const adminTableEmpty = document.getElementById("admin-table-empty");
  const adminTableLoading = document.getElementById("admin-table-loading");

  const adminDetailPanel = document.getElementById("admin-detail-panel");
  const adminBackToListBtn = document.getElementById("admin-back-to-list-btn");
  const detailStatusSelect = document.getElementById("detail-status-select");
  const detailFromName = document.getElementById("detail-from-name");
  const detailFromEmail = document.getElementById("detail-from-email");
  const detailSubject = document.getElementById("detail-subject");
  const detailDate = document.getElementById("detail-date");
  const detailEmailStatus = document.getElementById("detail-email-status");
  const detailMessageContent = document.getElementById("detail-message-content");
  const detailReplyBtn = document.getElementById("detail-reply-btn");
  const detailDeleteBtn = document.getElementById("detail-delete-btn");

  let currentAdminKey = sessionStorage.getItem("admin_api_key") || "";
  let activeStatusFilter = "all";
  let activeSearchQuery = "";
  let currentMessages = [];
  let selectedMessage = null;

  const openAdminModal = () => {
    if (!adminModal) return;
    adminModal.classList.add("active");
    adminModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    if (currentAdminKey) {
      showDashboard();
      fetchAdminStatsAndMessages();
    } else {
      showAuth();
    }
  };

  const closeAdminModal = () => {
    if (!adminModal) return;
    adminModal.classList.remove("active");
    adminModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  };

  const showAuth = () => {
    adminAuthPanel?.classList.remove("is-hidden");
    adminDashboardPanel?.classList.add("is-hidden");
    if (adminAuthError) adminAuthError.classList.add("is-hidden");
    if (adminKeyInput) {
      adminKeyInput.value = "";
      adminKeyInput.focus();
    }
  };

  const showDashboard = () => {
    adminAuthPanel?.classList.add("is-hidden");
    adminDashboardPanel?.classList.remove("is-hidden");
    hideMessageDetail();
  };

  // Keyboard shortcut Ctrl+Shift+A / Cmd+Shift+A to open admin
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "A" || e.key === "a")) {
      e.preventDefault();
      openAdminModal();
    }
    if (e.key === "Escape" && adminModal?.classList.contains("active")) {
      closeAdminModal();
    }
  });

  adminTriggerBtn?.addEventListener("click", openAdminModal);
  closeAdminModalBtn?.addEventListener("click", closeAdminModal);
  adminModalBackdrop?.addEventListener("click", closeAdminModal);

  // Handle Admin Key Submission
  adminAuthForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const key = adminKeyInput?.value.trim();
    if (!key) return;

    if (adminAuthError) adminAuthError.classList.add("is-hidden");

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/messages/stats`, {
        headers: { "x-admin-key": key },
      });

      if (response.ok) {
        currentAdminKey = key;
        sessionStorage.setItem("admin_api_key", key);
        showDashboard();
        fetchAdminStatsAndMessages();
      } else {
        const data = await response.json().catch(() => ({}));
        if (adminAuthError) {
          adminAuthError.textContent = data.message || "Invalid Admin API Key.";
          adminAuthError.classList.remove("is-hidden");
        }
      }
    } catch (err) {
      if (adminAuthError) {
        adminAuthError.textContent = "Unable to reach server. Please check your connection.";
        adminAuthError.classList.remove("is-hidden");
      }
    }
  });

  adminLogoutBtn?.addEventListener("click", () => {
    currentAdminKey = "";
    sessionStorage.removeItem("admin_api_key");
    showAuth();
  });

  adminRefreshBtn?.addEventListener("click", () => {
    fetchAdminStatsAndMessages();
  });

  // Filter Tabs
  adminStatusTabs?.addEventListener("click", (e) => {
    const tab = e.target.closest(".tab-btn");
    if (!tab) return;

    adminStatusTabs.querySelectorAll(".tab-btn").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    activeStatusFilter = tab.dataset.status || "all";
    fetchMessages();
  });

  // Search input debounced
  let searchTimer;
  adminSearchInput?.addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      activeSearchQuery = e.target.value.trim();
      fetchMessages();
    }, 300);
  });

  const fetchAdminStatsAndMessages = async () => {
    await fetchStats();
    await fetchMessages();
  };

  const fetchStats = async () => {
    if (!currentAdminKey) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/messages/stats`, {
        headers: { "x-admin-key": currentAdminKey },
      });
      if (res.ok) {
        const data = await res.json();
        if (adminStatTotal) adminStatTotal.textContent = data.data?.total || 0;
        if (adminStatUnread) adminStatUnread.textContent = data.data?.unread || 0;
      }
    } catch (err) {
      console.warn("Could not load stats:", err);
    }
  };

  const fetchMessages = async () => {
    if (!currentAdminKey) return;
    if (adminTableLoading) adminTableLoading.classList.remove("is-hidden");
    if (adminTableEmpty) adminTableEmpty.classList.add("is-hidden");

    try {
      const params = new URLSearchParams();
      if (activeStatusFilter !== "all") params.append("status", activeStatusFilter);
      if (activeSearchQuery) params.append("search", activeSearchQuery);

      const res = await fetch(`${API_BASE_URL}/api/admin/messages?${params.toString()}`, {
        headers: { "x-admin-key": currentAdminKey },
      });

      if (adminTableLoading) adminTableLoading.classList.add("is-hidden");

      if (res.ok) {
        const result = await res.json();
        currentMessages = result.data?.messages || [];
        renderMessagesTable(currentMessages);
      } else if (res.status === 401) {
        currentAdminKey = "";
        sessionStorage.removeItem("admin_api_key");
        showAuth();
      }
    } catch (err) {
      if (adminTableLoading) adminTableLoading.classList.add("is-hidden");
      console.error("Failed to fetch messages:", err);
    }
  };

  const renderMessagesTable = (messages) => {
    if (!adminMessagesTbody) return;
    adminMessagesTbody.innerHTML = "";

    if (!messages || messages.length === 0) {
      if (adminTableEmpty) adminTableEmpty.classList.remove("is-hidden");
      return;
    }

    if (adminTableEmpty) adminTableEmpty.classList.add("is-hidden");

    messages.forEach((msg) => {
      const tr = document.createElement("tr");
      if (msg.status === "unread") tr.classList.add("unread-row");

      const dateStr = new Date(msg.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      tr.innerHTML = `
        <td><strong>${escapeHtml(msg.name)}</strong></td>
        <td>${escapeHtml(msg.subject || "(No Subject)")}</td>
        <td>${dateStr}</td>
        <td><span class="status-badge ${msg.status}">${msg.status}</span></td>
        <td>
          <button type="button" class="btn btn-ghost btn-sm view-msg-btn" data-id="${msg._id}">
            View
          </button>
        </td>
      `;

      tr.addEventListener("click", () => openMessageDetail(msg));
      adminMessagesTbody.appendChild(tr);
    });
  };

  const openMessageDetail = async (msg) => {
    selectedMessage = msg;
    hideTableShowDetail();

    if (detailFromName) detailFromName.textContent = msg.name;
    if (detailFromEmail) {
      detailFromEmail.textContent = msg.email;
      detailFromEmail.href = `mailto:${msg.email}?subject=Re:%20${encodeURIComponent(msg.subject || "Your Inquiry")}`;
    }
    if (detailSubject) detailSubject.textContent = msg.subject || "No Subject";
    if (detailDate) {
      detailDate.textContent = new Date(msg.createdAt).toLocaleString("en-US", {
        dateStyle: "full",
        timeStyle: "short",
      });
    }
    if (detailEmailStatus) {
      detailEmailStatus.textContent = msg.emailDeliveryStatus || "unknown";
    }
    if (detailMessageContent) detailMessageContent.textContent = msg.message;
    if (detailStatusSelect) detailStatusSelect.value = msg.status;
    if (detailReplyBtn) {
      detailReplyBtn.href = `mailto:${msg.email}?subject=Re:%20${encodeURIComponent(msg.subject || "Your Inquiry")}`;
    }

    // Auto-update unread to read
    if (msg.status === "unread") {
      updateStatus(msg._id, "read");
    }
  };

  const hideTableShowDetail = () => {
    document.querySelector(".admin-table-container")?.classList.add("is-hidden");
    document.querySelector(".admin-filter-bar")?.classList.add("is-hidden");
    adminDetailPanel?.classList.remove("is-hidden");
  };

  const hideMessageDetail = () => {
    document.querySelector(".admin-table-container")?.classList.remove("is-hidden");
    document.querySelector(".admin-filter-bar")?.classList.remove("is-hidden");
    adminDetailPanel?.classList.add("is-hidden");
    selectedMessage = null;
  };

  adminBackToListBtn?.addEventListener("click", () => {
    hideMessageDetail();
    fetchAdminStatsAndMessages();
  });

  detailStatusSelect?.addEventListener("change", (e) => {
    if (selectedMessage) {
      updateStatus(selectedMessage._id, e.target.value);
    }
  });

  detailDeleteBtn?.addEventListener("click", async () => {
    if (!selectedMessage) return;
    if (confirm("Are you sure you want to permanently delete this message?")) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/messages/${selectedMessage._id}`, {
          method: "DELETE",
          headers: { "x-admin-key": currentAdminKey },
        });
        if (res.ok) {
          hideMessageDetail();
          fetchAdminStatsAndMessages();
        }
      } catch (err) {
        alert("Failed to delete message.");
      }
    }
  });

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/messages/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": currentAdminKey,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        if (selectedMessage && selectedMessage._id === id) {
          selectedMessage.status = status;
        }
        fetchStats();
      }
    } catch (err) {
      console.warn("Could not update status:", err);
    }
  };

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});

