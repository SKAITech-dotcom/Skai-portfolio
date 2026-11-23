// ============================================================
// SkaiTechgh Portfolio — Public Site JavaScript
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  initPageLoader();
  initThemeToggle();
  initNavbar();
  initMobileMenu();
  initScrollReveal();
  initSmoothScroll();
  initBackToTop();
  initPortfolioFilters();
  initContactForm();
  loadAllContent();
});

// ============================================================
// 1. PAGE LOADER
// ============================================================

function initPageLoader() {
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('loaded');
      setTimeout(() => loader.remove(), 500);
    }, 600);
  });
  setTimeout(() => {
    loader.classList.add('loaded');
    setTimeout(() => loader.remove(), 500);
  }, 3000);
}

// ============================================================
// 2. DARK / LIGHT MODE TOGGLE
// ============================================================

function initThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;
  const savedTheme = localStorage.getItem('skaitechgh-theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
  }
  toggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('skaitechgh-theme', isLight ? 'light' : 'dark');
  });
}

// ============================================================
// 3. NAVBAR SCROLL EFFECT & ACTIVE LINKS
// ============================================================

function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('active');
          }
        });
      }
    });
  }, { root: null, rootMargin: '-20% 0px -60% 0px', threshold: 0 });
  sections.forEach(section => observer.observe(section));
}

// ============================================================
// 4. MOBILE MENU
// ============================================================

function initMobileMenu() {
  const btn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => {
    const isOpen = !menu.classList.contains('hidden');
    menu.classList.toggle('hidden');
    btn.innerHTML = isOpen ? '<i class="fas fa-bars text-xl"></i>' : '<i class="fas fa-times text-xl"></i>';
  });
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.add('hidden');
      btn.innerHTML = '<i class="fas fa-bars text-xl"></i>';
    });
  });
}

// ============================================================
// 5. SCROLL REVEAL ANIMATIONS
// ============================================================

function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { root: null, rootMargin: '0px 0px -80px 0px', threshold: 0.1 });
    revealElements.forEach(el => observer.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('revealed'));
  }
}

// ============================================================
// 6. SMOOTH SCROLL
// ============================================================

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

// ============================================================
// 7. BACK TO TOP BUTTON
// ============================================================

function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
      btn.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
      btn.classList.add('opacity-100', 'translate-y-0');
    } else {
      btn.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
      btn.classList.remove('opacity-100', 'translate-y-0');
    }
  });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ============================================================
// 8. PORTFOLIO FILTER TABS
// ============================================================

let allProjects = [];

function initPortfolioFilters() {
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = tab.dataset.filter;
      const filtered = filter === 'all' ? allProjects : allProjects.filter(p => p.category === filter);
      renderProjects(filtered);
    });
  });
}

// ============================================================
// 9. CONTACT FORM
// ============================================================

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('contact-submit');
    const originalHTML = submitBtn.innerHTML;
    const name = document.getElementById('inquiry-name').value.trim();
    const email = document.getElementById('inquiry-email').value.trim();
    const message = document.getElementById('inquiry-message').value.trim();
    if (!name || !email || !message) {
      showToast('Please fill in all required fields.', 'warning');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Please enter a valid email address.', 'warning');
      return;
    }
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Sending...';
    try {
      await submitInquiry({
        full_name: name,
        email: email,
        phone: document.getElementById('inquiry-phone').value.trim() || null,
        company: document.getElementById('inquiry-company').value.trim() || null,
        service_type: document.getElementById('inquiry-service').value || null,
        budget_range: document.getElementById('inquiry-budget').value || null,
        message: message,
        status: 'new'
      });
      showToast('Your inquiry has been sent successfully! We\'ll get back to you within 24 hours.', 'success', 5000);
      form.reset();
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      showToast('Something went wrong. Please try again or email us directly.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
    }
  });
}

// ============================================================
// 10. LOAD ALL CONTENT FROM SUPABASE
// ============================================================

async function loadAllContent() {
  await Promise.allSettled([
    loadHeroContent(),
    loadContactInfo(),
    loadSocialLinks(),
    loadStats(),
    loadProjects(),
    loadTeamMembers(),
    loadTestimonials()
  ]);
}

// ---- Hero Content ----
async function loadHeroContent() {
  try {
    const hero = await fetchSiteSetting('hero');
    if (hero) {
      if (hero.headline) {
        const el = document.getElementById('hero-headline');
        const parts = hero.headline.split('\n');
        if (parts.length > 1) {
          el.innerHTML = escapeHTML(parts[0]) + '<br><span class="gradient-text">' + escapeHTML(parts[1]) + '</span>';
        }
      }
      if (hero.subheadline) document.getElementById('hero-subheadline').textContent = hero.subheadline;
      if (hero.cta_primary) document.getElementById('cta-primary-text').textContent = hero.cta_primary;
      if (hero.cta_secondary) document.getElementById('cta-secondary-text').textContent = hero.cta_secondary;
    }
  } catch (err) {
    console.warn('Could not load hero content:', err);
  }
}

// ---- Contact Info ----
async function loadContactInfo() {
  try {
    const contact = await fetchSiteSetting('contact');
    if (contact) {
      setTextContent('contact-email', contact.email);
      setTextContent('contact-phone', contact.phone);
      setTextContent('contact-address', contact.address);
      setTextContent('contact-hours', contact.working_hours);
      setTextContent('footer-email', contact.email);
      setTextContent('footer-phone', contact.phone);
      setTextContent('footer-address', contact.address);
    }
  } catch (err) {
    console.warn('Could not load contact info:', err);
  }
}

// ---- Social Links ----
async function loadSocialLinks() {
  try {
    const social = await fetchSiteSetting('social');
    if (social) {
      updateSocialLinks('social-links', social);
      updateSocialLinks('footer-social-links', social);
    }
  } catch (err) {
    console.warn('Could not load social links:', err);
  }
}

function updateSocialLinks(containerId, social) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('a').forEach(link => {
    const icon = link.querySelector('i');
    if (!icon) return;
    const map = { 'fa-github': 'github', 'fa-linkedin-in': 'linkedin', 'fa-twitter': 'twitter', 'fa-instagram': 'instagram' };
    for (const [cls, key] of Object.entries(map)) {
      if (icon.classList.contains(cls) && social[key]) {
        link.href = social[key];
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
    }
  });
}

// ---- Stats (dynamic from admin) ----
async function loadStats() {
  try {
    const stats = await fetchSiteSetting('stats');
    if (stats && stats.items && stats.items.length > 0) {
      const statsContainer = document.getElementById('stats-bar');
      if (statsContainer) {
        statsContainer.innerHTML = stats.items.map(item =>
          '<div class="text-center p-4">' +
            '<div class="text-3xl sm:text-4xl font-extrabold gradient-text mb-1">' + escapeHTML(item.value) + '</div>' +
            '<div class="text-slate-400 text-sm font-medium">' + escapeHTML(item.label) + '</div>' +
          '</div>'
        ).join('');
      }
    }
  } catch (err) {
    console.warn('Could not load stats:', err);
  }
}

// ---- Projects ----
async function loadProjects() {
  try {
    const projects = await fetchProjects();
    allProjects = projects;
    renderProjects(projects);
  } catch (err) {
    console.warn('Could not load projects:', err);
    renderProjectsFallback();
  }
}

function renderProjects(projects) {
  const container = document.getElementById('portfolio-container');
  if (!container) return;

  if (!projects || projects.length === 0) {
    container.innerHTML =
      '<div class="col-span-full text-center py-16">' +
        '<div class="w-20 h-20 rounded-2xl bg-primary-600/10 flex items-center justify-center mx-auto mb-4">' +
          '<i class="fas fa-folder-open text-3xl text-primary-400"></i>' +
        '</div>' +
        '<h3 class="text-xl font-semibold mb-2 text-slate-300">No projects found</h3>' +
        '<p class="text-slate-500">Check back soon — new projects are always in the works!</p>' +
      '</div>';
    return;
  }

  var categoryLabels = { 'website': 'Website', 'mobile_app': 'Mobile App', 'web_app': 'Web App', 'flagship': 'Flagship' };
  var categoryColors = {
    'website': 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    'mobile_app': 'bg-green-500/15 text-green-400 border-green-500/20',
    'web_app': 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    'flagship': 'bg-amber-500/15 text-amber-400 border-amber-500/20'
  };
  var gradients = [
    'from-primary-600/20 to-purple-600/20', 'from-accent-500/20 to-blue-600/20',
    'from-pink-600/20 to-primary-600/20', 'from-green-600/20 to-accent-500/20',
    'from-amber-600/20 to-pink-600/20', 'from-purple-600/20 to-accent-500/20'
  ];
  var iconList = ['fa-code', 'fa-mobile-alt', 'fa-server', 'fa-bolt', 'fa-globe', 'fa-graduation-cap'];

  container.innerHTML = projects.map(function(project, index) {
    var gradient = gradients[index % gradients.length];
    var icon = iconList[index % iconList.length];

    var thumbnailUrl = project.thumbnail_url
      ? (project.thumbnail_url.startsWith('http') ? project.thumbnail_url : getStorageUrl('project-images', project.thumbnail_url))
      : null;

    var thumbnailHTML = thumbnailUrl
      ? '<img src="' + escapeHTML(thumbnailUrl) + '" alt="' + escapeHTML(project.title) + '" class="thumbnail" loading="lazy">'
      : '<div class="w-full h-[220px] bg-gradient-to-br ' + gradient + ' flex items-center justify-center"><i class="fas ' + icon + ' text-5xl text-white/20"></i></div>';

    var techStackHTML = (project.tech_stack || []).slice(0, 4).map(function(tech) {
      return '<span class="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-slate-400 font-medium">' + escapeHTML(tech) + '</span>';
    }).join('');

    // Build links — Live URL, Play Store, App Store
    var linksHTML = '';
    if (project.live_url) {
      linksHTML += '<a href="' + escapeHTML(project.live_url) + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors mr-3">' +
        '<i class="fas fa-external-link-alt text-xs"></i> Visit Site</a>';
    }
    if (project.play_store_url) {
      linksHTML += '<a href="' + escapeHTML(project.play_store_url) + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-sm text-green-400 hover:text-green-300 font-medium transition-colors mr-3">' +
        '<i class="fab fa-google-play text-xs"></i> Play Store</a>';
    }
    if (project.app_store_url) {
      linksHTML += '<a href="' + escapeHTML(project.app_store_url) + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white font-medium transition-colors">' +
        '<i class="fab fa-apple text-xs"></i> App Store</a>';
    }

    var flagshipStar = project.is_flagship ? '<div class="absolute top-3 right-3"><span class="text-amber-400"><i class="fas fa-star"></i></span></div>' : '';

    return '<div class="glass-card overflow-hidden reveal delay-' + (((index % 3) + 1) * 100) + '" style="animation: fadeInUp 0.5s ease ' + (index * 0.1) + 's forwards; opacity: 0;">' +
      '<div class="relative overflow-hidden">' +
        thumbnailHTML +
        '<div class="absolute top-3 left-3">' +
          '<span class="px-2.5 py-1 rounded-full text-[11px] font-semibold border ' + (categoryColors[project.category] || categoryColors.website) + '">' +
            (categoryLabels[project.category] || project.category) +
          '</span>' +
        '</div>' +
        flagshipStar +
      '</div>' +
      '<div class="p-6">' +
        '<h3 class="text-lg font-bold mb-2">' + escapeHTML(project.title) + '</h3>' +
        '<p class="text-slate-400 text-sm mb-4 line-clamp-2">' + escapeHTML(project.short_description || project.description || '') + '</p>' +
        '<div class="flex flex-wrap gap-1.5 mb-4">' + techStackHTML + '</div>' +
        '<div class="flex flex-wrap gap-0">' + linksHTML + '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  initScrollReveal();
}

function renderProjectsFallback() {
  var fallbackProjects = [
    { title: 'SkaiTechgh', short_description: 'Automated digital services, mobile data, airtime, utility payments & agent store ecosystem.', category: 'flagship', tech_stack: ['React', 'Node.js', 'PostgreSQL'], is_flagship: true },
    { title: 'SkaiSchool', short_description: 'Comprehensive school management and educational technology platform.', category: 'flagship', tech_stack: ['Next.js', 'TypeScript', 'Supabase'], is_flagship: true }
  ];
  allProjects = fallbackProjects;
  renderProjects(fallbackProjects);
}

// ---- Team Members ----
async function loadTeamMembers() {
  try {
    const members = await fetchTeamMembers();
    renderTeamMembers(members);
  } catch (err) {
    console.warn('Could not load team members:', err);
    renderTeamFallback();
  }
}

function renderTeamMembers(members) {
  const container = document.getElementById('team-container');
  if (!container) return;

  if (!members || members.length === 0) {
    container.innerHTML =
      '<div class="col-span-full text-center py-16">' +
        '<div class="w-20 h-20 rounded-2xl bg-primary-600/10 flex items-center justify-center mx-auto mb-4">' +
          '<i class="fas fa-user-friends text-3xl text-primary-400"></i>' +
        '</div>' +
        '<h3 class="text-xl font-semibold mb-2 text-slate-300">Team Profiles Coming Soon</h3>' +
        '<p class="text-slate-500">We\'re adding our team members. Check back shortly!</p>' +
      '</div>';
    return;
  }

  container.innerHTML = members.map(function(member, index) {
    var photoUrl = member.photo_url
      ? (member.photo_url.startsWith('http') ? member.photo_url : getStorageUrl('team-avatars', member.photo_url))
      : null;

    var avatarHTML = photoUrl
      ? '<img src="' + escapeHTML(photoUrl) + '" alt="' + escapeHTML(member.full_name) + '" class="w-full h-64 object-cover" loading="lazy">'
      : '<div class="w-full h-64 bg-gradient-to-br from-primary-600/20 to-accent-500/20 flex items-center justify-center">' +
          '<span class="text-5xl font-bold text-white/20">' + getInitials(member.full_name) + '</span>' +
        '</div>';

    var socialHTML = '';
    if (member.github_url) {
      socialHTML += '<a href="' + escapeHTML(member.github_url) + '" target="_blank" rel="noopener noreferrer" class="w-9 h-9 rounded-lg bg-slate-800/80 hover:bg-primary-600 flex items-center justify-center text-white/70 hover:text-white transition-all text-sm"><i class="fab fa-github"></i></a>';
    }
    if (member.linkedin_url) {
      socialHTML += '<a href="' + escapeHTML(member.linkedin_url) + '" target="_blank" rel="noopener noreferrer" class="w-9 h-9 rounded-lg bg-slate-800/80 hover:bg-primary-600 flex items-center justify-center text-white/70 hover:text-white transition-all text-sm"><i class="fab fa-linkedin-in"></i></a>';
    }
    if (member.twitter_url) {
      socialHTML += '<a href="' + escapeHTML(member.twitter_url) + '" target="_blank" rel="noopener noreferrer" class="w-9 h-9 rounded-lg bg-slate-800/80 hover:bg-primary-600 flex items-center justify-center text-white/70 hover:text-white transition-all text-sm"><i class="fab fa-twitter"></i></a>';
    }

    var bioHTML = member.bio ? '<p class="text-slate-400 text-xs line-clamp-2">' + escapeHTML(member.bio) + '</p>' : '';

    return '<div class="team-card glass-card overflow-hidden reveal delay-' + (((index % 4) + 1) * 100) + '">' +
      '<div class="relative overflow-hidden">' +
        avatarHTML +
        '<div class="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent"></div>' +
        '<div class="social-links absolute bottom-4 left-0 right-0 flex justify-center gap-2">' + socialHTML + '</div>' +
      '</div>' +
      '<div class="p-5 text-center">' +
        '<h3 class="text-lg font-bold mb-1">' + escapeHTML(member.full_name) + '</h3>' +
        '<p class="text-primary-400 text-sm font-medium mb-2">' + escapeHTML(member.role) + '</p>' +
        bioHTML +
      '</div>' +
    '</div>';
  }).join('');

  initScrollReveal();
}

function renderTeamFallback() {
  var container = document.getElementById('team-container');
  if (!container) return;
  container.innerHTML =
    '<div class="col-span-full text-center py-16">' +
      '<div class="w-20 h-20 rounded-2xl bg-primary-600/10 flex items-center justify-center mx-auto mb-4">' +
        '<i class="fas fa-user-friends text-3xl text-primary-400"></i>' +
      '</div>' +
      '<h3 class="text-xl font-semibold mb-2 text-slate-300">Team Profiles Coming Soon</h3>' +
      '<p class="text-slate-500">Our talented team is being added. Stay tuned!</p>' +
    '</div>';
}

// ---- Testimonials ----
async function loadTestimonials() {
  try {
    const testimonials = await fetchTestimonials();
    renderTestimonials(testimonials);
  } catch (err) {
    console.warn('Could not load testimonials:', err);
    renderTestimonialsFallback();
  }
}

function renderTestimonials(testimonials) {
  const container = document.getElementById('testimonials-container');
  if (!container) return;
  if (!testimonials || testimonials.length === 0) {
    renderTestimonialsFallback();
    return;
  }

  container.innerHTML = testimonials.map(function(t) {
    var stars = '';
    for (var i = 0; i < (t.rating || 5); i++) stars += '★';
    for (var j = (t.rating || 5); j < 5; j++) stars += '☆';

    var photoUrl = t.photo_url
      ? (t.photo_url.startsWith('http') ? t.photo_url : getStorageUrl('team-avatars', t.photo_url))
      : null;

    var avatarHTML = photoUrl
      ? '<img src="' + escapeHTML(photoUrl) + '" alt="' + escapeHTML(t.client_name) + '" class="w-12 h-12 rounded-full object-cover">'
      : '<div class="w-12 h-12 rounded-full bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center text-white font-bold">' + getInitials(t.client_name) + '</div>';

    var roleText = escapeHTML(t.client_role || '') + (t.client_company ? ' at ' + escapeHTML(t.client_company) : '');

    return '<div class="glass-card p-8 min-w-[320px] max-w-[400px] shrink-0 snap-center">' +
      '<div class="text-amber-400 text-lg mb-4 tracking-widest">' + stars + '</div>' +
      '<p class="text-slate-300 leading-relaxed mb-6 italic">"' + escapeHTML(t.content) + '"</p>' +
      '<div class="flex items-center gap-3">' +
        avatarHTML +
        '<div>' +
          '<h4 class="font-semibold text-sm">' + escapeHTML(t.client_name) + '</h4>' +
          '<p class="text-slate-400 text-xs">' + roleText + '</p>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function renderTestimonialsFallback() {
  var defaults = [
    { client_name: 'Kwame Asante', client_role: 'CEO', client_company: 'TechVentures GH', content: 'SkaiTechgh delivered an exceptional e-commerce platform for our business. Their attention to detail and technical expertise is unmatched.', rating: 5 },
    { client_name: 'Ama Boateng', client_role: 'Head of Digital', client_company: 'EduFirst Academy', content: 'SkaiSchool transformed how we manage our school operations. The platform is intuitive and our staff adopted it immediately.', rating: 5 },
    { client_name: 'Daniel Mensah', client_role: 'Founder', client_company: 'QuickPay Solutions', content: 'The mobile app SkaiTechgh built for us exceeded all expectations. Fast delivery, clean code, and outstanding support.', rating: 5 }
  ];
  renderTestimonials(defaults);
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function escapeHTML(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function setTextContent(id, text) {
  var el = document.getElementById(id);
  if (el && text) el.textContent = text;
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(function(n) { return n[0]; }).join('').toUpperCase().slice(0, 2);
}
