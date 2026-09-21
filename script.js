/**
 * Aryan Sharma — Developer Portfolio Scripts
 * Aesthetics & Interaction Inspired by itsvijay.com
 * Handles theme switcher, mobile drawer, scroll reveals, floating back-to-top,
 * interactive terminal, code tabs, live stats, case study modal, admin portal,
 * and the complete multi-step Contact Form Email OTP Verification Pipeline.
 */

document.addEventListener("DOMContentLoaded", () => {
  // --------------------------------------------------------------------------
  // 1. Dynamic Footer Year
  // --------------------------------------------------------------------------
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
      metaTheme.setAttribute("content", theme === "dark" ? "#090d16" : "#f8fafc");
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
  // 3. Reveal on Scroll Animation System
  // --------------------------------------------------------------------------
  const revealElements = document.querySelectorAll(".reveal-on-scroll");

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      root: null,
      rootMargin: "0px 0px -50px 0px",
      threshold: 0.12,
    }
  );

  revealElements.forEach((el) => revealObserver.observe(el));

  // --------------------------------------------------------------------------
  // 4. Floating Back to Top Button & Scroll Monitoring
  // --------------------------------------------------------------------------
  const backToTopButton = document.getElementById("backToTopButton");
  const footerBackToTop = document.getElementById("footer-back-to-top");

  const toggleBackToTop = () => {
    if (!backToTopButton) return;
    if (window.scrollY > 350) {
      backToTopButton.classList.add("visible");
    } else {
      backToTopButton.classList.remove("visible");
    }
  };

  window.addEventListener("scroll", toggleBackToTop, { passive: true });

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (backToTopButton) backToTopButton.addEventListener("click", scrollToTop);
  if (footerBackToTop) {
    footerBackToTop.addEventListener("click", (e) => {
      e.preventDefault();
      scrollToTop();
    });
  }

  // --------------------------------------------------------------------------
  // 5. Mobile Navigation Drawer
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
  // 6. Active Navigation Link Spy on Scroll
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
  // 7. Hero Interactive Terminal Tabs
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
  // 8. Agentra Technical Code Tabs & Copy
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
  // 9. Live Coding Profiles Fetcher (LeetCode & GitHub)
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
      // Graceful fallback
    }

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
      // Graceful fallback
    }

    if (reposEl) reposEl.textContent = "12+";
    if (followersEl) followersEl.textContent = "5+";
  };

  fetchLeetCodeStats();
  fetchGitHubStats();

  // --------------------------------------------------------------------------
  // 10. Copy Email Feature
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
  // 11. Contact Form & Email OTP Verification Pipeline
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

  // Form Elements
  const contactForm = document.getElementById("contact-form");
  const nameInput = document.getElementById("contact-name");
  const emailInput = document.getElementById("contact-email");
  const subjectInput = document.getElementById("contact-subject");
  const messageInput = document.getElementById("contact-message");
  const gotchaInput = document.getElementById("contact-gotcha");

  const formStatus = document.getElementById("form-status");
  const sendBtn = document.getElementById("send-msg-btn");
  const btnText = document.getElementById("btn-text");
  const btnIcon = document.getElementById("btn-icon-plane");
  const btnSpinner = document.getElementById("btn-spinner");

  // OTP Verification Elements
  const otpVerifyPanel = document.getElementById("otp-verify-panel");
  const otpTargetEmailDisplay = document.getElementById("otp-target-email-display");
  const otpInputField = document.getElementById("otp-input-field");
  const otpError = document.getElementById("otp-error");
  const otpStatusMessage = document.getElementById("otp-status-message");
  const otpTimerCount = document.getElementById("otp-timer-count");
  const otpTimerText = document.getElementById("otp-timer-text");
  const resendOtpBtn = document.getElementById("resend-otp-btn");
  const confirmOtpBtn = document.getElementById("confirm-otp-btn");
  const confirmOtpBtnText = document.getElementById("confirm-otp-btn-text");
  const confirmOtpSpinner = document.getElementById("confirm-otp-spinner");
  const cancelOtpBtn = document.getElementById("cancel-otp-btn");

  // Success Confirmation Elements
  const contactSuccessPanel = document.getElementById("contact-success-panel");
  const sendAnotherBtn = document.getElementById("send-another-btn");

  // Pipeline State
  let cachedContactData = null;
  let otpTimerInterval = null;
  let isSendingOtp = false;
  let isVerifyingOtp = false;

  const clearFormErrors = () => {
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

  // Start Resend Timer
  const startOtpCountdown = (seconds = 60) => {
    if (otpTimerInterval) clearInterval(otpTimerInterval);
    let remaining = seconds;

    if (otpTimerText) otpTimerText.classList.remove("is-hidden");
    if (resendOtpBtn) resendOtpBtn.classList.add("is-hidden");
    if (otpTimerCount) otpTimerCount.textContent = `${remaining}s`;

    otpTimerInterval = setInterval(() => {
      remaining -= 1;
      if (otpTimerCount) otpTimerCount.textContent = `${remaining}s`;

      if (remaining <= 0) {
        clearInterval(otpTimerInterval);
        if (otpTimerText) otpTimerText.classList.add("is-hidden");
        if (resendOtpBtn) resendOtpBtn.classList.remove("is-hidden");
      }
    }, 1000);
  };

  // STEP 1: Handle Initial Form Submit -> Trigger OTP Email
  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (isSendingOtp) return;

      clearFormErrors();

      let hasError = false;
      const name = nameInput?.value.trim() || "";
      const email = emailInput?.value.trim() || "";
      const subject = subjectInput?.value.trim() || "";
      const message = messageInput?.value.trim() || "";
      const gotcha = gotchaInput?.value || "";

      // Client-Side Validation
      if (!name || name.length < 2) {
        nameInput?.closest(".form-group")?.classList.add("has-error");
        hasError = true;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        emailInput?.closest(".form-group")?.classList.add("has-error");
        hasError = true;
      }

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
      isSendingOtp = true;
      if (sendBtn) sendBtn.disabled = true;
      if (btnText) btnText.textContent = "Sending Verification Code...";
      if (btnIcon) btnIcon.style.display = "none";
      if (btnSpinner) btnSpinner.classList.remove("is-hidden");

      try {
        const response = await fetch(`${API_BASE_URL}/api/contact/send-otp`, {
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
          // Cache form data for OTP step
          cachedContactData = { name, email, subject, message, _gotcha: gotcha };

          // Transition to OTP Verification State
          contactForm.classList.add("is-hidden");
          if (otpVerifyPanel) otpVerifyPanel.classList.remove("is-hidden");
          if (otpTargetEmailDisplay) otpTargetEmailDisplay.textContent = email;
          if (otpInputField) {
            otpInputField.value = "";
            otpInputField.focus();
          }

          if (otpStatusMessage) {
            otpStatusMessage.className = "otp-status-message success";
            otpStatusMessage.textContent = result.message || "A 6-digit verification code was sent to your email.";
          }

          startOtpCountdown(60);
        } else {
          if (formStatus) {
            formStatus.className = "form-status error";
            const errDetail = result.message || (result.errors && result.errors[0]?.msg) || "Failed to send verification code. Please try again.";
            formStatus.innerHTML = `<strong>${escapeHtml(errDetail)}</strong>`;
          }
        }
      } catch (err) {
        console.error("OTP Send Error:", err);
        if (formStatus) {
          formStatus.className = "form-status error";
          formStatus.innerHTML = `
            <strong>Unable to reach server.</strong><br>
            Please check your connection or <a href="mailto:aryan21sharma04@gmail.com" style="color: inherit; text-decoration: underline;">email me directly</a>.
          `;
        }
      } finally {
        isSendingOtp = false;
        if (sendBtn) sendBtn.disabled = false;
        if (btnText) btnText.textContent = "Verify Email & Send Message";
        if (btnIcon) btnIcon.style.display = "block";
        if (btnSpinner) btnSpinner.classList.add("is-hidden");
      }
    });
  }

  // STEP 2: Handle Resend OTP Code
  if (resendOtpBtn) {
    resendOtpBtn.addEventListener("click", async () => {
      if (!cachedContactData || isSendingOtp) return;

      resendOtpBtn.textContent = "Sending...";
      try {
        const response = await fetch(`${API_BASE_URL}/api/contact/send-otp`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(cachedContactData),
        });

        const result = await response.json().catch(() => ({}));

        if (response.ok && result.success) {
          if (otpStatusMessage) {
            otpStatusMessage.className = "otp-status-message success";
            otpStatusMessage.textContent = "A fresh 6-digit code has been sent to your email!";
          }
          startOtpCountdown(60);
        } else {
          if (otpStatusMessage) {
            otpStatusMessage.className = "otp-status-message error";
            otpStatusMessage.textContent = result.message || "Failed to resend code. Please wait a moment.";
          }
        }
      } catch (e) {
        if (otpStatusMessage) {
          otpStatusMessage.className = "otp-status-message error";
          otpStatusMessage.textContent = "Network error. Please try again.";
        }
      } finally {
        resendOtpBtn.textContent = "Resend Code";
      }
    });
  }

  // Handle Cancel / Edit Email
  if (cancelOtpBtn) {
    cancelOtpBtn.addEventListener("click", () => {
      if (otpTimerInterval) clearInterval(otpTimerInterval);
      if (otpVerifyPanel) otpVerifyPanel.classList.add("is-hidden");
      if (contactForm) contactForm.classList.remove("is-hidden");
    });
  }

  // STEP 3: Handle Confirm OTP & Deliver Message
  if (confirmOtpBtn && otpInputField) {
    // Restrict input to digits only & auto-submit on 6 digits
    otpInputField.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "");
      otpInputField.closest(".form-group")?.classList.remove("has-error");
    });

    otpInputField.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        confirmOtpBtn.click();
      }
    });

    confirmOtpBtn.addEventListener("click", async () => {
      if (!cachedContactData || isVerifyingOtp) return;

      const otp = otpInputField.value.trim();
      if (!otp || otp.length !== 6) {
        otpInputField.closest(".form-group")?.classList.add("has-error");
        if (otpError) otpError.textContent = "Please enter all 6 digits of the verification code.";
        return;
      }

      isVerifyingOtp = true;
      confirmOtpBtn.disabled = true;
      if (confirmOtpBtnText) confirmOtpBtnText.textContent = "Verifying & Sending...";
      if (confirmOtpSpinner) confirmOtpSpinner.classList.remove("is-hidden");

      if (otpStatusMessage) {
        otpStatusMessage.className = "otp-status-message";
        otpStatusMessage.textContent = "";
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/contact/verify-and-send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            ...cachedContactData,
            otp: otp,
          }),
        });

        const result = await response.json().catch(() => ({}));

        if (response.ok && result.success) {
          // Success State Transition
          if (otpTimerInterval) clearInterval(otpTimerInterval);
          if (otpVerifyPanel) otpVerifyPanel.classList.add("is-hidden");
          if (contactSuccessPanel) contactSuccessPanel.classList.remove("is-hidden");
          if (contactForm) contactForm.reset();
          cachedContactData = null;
        } else {
          if (otpStatusMessage) {
            otpStatusMessage.className = "otp-status-message error";
            const errDetail = result.message || "Invalid or expired verification code. Please check your email.";
            otpStatusMessage.textContent = errDetail;
          }
          otpInputField.closest(".form-group")?.classList.add("has-error");
          otpInputField.select();
        }
      } catch (err) {
        console.error("Verification error:", err);
        if (otpStatusMessage) {
          otpStatusMessage.className = "otp-status-message error";
          otpStatusMessage.textContent = "Unable to verify code due to connection error. Please try again.";
        }
      } finally {
        isVerifyingOtp = false;
        confirmOtpBtn.disabled = false;
        if (confirmOtpBtnText) confirmOtpBtnText.textContent = "Confirm & Send Message";
        if (confirmOtpSpinner) confirmOtpSpinner.classList.add("is-hidden");
      }
    });
  }

  // Handle "Send Another Message" Reset
  if (sendAnotherBtn) {
    sendAnotherBtn.addEventListener("click", () => {
      if (contactSuccessPanel) contactSuccessPanel.classList.add("is-hidden");
      if (otpVerifyPanel) otpVerifyPanel.classList.add("is-hidden");
      if (contactForm) {
        contactForm.classList.remove("is-hidden");
        contactForm.reset();
        clearFormErrors();
      }
    });
  }

  // --------------------------------------------------------------------------
  // 12. Agentra Case Study Modal
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
      closeAdminModal();
    }
  });

  // --------------------------------------------------------------------------
  // 13. Secure Admin Messages Portal Logic
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
    document.body.style.overflow = "hidden";

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
    document.body.style.overflow = "";
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
