(() => {
  'use strict';

  // Central studio state
  const state = {
    config: {
      agency_name: 'VAYRIFT Studio',
      contact_email: '',
      inquiry_enabled: false,
      inquiry_endpoint: '/api/inquiry',
      tagline: 'Your space deserves more than a photograph.',
      location: 'Hyderabad, India',
    },
    motionTimer: null,
    chapter: 0,
  };

  // DOM Elements
  const form = document.getElementById('inquiry-form');
  const fields = document.getElementById('inquiry-fields');
  const contactState = document.getElementById('contact-state');
  const contactEmailLink = document.getElementById('contact-email');
  const formResult = document.getElementById('form-result');
  const submitBtn = document.getElementById('inq-submit');
  const submitText = document.getElementById('submit-text');
  const serviceSelect = document.getElementById('inq-service');
  
  // Mobile Nav Elements
  const navToggle = document.getElementById('nav-toggle');
  const navClose = document.getElementById('nav-close');
  const mobileNav = document.getElementById('mobile-nav');

  // Video Elements
  const video = document.getElementById('featured-video');
  const videoPlayBtn = document.getElementById('video-play-btn');
  const videoPlayIcon = document.getElementById('v-play-icon');
  const videoPlayText = document.getElementById('v-play-text');
  const videoReplayBtn = document.getElementById('video-replay-btn');
  const videoMuteBtn = document.getElementById('video-mute-btn');
  const videoMuteIcon = document.getElementById('v-mute-icon');
  const videoFsBtn = document.getElementById('video-fs-btn');
  const videoTimeDisplay = document.getElementById('video-time-display');
  const videoDurationTag = document.getElementById('video-duration-tag');
  const videoAlert = document.getElementById('video-alert');

  // 1. Fetch & Apply Central Configuration
  function loadConfig() {
    fetch('config.json', { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error('Configuration unavailable');
        return r.json();
      })
      .then((c) => {
        if (c && typeof c === 'object') {
          if (typeof c.agency_name === 'string' && c.agency_name.trim()) {
            state.config.agency_name = c.agency_name.trim();
          }
          if (typeof c.contact_email === 'string') {
            const clean = c.contact_email.trim();
            if (/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(clean) && !/[\r\n,;]/.test(clean)) {
              state.config.contact_email = clean;
            }
          }
          if (typeof c.inquiry_enabled === 'boolean') {
            state.config.inquiry_enabled = c.inquiry_enabled;
          }
          if (c.inquiry_endpoint && typeof c.inquiry_endpoint === 'string') {
            state.config.inquiry_endpoint = c.inquiry_endpoint;
          }
        }
        applyConfig();
        if (state.config.inquiry_enabled && c.turnstile_site_key) { const captcha = document.createElement('script'); captcha.src='https://challenges.cloudflare.com/turnstile/v0/api.js'; captcha.async=true; captcha.defer=true; const mount=document.getElementById('turnstile-container'); if(mount){mount.className='cf-turnstile';mount.setAttribute('data-sitekey',c.turnstile_site_key);document.head.append(captcha);} }
      })
      .catch((err) => {
        console.warn('Config fetch warning:', err);
        applyConfig();
      });
  }

  function applyConfig() {
    // Brand updates
    document.querySelectorAll('[data-agency]').forEach((el) => {
      el.textContent = state.config.agency_name;
    });
    if (!document.title || document.title.includes('Property Video Ads & Website Design')) {
      document.title = `${state.config.agency_name} — Property Video Ads & Website Design in Hyderabad`;
    }

    // Inquiry state handling
    if (!fields || !contactState) return;

    if (state.config.inquiry_enabled && state.config.contact_email) {
      // Direct server delivery is configured & active
      fields.disabled = false;
      if (submitBtn) submitBtn.disabled = false;
      contactState.textContent = 'Tell us about your project. We review every brief and respond within 1–2 business days.';
      if (submitText) submitText.textContent = 'Send Project Inquiry';
      if (contactEmailLink && state.config.contact_email) {
        contactEmailLink.hidden = false;
        contactEmailLink.textContent = state.config.contact_email;
        contactEmailLink.href = 'mailto:' + encodeURIComponent(state.config.contact_email);
      }
    } else if (state.config.contact_email) {
      // Controlled mailto fallback mode (email configured, but server delivery is in preview)
      fields.disabled = false;
      if (submitBtn) submitBtn.disabled = false;
      contactState.textContent = 'This form prepares an email to ' + state.config.contact_email + '. Review and send it in your email app; nothing is sent automatically.';
      if (submitText) submitText.textContent = 'Prepare inquiry email';
      if (contactEmailLink) {
        contactEmailLink.hidden = false;
        contactEmailLink.textContent = state.config.contact_email;
        contactEmailLink.href = 'mailto:' + encodeURIComponent(state.config.contact_email);
      }
    } else {
      // Public submissions disabled
      fields.disabled = true;
      contactState.textContent = 'Studio contact details are being finalized. Public inquiry submission is currently disabled.';
      if (submitBtn) submitBtn.disabled = true;
      if (submitText) submitText.textContent = 'Prepare inquiry email';
      if (contactEmailLink) contactEmailLink.hidden = true;
    }
  }

  // 2. Package & Service Preselection
  function preselectPackage(packageId) {
    if (!serviceSelect) {
      // If no form on this page, redirect to contact page with package parameter
      window.location.href = `contact.html?package=${encodeURIComponent(packageId)}`;
      return;
    }
    const mapping = {
      'property-film': 'property-film',
      'website-foundation': 'website-foundation',
      'brand-launch': 'brand-launch',
    };
    const targetValue = mapping[packageId] || packageId || 'general';
    serviceSelect.value = targetValue;

    // Scroll to inquiry section
    const targetSection = document.getElementById('inquiry') || document.getElementById('contact-section');
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Accessible focus to name field
    const nameInput = document.getElementById('inq-name');
    if (nameInput) {
      setTimeout(() => {
        try {
          nameInput.focus({ preventScroll: true });
        } catch {}
      }, 300);
    }
  }

  // Check URL query parameters for preselection
  try {
    const params = new URLSearchParams(window.location.search);
    const paramPkg = params.get('package') || params.get('service');
    if (paramPkg) {
      setTimeout(() => preselectPackage(paramPkg), 150);
    }
  } catch {}

  document.querySelectorAll('[data-select-package]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const pkg = btn.getAttribute('data-select-package');
      preselectPackage(pkg);
    });
  });

  // 3. Form Validation & Submission
  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (fields && fields.disabled) return;

      // Clean errors
      ['err-name', 'err-email', 'err-message'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = '';
      });

      const fd = new FormData(form);
      const name = String(fd.get('name') || '').trim();
      const email = String(fd.get('email') || '').trim();
      const business = String(fd.get('business') || '').trim();
      const website = String(fd.get('website') || '').trim();
      const service = String(fd.get('service') || '').trim();
      const budget = String(fd.get('budget') || '').trim();
      const timeline = String(fd.get('timeline') || '').trim();
      const message = String(fd.get('message') || '').trim();
      const consent = fd.get('consent') === 'on';
      const honeypot = String(fd.get('_hp') || '').trim();

      // Client-side Validation
      let hasError = false;
      if (!name) {
        const err = document.getElementById('err-name');
        if (err) err.textContent = 'Please enter your name.';
        hasError = true;
      }
      if (!email || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) || /[\r\n]/.test(email)) {
        const err = document.getElementById('err-email');
        if (err) err.textContent = 'Please enter a valid email address.';
        hasError = true;
      }
      if (!message || message.length < 5) {
        const err = document.getElementById('err-message');
        if (err) err.textContent = 'Please tell us a little about your project (min 5 characters).';
        hasError = true;
      }
      if (!consent) {
        alert('Please check the box to confirm consent to receive a reply.');
        hasError = true;
      }

      if (hasError) return;

      // Double-submit lock
      if (submitBtn) submitBtn.disabled = true;
      if (submitText) submitText.textContent = state.config.inquiry_enabled ? 'Sending inquiry...' : 'Preparing email...';
      formResult.textContent = '';

      // Direct Backend Inquiry Submission Mode
      if (state.config.inquiry_enabled) {
        try {
          const endpoint = '/api/inquiry';
          const resp = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              email,
              business,
              website,
              service,
              budget,
              timeline,
              message,
              consent: true,
              _hp: honeypot,
              turnstile_token: String(fd.get('cf-turnstile-response') || ''),
            }),
          });

          const data = await resp.json().catch(() => ({}));

          if (resp.ok && data.ok) {
            formResult.className = 'status-success';
            formResult.textContent = 'Your inquiry was accepted by the email provider. Inbox delivery is not guaranteed.';
            form.reset();
          } else {
            formResult.className = 'status-error';
            const msg = data.message || 'Unable to submit inquiry at this time. Please try again or reach out via email.';
            formResult.textContent = msg;
          }
        } catch (err) {
          formResult.className = 'status-error';
          formResult.textContent = 'Network connection error while submitting. Please check your connection or contact us directly.';
        } finally {
          if (submitBtn) submitBtn.disabled = false;
          if (submitText) submitText.textContent = 'Send Project Inquiry';
        }
        return;
      }

      // Controlled mailto: fallback Mode
      if (state.config.contact_email) {
        const bodyLines = [
          `Name: ${name}`,
          `Reply email: ${email}`,
          `Business / project: ${business || 'Not specified'}`,
          `Website / Social: ${website || 'Not specified'}`,
          `Service: ${service}`,
          `Estimated budget: ${budget || 'Not specified'}`,
          `Target timeline: ${timeline || 'Not specified'}`,
          '',
          'Project Description:',
          message,
          '',
          'I request a response to this specific inquiry. No unrelated marketing permission is granted.',
        ];

        const subject = `Project inquiry — ${business ? business.slice(0, 60) : name}`;
        const mailtoUri = `mailto:${encodeURIComponent(state.config.contact_email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;

        const link = document.createElement('a');
        link.href = mailtoUri;
        link.textContent = 'Open your email app to review and send';
        link.className = 'text-link mailto-action';

        formResult.className = 'status-prepared';
        formResult.replaceChildren(
          document.createTextNode('Email prepared, not sent or stored. '),
          link
        );

        if (submitBtn) submitBtn.disabled = false;
        if (submitText) submitText.textContent = 'Prepare inquiry email';
        return;
      }

      // Fallback if unconfigured
      formResult.className = 'status-error';
      formResult.textContent = 'Public inquiry submissions are not currently active.';
      if (submitBtn) submitBtn.disabled = false;
      if (submitText) submitText.textContent = 'Inquiries currently disabled';
    });
  }

  // 4. Featured Property Film Video Controls
  if (video) {
    const updatePlayState = (isPlaying) => {
      if (videoPlayBtn) {
        videoPlayBtn.setAttribute('aria-label', isPlaying ? 'Pause video' : 'Play video');
      }
      if (videoPlayIcon) videoPlayIcon.textContent = isPlaying ? '❚❚' : '▶';
      if (videoPlayText) videoPlayText.textContent = isPlaying ? 'Pause' : 'Play Film';
    };

    if (videoPlayBtn) {
      videoPlayBtn.addEventListener('click', () => {
        if (video.paused || video.ended) {
          video.play().then(() => updatePlayState(true)).catch((err) => {
            console.warn('Playback notice:', err);
            updatePlayState(false);
          });
        } else {
          video.pause();
          updatePlayState(false);
        }
      });
    }

    if (videoReplayBtn) {
      videoReplayBtn.addEventListener('click', () => {
        video.currentTime = 0;
        video.play().then(() => updatePlayState(true)).catch(() => {});
      });
    }

    if (videoMuteBtn) {
      videoMuteBtn.addEventListener('click', () => {
        video.muted = !video.muted;
        if (videoMuteIcon) videoMuteIcon.textContent = video.muted ? '🔇' : '🔊';
        const label = video.muted ? 'Unmute audio' : 'Mute audio';
        videoMuteBtn.setAttribute('aria-label', label);
      });
    }

    if (videoFsBtn) {
      videoFsBtn.addEventListener('click', () => {
        const container = video.closest('.film-aspect-box') || video;
        if (!document.fullscreenElement) {
          if (container.requestFullscreen) {
            container.requestFullscreen().catch(() => {});
          } else if (video.webkitEnterFullscreen) {
            video.webkitEnterFullscreen();
          }
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          }
        }
      });
    }

    video.addEventListener('timeupdate', () => {
      if (videoTimeDisplay) {
        const cur = formatTime(video.currentTime);
        const dur = formatTime(video.duration || 12);
        videoTimeDisplay.textContent = `${cur} / ${dur}`;
      }
    });

    video.addEventListener('loadedmetadata', () => {
      if (videoDurationTag && video.duration) {
        videoDurationTag.textContent = `${formatTime(video.duration)} DURATION`;
      }
      if (videoTimeDisplay && video.duration) {
        videoTimeDisplay.textContent = `0:00 / ${formatTime(video.duration)}`;
      }
    });

    video.addEventListener('ended', () => {
      updatePlayState(false);
    });

    video.addEventListener('error', () => {
      if (videoAlert) {
        videoAlert.innerHTML = `Video playback unavailable. <a href="assets/property-sample.mp4" target="_blank">Direct video link ↗</a>`;
      }
    });
  }

  // 5. Preserved Procedural Motion Study (#scene)
  const chapters = [
    ['01 / ARRIVAL', 'Some places<br>ask you to <em>slow down.</em>'],
    ['02 / ATMOSPHERE', 'Light.<br>Space. <em>Stillness.</em>'],
    ['03 / DETAIL', 'The feeling<br>is in the <em>details.</em>'],
    ['04 / INVITATION', 'Give your place<br>a story of <em>its own.</em>'],
  ];

  const playStudyBtn = document.getElementById('play-study');
  const sceneEl = document.getElementById('scene');
  const playText = document.getElementById('play-text');
  const playIcon = document.getElementById('play-icon');
  const chapterTag = document.getElementById('chapter');
  const filmLine = document.getElementById('film-line');

  if (playStudyBtn && sceneEl) {
    playStudyBtn.addEventListener('click', () => {
      const isPlaying = !sceneEl.classList.contains('playing');
      sceneEl.classList.toggle('playing', isPlaying);
      playStudyBtn.setAttribute('aria-pressed', String(isPlaying));

      if (playText) playText.textContent = isPlaying ? 'Pause motion study' : 'Play motion study';
      if (playIcon) playIcon.textContent = isPlaying ? 'Ⅱ' : '▶';

      clearInterval(state.motionTimer);
      if (isPlaying) {
        state.motionTimer = setInterval(() => {
          state.chapter = (state.chapter + 1) % chapters.length;
          if (chapterTag) chapterTag.textContent = chapters[state.chapter][0];
          if (filmLine) filmLine.innerHTML = chapters[state.chapter][1];
        }, 3000);
      }
    });
  }

  // 6. Preserved Interactive Website Sample Toggle (#demo-layout)
  const demoLayoutBtn = document.getElementById('demo-layout');
  const websiteSample = document.querySelector('.website-sample');
  const demoNote = document.getElementById('demo-note');

  if (demoLayoutBtn && websiteSample) {
    demoLayoutBtn.addEventListener('click', () => {
      websiteSample.classList.toggle('expanded');
      const isExpanded = websiteSample.classList.contains('expanded');
      if (demoNote) {
        demoNote.textContent = isExpanded
          ? 'ROOM DETAIL VIEW / INTERACTIVE DESIGN STUDY'
          : 'FICTIONAL PROPERTY. REAL DESIGN EXPLORATION.';
      }
    });
  }

  // 7. Mobile Navigation Drawer
  if (navToggle && mobileNav) {
    const toggleNav = (open) => {
      navToggle.setAttribute('aria-expanded', String(open));
      mobileNav.setAttribute('aria-hidden', String(!open));
      mobileNav.classList.toggle('active', open);
      if (open) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    };

    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      toggleNav(!isOpen);
    });

    if (navClose) {
      navClose.addEventListener('click', () => toggleNav(false));
    }

    mobileNav.querySelectorAll('.mobile-link').forEach((link) => {
      link.addEventListener('click', () => toggleNav(false));
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
        toggleNav(false);
      }
    });
  }

  // Initialize
  loadConfig();
})();
