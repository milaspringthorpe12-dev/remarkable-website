// RE:Markable: shared site behaviour for mobile nav, scroll reveal, contact form.

(function () {
  var navToggle = document.querySelector('.nav__toggle');
  var navLinks = document.querySelector('.nav__links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  var header = document.querySelector('.site-header');
  var progressBar = document.querySelector('.scroll-progress');
  var ticking = false;

  function updateOnScroll() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop;

    if (header) {
      header.classList.toggle('site-header--scrolled', scrollTop > 12);
    }

    if (progressBar) {
      var docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      var progress = docHeight > 0 ? scrollTop / docHeight : 0;
      progressBar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, progress)) + ')';
    }

    ticking = false;
  }

  if (header || progressBar) {
    updateOnScroll();
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(updateOnScroll);
        ticking = true;
      }
    }, { passive: true });
  }

  var heroFull = document.querySelector('.hero--full');
  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (heroFull && !prefersReducedMotion && window.matchMedia && window.matchMedia('(hover: hover)').matches) {
    var spotlight = document.createElement('div');
    spotlight.className = 'hero__spotlight';
    spotlight.setAttribute('aria-hidden', 'true');
    heroFull.appendChild(spotlight);

    var spotlightTicking = false;
    var pendingX = 50;
    var pendingY = 42;

    heroFull.addEventListener('pointermove', function (e) {
      var rect = heroFull.getBoundingClientRect();
      pendingX = ((e.clientX - rect.left) / rect.width) * 100;
      pendingY = ((e.clientY - rect.top) / rect.height) * 100;
      if (!spotlightTicking) {
        window.requestAnimationFrame(function () {
          heroFull.style.setProperty('--mx', pendingX + '%');
          heroFull.style.setProperty('--my', pendingY + '%');
          spotlightTicking = false;
        });
        spotlightTicking = true;
      }
    });
  }

  if (!prefersReducedMotion && window.matchMedia && window.matchMedia('(hover: hover)').matches) {
    function attachMagnetic(el, strength, extraTransform) {
      el.addEventListener('pointermove', function (e) {
        var rect = el.getBoundingClientRect();
        var dx = ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * strength;
        var dy = ((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * strength;
        el.style.transform = 'translate(' + dx.toFixed(1) + 'px, ' + dy.toFixed(1) + 'px)' + (extraTransform || '');
      });
      el.addEventListener('pointerleave', function () {
        el.style.transform = '';
      });
    }

    document.querySelectorAll('.btn').forEach(function (el) {
      attachMagnetic(el, 8, ' translateY(-3px) scale(1.02)');
    });
    document.querySelectorAll('.flat-card, .shop-card').forEach(function (el) {
      attachMagnetic(el, 6, '');
    });
  }

  var revealTargets = document.querySelectorAll('.fade-in');
  if ('IntersectionObserver' in window && revealTargets.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    revealTargets.forEach(function (el) { observer.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-visible'); });
  }

  var form = document.getElementById('contact-form');
  if (form) {
    var status = document.getElementById('form-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Honeypot: if this hidden field has a value, silently treat as spam.
      var honeypot = form.querySelector('input[name="company_website"]');
      if (honeypot && honeypot.value) {
        return;
      }

      var name = form.querySelector('#name');
      var email = form.querySelector('#email');
      var message = form.querySelector('#message');
      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
        showStatus('error', 'Please fill in your name, email, and message before sending.');
        return;
      }
      if (!emailPattern.test(email.value.trim())) {
        showStatus('error', 'That email address doesn\'t look quite right, please double-check it.');
        return;
      }

      var data = new FormData(form);
      var params = new URLSearchParams();
      data.forEach(function (value, key) { params.append(key, value); });

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      }).then(function (response) {
        if (!response.ok) { throw new Error('Submission failed'); }
        showStatus('success', 'Thanks, your message has been received. I\'ll get back to you within 1-2 business days.');
        form.reset();
      }).catch(function () {
        showStatus('error', 'Something went wrong sending that. Please try again, or email remarkable40@outlook.com directly.');
      });
    });

    function showStatus(type, msg) {
      status.textContent = msg;
      status.className = 'form-status is-' + type;
      status.setAttribute('role', type === 'error' ? 'alert' : 'status');
    }
  }
})();
