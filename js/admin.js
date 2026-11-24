// ============================================
// SkaiTechgh Portfolio — Admin Dashboard JS
// ============================================
// Complete CRUD management for team, projects,
// services, inquiries, and site settings.
// ============================================

// ---- State ----
if (!window._supabase) {
  throw new Error('Supabase client is not initialized. Load js/config.js before js/admin.js.');
}

let currentUser = null;
let currentSection = 'dashboard';
let editingTeamMember = null;
let editingProject = null;
let editingService = null;
let editingMedia = null;
let viewingInquiry = null;
let siteSettingsCache = {};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  initAuth();
  initEventListeners();
});

async function initAuth() {
  try {
    const user = await getCurrentUser();
    if (user) {
      currentUser = user;
      showDashboard();
    } else {
      showLogin();
    }
  } catch (err) {
    console.error('Auth check failed:', err);
    showLogin();
  }

  // Listen for auth state changes
  window._supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      currentUser = session.user;
      showDashboard();
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      showLogin();
    }
  });
}

function initEventListeners() {
  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Password toggle
  const togglePwd = document.getElementById('toggle-password');
  if (togglePwd) {
    togglePwd.addEventListener('click', () => {
      const pwd = document.getElementById('login-password');
      const icon = togglePwd.querySelector('i');
      if (pwd.type === 'password') {
        pwd.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
      } else {
        pwd.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
      }
    });
  }

  // Sign out
  const signOutBtn = document.getElementById('sign-out-btn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', handleSignOut);
  }

  // Sidebar navigation
  document.querySelectorAll('.admin-sidebar .nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const section = item.getAttribute('data-section');
      if (section) navigateTo(section);
    });
  });

  // Mobile menu toggle
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', toggleSidebar);
  }

  // Modal overlay click to close
  const overlay = document.getElementById('admin-modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
  }

  // Escape key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Notification bell navigates to inquiries
  const notifBtn = document.getElementById('topbar-notification-btn');
  if (notifBtn) {
    notifBtn.addEventListener('click', () => navigateTo('inquiries'));
  }

  initFileUploadDragDrop('brand-logo-upload', 'brand-logo-input');
  initFileUploadDragDrop('brand-favicon-upload', 'brand-favicon-input');
}

// ============================================
// AUTH HANDLERS
// ============================================

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn');
  const errorDiv = document.getElementById('login-error');
  const errorText = document.getElementById('login-error-text');

  if (!email || !password) {
    errorDiv.classList.remove('hidden');
    errorText.textContent = 'Please enter both email and password.';
    return;
  }

  btn.classList.add('btn-loading');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Signing in...</span>';
  errorDiv.classList.add('hidden');

  try {
    await signIn(email, password);
    // Auth state change listener will handle the rest
  } catch (err) {
    console.error('Login error:', err);
    errorDiv.classList.remove('hidden');
    errorText.textContent = err.message || 'Invalid email or password. Please try again.';
    btn.classList.remove('btn-loading');
    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> <span>Sign In</span>';
  }
}

async function handleSignOut() {
  try {
    await signOut();
  } catch (err) {
    console.error('Sign out error:', err);
    showToast('Failed to sign out. Please try again.', 'error');
  }
}

// ============================================
// SCREEN MANAGEMENT
// ============================================

function showLogin() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('admin-dashboard').classList.add('hidden');
}

function showDashboard() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('admin-dashboard').classList.remove('hidden');

  // Set user info in sidebar and topbar
  if (currentUser) {
    const email = currentUser.email || 'admin@example.com';
    const initial = email.charAt(0).toUpperCase();
    document.getElementById('sidebar-email').textContent = email;
    document.getElementById('topbar-email').textContent = email;
    document.getElementById('sidebar-avatar').textContent = initial;
    document.getElementById('topbar-avatar').textContent = initial;
  }

  // Load all data
  loadDashboardStats();
  loadRecentInquiries();
  loadTeamMembers();
  loadProjects();
  loadMediaAssets();
  loadServices();
  loadInquiries();
  loadSiteSettings();
  loadAccountInfo();
}

// ============================================
// SIDEBAR NAVIGATION
// ============================================

function navigateTo(section) {
  currentSection = section;

  // Update nav items
  document.querySelectorAll('.admin-sidebar .nav-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-section') === section);
  });

  // Show/hide sections
  document.querySelectorAll('.section-content').forEach(el => {
    el.classList.remove('active');
  });
  const target = document.getElementById('section-' + section);
  if (target) target.classList.add('active');

  // Update topbar title
  const titles = {
    dashboard: 'Dashboard',
    team: 'Team Members',
    projects: 'Websites & Apps',
    media: 'Media Library',
    services: 'Services',
    inquiries: 'Client Inquiries',
    settings: 'Site Settings',
    account: 'My Account'
  };
  document.getElementById('topbar-title').textContent = titles[section] || 'Dashboard';

  // Close sidebar on mobile
  closeSidebar();
}

function toggleSidebar() {
  const sidebar = document.getElementById('admin-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('mobile-open');
  overlay.classList.toggle('hidden');
}

function closeSidebar() {
  const sidebar = document.getElementById('admin-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.remove('mobile-open');
  overlay.classList.add('hidden');
}

// ============================================
// MODAL MANAGEMENT
// ============================================

function openModal(html) {
  const overlay = document.getElementById('admin-modal-overlay');
  const modal = document.getElementById('admin-modal');
  modal.innerHTML = html;
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const overlay = document.getElementById('admin-modal-overlay');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  editingTeamMember = null;
  editingProject = null;
  editingService = null;
  editingMedia = null;
  viewingInquiry = null;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getFileExtension(filename) {
  return filename.split('.').pop().toLowerCase();
}

function statusBadge(status) {
  const classes = {
    new: 'badge-new',
    contacted: 'badge-contacted',
    closed: 'badge-closed',
    published: 'badge-published',
    draft: 'badge-draft'
  };
  return `<span class="badge ${classes[status] || 'badge-new'}">${escapeHtml(status)}</span>`;
}

function categoryLabel(cat) {
  const labels = {
    website: 'Website',
    mobile_app: 'Mobile App',
    web_app: 'Web App',
    flagship: 'Flagship'
  };
  return labels[cat] || cat || '—';
}

function setButtonLoading(btn, loading, originalHTML) {
  if (loading) {
    btn.dataset.originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    btn.classList.add('btn-loading');
  } else {
    btn.innerHTML = originalHTML || btn.dataset.originalHtml || btn.innerHTML;
    btn.classList.remove('btn-loading');
  }
}

// ============================================
// DASHBOARD SECTION
// ============================================

async function loadDashboardStats() {
  try {
    // Team members count
    const { count: teamCount, error: teamErr } = await _supabase
      .from('team_members').select('*', { count: 'exact', head: true });
    if (!teamErr) document.getElementById('stat-team').textContent = teamCount || 0;

    // Projects count
    const { count: projCount, error: projErr } = await _supabase
      .from('projects').select('*', { count: 'exact', head: true });
    if (!projErr) document.getElementById('stat-projects').textContent = projCount || 0;

    // Services count
    const { count: svcCount, error: svcErr } = await _supabase
      .from('services').select('*', { count: 'exact', head: true });
    if (!svcErr) document.getElementById('stat-services').textContent = svcCount || 0;

    // New inquiries count
    const { count: inqCount, error: inqErr } = await _supabase
      .from('inquiries').select('*', { count: 'exact', head: true })
      .eq('status', 'new');
    if (!inqErr) {
      const count = inqCount || 0;
      document.getElementById('stat-inquiries').textContent = count;
      updateInquiryBadges(count);
    }
  } catch (err) {
    console.error('Failed to load dashboard stats:', err);
  }
}

function updateInquiryBadges(count) {
  const sidebarBadge = document.getElementById('sidebar-inquiry-badge');
  const topbarBadge = document.getElementById('topbar-inquiry-badge');

  if (count > 0) {
    sidebarBadge.textContent = count;
    sidebarBadge.classList.remove('hidden');
    topbarBadge.textContent = count;
    topbarBadge.classList.remove('hidden');
  } else {
    sidebarBadge.classList.add('hidden');
    topbarBadge.classList.add('hidden');
  }
}

async function loadRecentInquiries() {
  const tbody = document.getElementById('recent-inquiries-body');
  try {
    const { data, error } = await _supabase
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    if (!data || data.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="5">
          <div class="empty-state">
            <i class="fas fa-inbox block"></i>
            <p>No inquiries yet. They'll appear here when clients reach out.</p>
          </div>
        </td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(inq => `
      <tr>
        <td class="font-medium text-white">${escapeHtml(inq.full_name || inq.name)}</td>
        <td>${escapeHtml(inq.email)}</td>
        <td>${escapeHtml(inq.service_type || '—')}</td>
        <td>${formatDate(inq.created_at)}</td>
        <td>${statusBadge(inq.status || 'new')}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load recent inquiries:', err);
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-red-400 py-4">Failed to load inquiries.</td></tr>`;
  }
}

// ============================================
// TEAM MEMBERS CRUD
// ============================================

async function loadTeamMembers() {
  const tbody = document.getElementById('team-table-body');
  try {
    const { data, error } = await _supabase
      .from('team_members')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="6">
          <div class="empty-state">
            <i class="fas fa-users block"></i>
            <p>No team members yet. Add your first team member!</p>
          </div>
        </td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(member => {
      const photoUrl = member.photo_url
        ? (member.photo_url.startsWith('http') ? member.photo_url : getStorageUrl('team-avatars', member.photo_url))
        : null;
      return `
        <tr>
          <td>
            ${photoUrl
              ? `<img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(member.full_name)}" class="w-10 h-10 rounded-full object-cover border border-primary-500/20">`
              : `<div class="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-300 text-sm font-bold">${escapeHtml((member.full_name || '?').charAt(0).toUpperCase())}</div>`
            }
          </td>
          <td class="font-medium text-white">${escapeHtml(member.full_name)}</td>
          <td>${escapeHtml(member.role || '—')}</td>
          <td>
            <div class="toggle-switch ${member.is_visible ? 'active' : ''}" onclick="toggleTeamVisibility('${member.id}', ${!member.is_visible})" title="${member.is_visible ? 'Visible' : 'Hidden'}"></div>
          </td>
          <td>${member.display_order || 0}</td>
          <td>
            <div class="flex items-center gap-2">
              <button class="btn-sm btn-edit" onclick="openTeamModal('${member.id}')"><i class="fas fa-edit"></i> Edit</button>
              <button class="btn-sm btn-delete" onclick="deleteTeamMember('${member.id}', '${escapeHtml(member.photo_url || '')}')"><i class="fas fa-trash"></i></button>
            </div>
          </td>
        </tr>`;
    }).join('');
  } catch (err) {
    console.error('Failed to load team members:', err);
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-red-400 py-4">Failed to load team members.</td></tr>`;
  }
}

async function toggleTeamVisibility(id, newValue) {
  try {
    const { error } = await _supabase
      .from('team_members')
      .update({ is_visible: newValue })
      .eq('id', id);
    if (error) throw error;
    showToast(`Member ${newValue ? 'shown' : 'hidden'} on site.`, 'success');
    loadTeamMembers();
  } catch (err) {
    console.error('Toggle visibility error:', err);
    showToast('Failed to update visibility.', 'error');
  }
}

async function openTeamModal(memberId) {
  let member = null;
  if (memberId) {
    try {
      const { data, error } = await _supabase
        .from('team_members')
        .select('*')
        .eq('id', memberId)
        .single();
      if (error) throw error;
      member = data;
      editingTeamMember = member;
    } catch (err) {
      console.error('Failed to fetch member:', err);
      showToast('Failed to load member data.', 'error');
      return;
    }
  } else {
    editingTeamMember = null;
  }

  const isEdit = !!member;
  const photoUrl = member?.photo_url
    ? (member.photo_url.startsWith('http') ? member.photo_url : getStorageUrl('team-avatars', member.photo_url))
    : null;

  const html = `
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-white">${isEdit ? 'Edit Team Member' : 'Add Team Member'}</h2>
      <button class="text-slate-400 hover:text-white transition-colors text-xl" onclick="closeModal()"><i class="fas fa-times"></i></button>
    </div>

    <form id="team-form" onsubmit="saveTeamMember(event)">
      <!-- Photo Upload -->
      <div class="mb-5">
        <label class="form-label">Photo</label>
        <div class="file-upload-area" id="team-photo-upload" onclick="document.getElementById('team-photo-input').click()">
          ${photoUrl
            ? `<img src="${escapeHtml(photoUrl)}" id="team-photo-preview" alt="Current photo" class="mx-auto">`
            : `<div id="team-photo-preview-placeholder"><i class="fas fa-cloud-upload-alt text-2xl mb-2 block"></i><p class="text-sm">Click or drag & drop to upload photo</p><p class="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p></div>`
          }
        </div>
        <input type="file" id="team-photo-input" accept="image/*" class="hidden" onchange="previewTeamPhoto(this)">
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="form-label">Full Name *</label>
          <input type="text" id="team-name" class="form-input" value="${escapeHtml(member?.full_name || '')}" required>
        </div>
        <div>
          <label class="form-label">Role *</label>
          <input type="text" id="team-role" class="form-input" value="${escapeHtml(member?.role || '')}" required placeholder="e.g., Full Stack Developer">
        </div>
      </div>

      <div class="mb-4">
        <label class="form-label">Bio</label>
        <textarea id="team-bio" class="form-input" rows="3" placeholder="Short bio...">${escapeHtml(member?.bio || '')}</textarea>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="form-label">Email</label>
          <input type="email" id="team-email" class="form-input" value="${escapeHtml(member?.email || '')}" placeholder="member@email.com">
        </div>
        <div>
          <label class="form-label">GitHub URL</label>
          <input type="url" id="team-github" class="form-input" value="${escapeHtml(member?.github_url || '')}" placeholder="https://github.com/...">
        </div>
        <div>
          <label class="form-label">LinkedIn URL</label>
          <input type="url" id="team-linkedin" class="form-input" value="${escapeHtml(member?.linkedin_url || '')}" placeholder="https://linkedin.com/in/...">
        </div>
        <div>
          <label class="form-label">Twitter URL</label>
          <input type="url" id="team-twitter" class="form-input" value="${escapeHtml(member?.twitter_url || '')}" placeholder="https://twitter.com/...">
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label class="form-label">Display Order</label>
          <input type="number" id="team-order" class="form-input" value="${member?.display_order || 0}" min="0">
        </div>
        <div class="flex items-center gap-3 pt-6">
          <input type="checkbox" id="team-visible" class="w-5 h-5 rounded accent-primary-500 cursor-pointer" ${member?.is_visible !== false ? 'checked' : ''}>
          <label for="team-visible" class="form-label mb-0 cursor-pointer">Visible on website</label>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <div>
          ${isEdit ? `<button type="button" class="btn-sm btn-delete" onclick="deleteTeamMember('${member.id}', '${escapeHtml(member.photo_url || '')}')"><i class="fas fa-trash"></i> Delete</button>` : ''}
        </div>
        <div class="flex gap-3">
          <button type="button" class="btn-secondary text-sm py-2" onclick="closeModal()">Cancel</button>
          <button type="submit" id="team-save-btn" class="btn-primary text-sm py-2"><i class="fas fa-save"></i> ${isEdit ? 'Update' : 'Create'} Member</button>
        </div>
      </div>
    </form>
  `;

  openModal(html);
  initFileUploadDragDrop('team-photo-upload', 'team-photo-input');
}

function previewTeamPhoto(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const area = document.getElementById('team-photo-upload');
      area.innerHTML = `<img src="${e.target.result}" id="team-photo-preview" alt="Preview" class="mx-auto max-h-32 rounded-lg">
        <p class="text-xs text-slate-400 mt-2">Click to change</p>`;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

async function saveTeamMember(e) {
  e.preventDefault();
  const btn = document.getElementById('team-save-btn');
  const originalHTML = btn.innerHTML;
  setButtonLoading(btn, true);

  try {
    const photoInput = document.getElementById('team-photo-input');
    let photoUrl = editingTeamMember?.photo_url || null;

    // Upload photo if new file selected
    if (photoInput.files && photoInput.files[0]) {
      const file = photoInput.files[0];
      const ext = getFileExtension(file.name);
      const path = `${generateUUID()}.${ext}`;
      photoUrl = await uploadFile('team-avatars', path, file);
    }

    const memberData = {
      full_name: document.getElementById('team-name').value.trim(),
      role: document.getElementById('team-role').value.trim(),
      bio: document.getElementById('team-bio').value.trim(),
      email: document.getElementById('team-email').value.trim(),
      github_url: document.getElementById('team-github').value.trim(),
      linkedin_url: document.getElementById('team-linkedin').value.trim(),
      twitter_url: document.getElementById('team-twitter').value.trim(),
      display_order: parseInt(document.getElementById('team-order').value) || 0,
      is_visible: document.getElementById('team-visible').checked,
      photo_url: photoUrl
    };

    if (editingTeamMember) {
      // Update
      const { error } = await _supabase
        .from('team_members')
        .update(memberData)
        .eq('id', editingTeamMember.id);
      if (error) throw error;
      showToast('Team member updated successfully!', 'success');
    } else {
      // Insert
      const { error } = await _supabase
        .from('team_members')
        .insert([memberData]);
      if (error) throw error;
      showToast('Team member created successfully!', 'success');
    }

    closeModal();
    loadTeamMembers();
    loadDashboardStats();
  } catch (err) {
    console.error('Save team member error:', err);
    showToast('Failed to save team member: ' + (err.message || 'Unknown error'), 'error');
    setButtonLoading(btn, false, originalHTML);
  }
}

async function deleteTeamMember(id, photoPath) {
  if (!confirm('Are you sure you want to delete this team member? This action cannot be undone.')) return;

  try {
    // Delete photo from storage if exists
    if (photoPath && !photoPath.startsWith('http')) {
      try {
        await deleteFile('team-avatars', photoPath);
      } catch (e) {
        console.warn('Failed to delete photo from storage:', e);
      }
    }

    const { error } = await _supabase
      .from('team_members')
      .delete()
      .eq('id', id);
    if (error) throw error;

    showToast('Team member deleted.', 'success');
    closeModal();
    loadTeamMembers();
    loadDashboardStats();
  } catch (err) {
    console.error('Delete team member error:', err);
    showToast('Failed to delete team member.', 'error');
  }
}

// ============================================
// PROJECTS CRUD
// ============================================

async function loadProjects() {
  const tbody = document.getElementById('projects-table-body');
  try {
    const { data, error } = await _supabase
      .from('projects')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="7">
          <div class="empty-state">
            <i class="fas fa-folder-open block"></i>
            <p>No projects yet. Add your first project to showcase!</p>
          </div>
        </td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(proj => {
      const thumbUrl = proj.thumbnail_url
        ? (proj.thumbnail_url.startsWith('http') ? proj.thumbnail_url : getStorageUrl('project-images', proj.thumbnail_url))
        : null;
      return `
        <tr>
          <td>
            ${thumbUrl
              ? `<img src="${escapeHtml(thumbUrl)}" alt="${escapeHtml(proj.title)}" class="w-16 h-10 rounded-lg object-cover border border-primary-500/20">`
              : `<div class="w-16 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-slate-500 text-xs"><i class="fas fa-image"></i></div>`
            }
          </td>
          <td class="font-medium text-white">${escapeHtml(proj.title)}</td>
          <td><span class="badge badge-new">${categoryLabel(proj.category)}</span></td>
          <td>${statusBadge(proj.status || 'draft')}</td>
          <td>
            ${proj.is_flagship
              ? '<i class="fas fa-star text-amber-400"></i>'
              : '<i class="far fa-star text-slate-600"></i>'
            }
          </td>
          <td>${proj.display_order || 0}</td>
          <td>
            <div class="flex items-center gap-2">
              <button class="btn-sm btn-edit" onclick="openProjectModal('${proj.id}')"><i class="fas fa-edit"></i> Edit</button>
              <button class="btn-sm btn-delete" onclick="deleteProject('${proj.id}')"><i class="fas fa-trash"></i></button>
            </div>
          </td>
        </tr>`;
    }).join('');
  } catch (err) {
    console.error('Failed to load projects:', err);
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-red-400 py-4">Failed to load projects.</td></tr>`;
  }
}

async function openProjectModal(projectId) {
  newProjectImages = [];
  removedProjectImages = [];
  let project = null;
  if (projectId) {
    try {
      const { data, error } = await _supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      if (error) throw error;
      project = data;
      editingProject = project;
    } catch (err) {
      console.error('Failed to fetch project:', err);
      showToast('Failed to load project data.', 'error');
      return;
    }
  } else {
    editingProject = null;
  }

  const isEdit = !!project;
  const thumbUrl = project?.thumbnail_url
    ? (project.thumbnail_url.startsWith('http') ? project.thumbnail_url : getStorageUrl('project-images', project.thumbnail_url))
    : null;
  const techStack = Array.isArray(project?.tech_stack) ? project.tech_stack.join(', ') : (project?.tech_stack || '');
  const existingImages = Array.isArray(project?.images) ? project.images : [];

  const html = `
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-white">${isEdit ? 'Edit Project' : 'Add Project'}</h2>
      <button class="text-slate-400 hover:text-white transition-colors text-xl" onclick="closeModal()"><i class="fas fa-times"></i></button>
    </div>

    <form id="project-form" onsubmit="saveProject(event)">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="form-label">Title *</label>
          <input type="text" id="proj-title" class="form-input" value="${escapeHtml(project?.title || '')}" required>
        </div>
        <div>
          <label class="form-label">Category *</label>
          <select id="proj-category" class="form-input" required>
            <option value="website" ${project?.category === 'website' ? 'selected' : ''}>Website</option>
            <option value="mobile_app" ${project?.category === 'mobile_app' ? 'selected' : ''}>Mobile App</option>
            <option value="web_app" ${project?.category === 'web_app' ? 'selected' : ''}>Web App</option>
            <option value="flagship" ${project?.category === 'flagship' ? 'selected' : ''}>Flagship</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="form-label">Card Icon <span class="text-slate-500">(Font Awesome class)</span></label>
          <input type="text" id="proj-icon" class="form-input" value="${escapeHtml(project?.icon || 'fas fa-bolt')}" placeholder="fas fa-bolt">
        </div>
        <div>
          <label class="form-label">Highlights <span class="text-slate-500">(comma-separated)</span></label>
          <input type="text" id="proj-highlights" class="form-input" value="${escapeHtml(Array.isArray(project?.highlights) ? project.highlights.join(', ') : '')}" placeholder="Fast, Secure, Easy to use">
        </div>
      </div>

      <div class="mb-4">
        <label class="form-label">Short Description</label>
        <input type="text" id="proj-short-desc" class="form-input" value="${escapeHtml(project?.short_description || '')}" placeholder="One-liner about the project">
      </div>

      <div class="mb-4">
        <label class="form-label">Full Description</label>
        <textarea id="proj-full-desc" class="form-input" rows="4" placeholder="Detailed project description...">${escapeHtml(project?.full_description || '')}</textarea>
      </div>

      <div class="mb-4">
        <label class="form-label">Client Challenge</label>
        <textarea id="proj-challenge" class="form-input" rows="3" placeholder="What problem did this project solve?">${escapeHtml(project?.client_challenge || '')}</textarea>
      </div>

      <div class="mb-4">
        <label class="form-label">Tech Stack <span class="text-slate-500">(comma-separated)</span></label>
        <input type="text" id="proj-tech-stack" class="form-input" value="${escapeHtml(techStack)}" placeholder="React, Node.js, Supabase, Tailwind">
        <div id="proj-tech-tags" class="flex flex-wrap gap-2 mt-2"></div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="form-label">Live URL</label>
          <input type="url" id="proj-live-url" class="form-input" value="${escapeHtml(project?.live_url || '')}" placeholder="https://example.com">
        </div>
        <div>
          <label class="form-label">GitHub URL</label>
          <input type="url" id="proj-github-url" class="form-input" value="${escapeHtml(project?.github_url || '')}" placeholder="https://github.com/...">
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label class="form-label">Display Order</label>
          <input type="number" id="proj-order" class="form-input" value="${project?.display_order || 0}" min="0">
        </div>
        <div>
          <label class="form-label">Status</label>
          <select id="proj-status" class="form-input">
            <option value="published" ${project?.status === 'published' ? 'selected' : ''}>Published</option>
            <option value="draft" ${(project?.status === 'draft' || !project) ? 'selected' : ''}>Draft</option>
          </select>
        </div>
        <div class="flex items-center gap-3 pt-6">
          <input type="checkbox" id="proj-flagship" class="w-5 h-5 rounded accent-amber-500 cursor-pointer" ${project?.is_flagship ? 'checked' : ''}>
          <label for="proj-flagship" class="form-label mb-0 cursor-pointer">Flagship Project</label>
        </div>
      </div>

      <!-- Thumbnail Upload -->
      <div class="mb-5">
        <label class="form-label">Thumbnail Image</label>
        <div class="file-upload-area" id="proj-thumb-upload" onclick="document.getElementById('proj-thumb-input').click()">
          ${thumbUrl
            ? `<img src="${escapeHtml(thumbUrl)}" id="proj-thumb-preview" alt="Thumbnail" class="mx-auto max-h-28 rounded-lg">
               <p class="text-xs text-slate-400 mt-2">Click to change</p>`
            : `<div id="proj-thumb-placeholder"><i class="fas fa-image text-2xl mb-2 block"></i><p class="text-sm">Click or drag & drop thumbnail</p><p class="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p></div>`
          }
        </div>
        <input type="file" id="proj-thumb-input" accept="image/*" class="hidden" onchange="previewProjectThumb(this)">
      </div>

      <!-- Multiple Images Upload -->
      <div class="mb-6">
        <label class="form-label">Project Images</label>
        <div class="file-upload-area" id="proj-images-upload" onclick="document.getElementById('proj-images-input').click()">
          <i class="fas fa-images text-2xl mb-2 block"></i>
          <p class="text-sm">Click or drag & drop to add images</p>
          <p class="text-xs text-slate-500 mt-1">Multiple files supported</p>
        </div>
        <input type="file" id="proj-images-input" accept="image/*" multiple class="hidden" onchange="previewProjectImages(this)">
        <div id="proj-images-preview" class="image-preview-grid mt-3">
          ${existingImages.map((img, i) => {
            const url = img.startsWith('http') ? img : getStorageUrl('project-images', img);
            return `<div class="preview-item" data-existing="${escapeHtml(img)}">
              <img src="${escapeHtml(url)}" alt="Image ${i + 1}">
              <button type="button" class="remove-btn" onclick="removeProjectImage(this, '${escapeHtml(img)}')"><i class="fas fa-times"></i></button>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="flex items-center justify-between">
        <div>
          ${isEdit ? `<button type="button" class="btn-sm btn-delete" onclick="deleteProject('${project.id}')"><i class="fas fa-trash"></i> Delete</button>` : ''}
        </div>
        <div class="flex gap-3">
          <button type="button" class="btn-secondary text-sm py-2" onclick="closeModal()">Cancel</button>
          <button type="submit" id="proj-save-btn" class="btn-primary text-sm py-2"><i class="fas fa-save"></i> ${isEdit ? 'Update' : 'Create'} Project</button>
        </div>
      </div>
    </form>
  `;

  openModal(html);
  initFileUploadDragDrop('proj-thumb-upload', 'proj-thumb-input');
  initFileUploadDragDrop('proj-images-upload', 'proj-images-input');
  updateTechStackTags();

  // Listen for tech stack input changes
  const techInput = document.getElementById('proj-tech-stack');
  if (techInput) {
    techInput.addEventListener('input', updateTechStackTags);
  }
}

function previewProjectThumb(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const area = document.getElementById('proj-thumb-upload');
      area.innerHTML = `<img src="${e.target.result}" id="proj-thumb-preview" alt="Preview" class="mx-auto max-h-28 rounded-lg">
        <p class="text-xs text-slate-400 mt-2">Click to change</p>`;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

// Store new images to upload
let newProjectImages = [];
let removedProjectImages = [];

function previewProjectImages(input) {
  const previewGrid = document.getElementById('proj-images-preview');
  if (input.files) {
    Array.from(input.files).forEach(file => {
      newProjectImages.push(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.dataset.newIndex = newProjectImages.length - 1;
        div.innerHTML = `<img src="${e.target.result}" alt="New image">
          <button type="button" class="remove-btn" onclick="removeNewProjectImage(this, ${newProjectImages.length - 1})"><i class="fas fa-times"></i></button>`;
        previewGrid.appendChild(div);
      };
      reader.readAsDataURL(file);
    });
  }
}

function removeProjectImage(btn, imagePath) {
  removedProjectImages.push(imagePath);
  btn.closest('.preview-item').remove();
}

function removeNewProjectImage(btn, index) {
  newProjectImages[index] = null; // Mark as removed
  btn.closest('.preview-item').remove();
}

function updateTechStackTags() {
  const input = document.getElementById('proj-tech-stack');
  const container = document.getElementById('proj-tech-tags');
  if (!input || !container) return;

  const tags = input.value.split(',').map(t => t.trim()).filter(Boolean);
  container.innerHTML = tags.map(tag => `<span class="tag-pill">${escapeHtml(tag)}</span>`).join('');
}

async function saveProject(e) {
  // Sync Quill editor content to hidden fields
  if (window._projQuill) {
    document.getElementById('proj-full-desc').value = window._projQuill.getText();
    document.getElementById('proj-desc-html').value = window._projQuill.root.innerHTML;
  }
  e.preventDefault();
  const btn = document.getElementById('proj-save-btn');
  const originalHTML = btn.innerHTML;
  setButtonLoading(btn, true);

  try {
    let thumbnailUrl = editingProject?.thumbnail_url || null;
    const thumbInput = document.getElementById('proj-thumb-input');

    // Upload thumbnail if new file selected
    if (thumbInput.files && thumbInput.files[0]) {
      const file = thumbInput.files[0];
      const ext = getFileExtension(file.name);
      const projectId = editingProject?.id || generateUUID();
      const path = `projects/${projectId}/thumb_${generateUUID()}.${ext}`;
      thumbnailUrl = await uploadFile('project-images', path, file);
    }

    // Handle images
    let images = editingProject?.images ? [...editingProject.images] : [];

    // Remove deleted images
    for (const removedPath of removedProjectImages) {
      images = images.filter(img => img !== removedPath);
      if (!removedPath.startsWith('http')) {
        try { await deleteFile('project-images', removedPath); } catch (e) { console.warn('Failed to delete image:', e); }
      }
    }

    // Upload new images
    const projectId = editingProject?.id || generateUUID();
    for (const file of newProjectImages) {
      if (!file) continue; // Skip removed ones
      const ext = getFileExtension(file.name);
      const path = `projects/${projectId}/${generateUUID()}.${ext}`;
      const url = await uploadFile('project-images', path, file);
      images.push(url);
    }

    // Parse tech stack
    const techStackRaw = document.getElementById('proj-tech-stack').value;
    const techStack = techStackRaw.split(',').map(t => t.trim()).filter(Boolean);

    const projectData = {
      title: document.getElementById('proj-title').value.trim(),
      short_description: document.getElementById('proj-short-desc').value.trim(),
      description: document.getElementById('proj-full-desc').value.trim(),
      full_description: document.getElementById('proj-full-desc').value.trim(),
      client_challenge: document.getElementById('proj-challenge').value.trim(),
      category: document.getElementById('proj-category').value,
      tech_stack: techStack,
      live_url: document.getElementById('proj-live-url').value.trim(),
      github_url: document.getElementById('proj-github-url').value.trim(),
      icon: document.getElementById('proj-icon').value.trim() || 'fas fa-code',
      highlights: document.getElementById('proj-highlights').value.split(',').map(t => t.trim()).filter(Boolean),
      display_order: parseInt(document.getElementById('proj-order').value) || 0,
      status: document.getElementById('proj-status').value,
      is_flagship: document.getElementById('proj-flagship').checked,
      thumbnail_url: thumbnailUrl,
      images: images
    };

    if (editingProject) {
      const { error } = await _supabase
        .from('projects')
        .update(projectData)
        .eq('id', editingProject.id);
      if (error) throw error;
      showToast('Project updated successfully!', 'success');
    } else {
      const { error } = await _supabase
        .from('projects')
        .insert([projectData]);
      if (error) throw error;
      showToast('Project created successfully!', 'success');
    }

    // Reset state
    newProjectImages = [];
    removedProjectImages = [];

    closeModal();
    loadProjects();
    loadDashboardStats();
  } catch (err) {
    console.error('Save project error:', err);
    showToast('Failed to save project: ' + (err.message || 'Unknown error'), 'error');
    setButtonLoading(btn, false, originalHTML);
  }
}

async function deleteProject(id) {
  if (!confirm('Are you sure you want to delete this project? All associated images will also be deleted. This action cannot be undone.')) return;

  try {
    // Fetch project to get image paths
    const { data: proj } = await _supabase
      .from('projects')
      .select('thumbnail_url, images')
      .eq('id', id)
      .single();

    // Delete images from storage
    if (proj) {
      const pathsToDelete = [];
      if (proj.thumbnail_url && !proj.thumbnail_url.startsWith('http')) {
        pathsToDelete.push(proj.thumbnail_url);
      }
      if (Array.isArray(proj.images)) {
        proj.images.forEach(img => {
          if (img && !img.startsWith('http')) pathsToDelete.push(img);
        });
      }
      if (pathsToDelete.length > 0) {
        try { await deleteFile('project-images', pathsToDelete); } catch (e) { console.warn('Failed to delete project images:', e); }
      }
    }

    const { error } = await _supabase
      .from('projects')
      .delete()
      .eq('id', id);
    if (error) throw error;

    showToast('Project deleted.', 'success');
    closeModal();
    loadProjects();
    loadDashboardStats();
  } catch (err) {
    console.error('Delete project error:', err);
    showToast('Failed to delete project.', 'error');
  }
}

// ============================================
// MEDIA LIBRARY
// ============================================

async function loadMediaAssets() {
  const tbody = document.getElementById('media-table-body');
  if (!tbody) return;
  try {
    const media = await fetchMediaAssets();
    if (!media.length) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><i class="fas fa-photo-video block"></i><p>No media yet. Upload your first image.</p></div></td></tr>';
      return;
    }
    tbody.innerHTML = media.map(asset => `
      <tr>
        <td><img src="${escapeHtml(asset.file_url)}" alt="${escapeHtml(asset.alt_text || asset.name)}" class="w-16 h-12 rounded-lg object-cover border border-primary-500/20"></td>
        <td class="font-medium text-white">${escapeHtml(asset.name)}</td>
        <td class="text-slate-400">${escapeHtml(asset.alt_text || '—')}</td>
        <td><div class="toggle-switch ${asset.is_visible ? 'active' : ''}" onclick="toggleMediaVisibility('${asset.id}', ${!asset.is_visible})" title="${asset.is_visible ? 'Visible' : 'Hidden'}"></div></td>
        <td>${formatDate(asset.created_at)}</td>
        <td><div class="flex items-center gap-2"><button class="btn-sm btn-view" onclick="copyMediaUrl('${escapeHtml(asset.file_url)}')"><i class="fas fa-link"></i></button><button class="btn-sm btn-delete" onclick="deleteMediaAsset('${asset.id}', '${escapeHtml(asset.file_path)}')"><i class="fas fa-trash"></i></button></div></td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load media:', err);
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-red-400 py-4">Media table is unavailable. Run migration-v3-content-control.sql in Supabase.</td></tr>';
  }
}

function openMediaModal() {
  editingMedia = null;
  const html = `
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-white">Upload Media</h2>
      <button class="text-slate-400 hover:text-white transition-colors text-xl" onclick="closeModal()"><i class="fas fa-times"></i></button>
    </div>
    <form id="media-form" onsubmit="saveMediaAsset(event)">
      <div class="mb-5">
        <label class="form-label">Image File *</label>
        <div class="file-upload-area" id="media-upload" onclick="document.getElementById('media-input').click()">
          <div id="media-preview"><i class="fas fa-cloud-upload-alt text-2xl mb-2 block"></i><p class="text-sm">Click or drag & drop to upload</p><p class="text-xs text-slate-500 mt-1">PNG, JPG, WebP, GIF, SVG up to 10MB</p></div>
        </div>
        <input type="file" id="media-input" accept="image/*,.svg" class="hidden" onchange="previewMediaImage(this)">
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div><label class="form-label">Name *</label><input type="text" id="media-name" class="form-input" required placeholder="Homepage hero image"></div>
        <div><label class="form-label">Alt Text</label><input type="text" id="media-alt" class="form-input" placeholder="Describe the image"></div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div><label class="form-label">Display Order</label><input type="number" id="media-order" class="form-input" min="0" value="0"></div>
        <div class="flex items-center gap-3 pt-6"><input type="checkbox" id="media-visible" class="w-5 h-5 rounded accent-primary-500 cursor-pointer" checked><label for="media-visible" class="form-label mb-0 cursor-pointer">Publicly visible</label></div>
      </div>
      <div class="flex justify-end gap-3"><button type="button" class="btn-secondary text-sm py-2" onclick="closeModal()">Cancel</button><button type="submit" id="media-save-btn" class="btn-primary text-sm py-2"><i class="fas fa-upload"></i> Upload Image</button></div>
    </form>
  `;
  openModal(html);
  initFileUploadDragDrop('media-upload', 'media-input');
}

function previewMediaImage(input) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = event => {
    document.getElementById('media-preview').innerHTML = `<img src="${event.target.result}" alt="Preview" class="mx-auto max-h-32 rounded-lg"><p class="text-xs text-slate-400 mt-2">Click to change</p>`;
  };
  reader.readAsDataURL(input.files[0]);
}

async function saveMediaAsset(e) {
  e.preventDefault();
  const btn = document.getElementById('media-save-btn');
  const originalHTML = btn.innerHTML;
  setButtonLoading(btn, true);
  try {
    const input = document.getElementById('media-input');
    if (!input.files || !input.files[0]) throw new Error('Please choose an image first.');
    const file = input.files[0];
    const ext = getFileExtension(file.name);
    const path = `library/${generateUUID()}.${ext}`;
    const fileUrl = await uploadFile('site-media', path, file);
    const { error } = await _supabase.from('media_assets').insert([{
      name: document.getElementById('media-name').value.trim(),
      file_path: path,
      file_url: fileUrl,
      alt_text: document.getElementById('media-alt').value.trim(),
      media_type: 'image',
      display_order: parseInt(document.getElementById('media-order').value) || 0,
      is_visible: document.getElementById('media-visible').checked
    }]);
    if (error) throw error;
    showToast('Image uploaded successfully!', 'success');
    closeModal();
    loadMediaAssets();
  } catch (err) {
    console.error('Save media error:', err);
    showToast('Failed to upload image: ' + (err.message || 'Unknown error'), 'error');
    setButtonLoading(btn, false, originalHTML);
  }
}

async function toggleMediaVisibility(id, newValue) {
  try {
    const { error } = await _supabase.from('media_assets').update({ is_visible: newValue }).eq('id', id);
    if (error) throw error;
    loadMediaAssets();
  } catch (err) {
    showToast('Failed to update media visibility.', 'error');
  }
}

async function deleteMediaAsset(id, filePath) {
  if (!confirm('Delete this media file? This cannot be undone.')) return;
  try {
    const { error } = await _supabase.from('media_assets').delete().eq('id', id);
    if (error) throw error;
    if (filePath) {
      try { await deleteFile('site-media', filePath); } catch (storageError) { console.warn('Storage cleanup failed:', storageError); }
    }
    showToast('Media deleted.', 'success');
    loadMediaAssets();
  } catch (err) {
    console.error('Delete media error:', err);
    showToast('Failed to delete media.', 'error');
  }
}

async function copyMediaUrl(url) {
  try {
    await navigator.clipboard.writeText(url);
    showToast('Media URL copied.', 'success');
  } catch (err) {
    window.prompt('Copy this media URL:', url);
  }
}

// ============================================
// SERVICES CRUD
// ============================================

async function loadServices() {
  const tbody = document.getElementById('services-table-body');
  try {
    const { data, error } = await _supabase
      .from('services')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="5">
          <div class="empty-state">
            <i class="fas fa-cogs block"></i>
            <p>No services yet. Add the services you offer!</p>
          </div>
        </td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(svc => `
      <tr>
        <td>
          <div class="icon-preview">
            <i class="${escapeHtml(svc.icon || 'fas fa-wrench')}"></i>
          </div>
        </td>
        <td class="font-medium text-white">${escapeHtml(svc.title)}</td>
        <td>
          <div class="toggle-switch ${svc.is_visible ? 'active' : ''}" onclick="toggleServiceVisibility('${svc.id}', ${!svc.is_visible})" title="${svc.is_visible ? 'Visible' : 'Hidden'}"></div>
        </td>
        <td>${svc.display_order || 0}</td>
        <td>
          <div class="flex items-center gap-2">
            <button class="btn-sm btn-edit" onclick="openServiceModal('${svc.id}')"><i class="fas fa-edit"></i> Edit</button>
            <button class="btn-sm btn-delete" onclick="deleteService('${svc.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load services:', err);
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-red-400 py-4">Failed to load services.</td></tr>`;
  }
}

async function toggleServiceVisibility(id, newValue) {
  try {
    const { error } = await _supabase
      .from('services')
      .update({ is_visible: newValue })
      .eq('id', id);
    if (error) throw error;
    showToast(`Service ${newValue ? 'shown' : 'hidden'} on site.`, 'success');
    loadServices();
  } catch (err) {
    console.error('Toggle service visibility error:', err);
    showToast('Failed to update visibility.', 'error');
  }
}

async function openServiceModal(serviceId) {
  let service = null;
  if (serviceId) {
    try {
      const { data, error } = await _supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single();
      if (error) throw error;
      service = data;
      editingService = service;
    } catch (err) {
      console.error('Failed to fetch service:', err);
      showToast('Failed to load service data.', 'error');
      return;
    }
  } else {
    editingService = null;
  }

  const isEdit = !!service;
  const features = Array.isArray(service?.features) ? service.features.join(', ') : (service?.features || '');

  const html = `
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-white">${isEdit ? 'Edit Service' : 'Add Service'}</h2>
      <button class="text-slate-400 hover:text-white transition-colors text-xl" onclick="closeModal()"><i class="fas fa-times"></i></button>
    </div>

    <form id="service-form" onsubmit="saveService(event)">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="form-label">Title *</label>
          <input type="text" id="svc-title" class="form-input" value="${escapeHtml(service?.title || '')}" required placeholder="e.g., Web Development">
        </div>
        <div>
          <label class="form-label">Icon <span class="text-slate-500">(Font Awesome class)</span></label>
          <div class="flex gap-2">
            <input type="text" id="svc-icon" class="form-input flex-1" value="${escapeHtml(service?.icon || 'fas fa-code')}" placeholder="fas fa-code" oninput="updateIconPreview()">
            <div class="icon-preview" id="svc-icon-preview">
              <i class="${escapeHtml(service?.icon || 'fas fa-code')}"></i>
            </div>
          </div>
        </div>
      </div>

      <div class="mb-4">
        <label class="form-label">Description</label>
        <textarea id="svc-description" class="form-input" rows="4" placeholder="What this service includes...">${escapeHtml(service?.description || '')}</textarea>
      </div>

      <div class="mb-4">
        <label class="form-label">Features <span class="text-slate-500">(comma-separated)</span></label>
        <input type="text" id="svc-features" class="form-input" value="${escapeHtml(features)}" placeholder="Responsive Design, SEO Optimization, Fast Loading">
        <div id="svc-features-tags" class="flex flex-wrap gap-2 mt-2"></div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label class="form-label">Display Order</label>
          <input type="number" id="svc-order" class="form-input" value="${service?.display_order || 0}" min="0">
        </div>
        <div class="flex items-center gap-3 pt-6">
          <input type="checkbox" id="svc-visible" class="w-5 h-5 rounded accent-primary-500 cursor-pointer" ${service?.is_visible !== false ? 'checked' : ''}>
          <label for="svc-visible" class="form-label mb-0 cursor-pointer">Visible on website</label>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <div>
          ${isEdit ? `<button type="button" class="btn-sm btn-delete" onclick="deleteService('${service.id}')"><i class="fas fa-trash"></i> Delete</button>` : ''}
        </div>
        <div class="flex gap-3">
          <button type="button" class="btn-secondary text-sm py-2" onclick="closeModal()">Cancel</button>
          <button type="submit" id="svc-save-btn" class="btn-primary text-sm py-2"><i class="fas fa-save"></i> ${isEdit ? 'Update' : 'Create'} Service</button>
        </div>
      </div>
    </form>
  `;

  openModal(html);
  updateServiceFeatureTags();

  const featInput = document.getElementById('svc-features');
  if (featInput) {
    featInput.addEventListener('input', updateServiceFeatureTags);
  }
}

function updateIconPreview() {
  const input = document.getElementById('svc-icon');
  const preview = document.getElementById('svc-icon-preview');
  if (input && preview) {
    preview.innerHTML = `<i class="${escapeHtml(input.value || 'fas fa-code')}"></i>`;
  }
}

function updateServiceFeatureTags() {
  const input = document.getElementById('svc-features');
  const container = document.getElementById('svc-features-tags');
  if (!input || !container) return;
  const tags = input.value.split(',').map(t => t.trim()).filter(Boolean);
  container.innerHTML = tags.map(tag => `<span class="tag-pill">${escapeHtml(tag)}</span>`).join('');
}

async function saveService(e) {
  e.preventDefault();
  const btn = document.getElementById('svc-save-btn');
  const originalHTML = btn.innerHTML;
  setButtonLoading(btn, true);

  try {
    const featuresRaw = document.getElementById('svc-features').value;
    const features = featuresRaw.split(',').map(t => t.trim()).filter(Boolean);

    const serviceData = {
      title: document.getElementById('svc-title').value.trim(),
      description: document.getElementById('svc-description').value.trim(),
      icon: document.getElementById('svc-icon').value.trim(),
      features: features,
      display_order: parseInt(document.getElementById('svc-order').value) || 0,
      is_visible: document.getElementById('svc-visible').checked
    };

    if (editingService) {
      const { error } = await _supabase
        .from('services')
        .update(serviceData)
        .eq('id', editingService.id);
      if (error) throw error;
      showToast('Service updated successfully!', 'success');
    } else {
      const { error } = await _supabase
        .from('services')
        .insert([serviceData]);
      if (error) throw error;
      showToast('Service created successfully!', 'success');
    }

    closeModal();
    loadServices();
    loadDashboardStats();
  } catch (err) {
    console.error('Save service error:', err);
    showToast('Failed to save service: ' + (err.message || 'Unknown error'), 'error');
    setButtonLoading(btn, false, originalHTML);
  }
}

async function deleteService(id) {
  if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) return;

  try {
    const { error } = await _supabase
      .from('services')
      .delete()
      .eq('id', id);
    if (error) throw error;

    showToast('Service deleted.', 'success');
    closeModal();
    loadServices();
    loadDashboardStats();
  } catch (err) {
    console.error('Delete service error:', err);
    showToast('Failed to delete service.', 'error');
  }
}

// ============================================
// INQUIRIES MANAGEMENT
// ============================================

async function loadInquiries(statusFilter) {
  const tbody = document.getElementById('inquiries-table-body');
  const filter = statusFilter || document.getElementById('inquiry-status-filter')?.value || 'all';

  try {
    let query = _supabase
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter && filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (!data || data.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="7">
          <div class="empty-state">
            <i class="fas fa-inbox block"></i>
            <p>${filter !== 'all' ? `No ${filter} inquiries found.` : 'No inquiries yet. They\'ll appear here when clients reach out.'}</p>
          </div>
        </td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(inq => `
      <tr>
        <td class="font-medium text-white">${escapeHtml(inq.name)}</td>
        <td>
          <a href="mailto:${escapeHtml(inq.email)}" class="text-primary-400 hover:text-primary-300">${escapeHtml(inq.email)}</a>
        </td>
        <td>${escapeHtml(inq.service_type || '—')}</td>
        <td>${escapeHtml(inq.budget_range || inq.budget || '—')}</td>
        <td>${statusBadge(inq.status || 'new')}</td>
        <td>${formatDate(inq.created_at)}</td>
        <td>
          <div class="flex items-center gap-2">
            <button class="btn-sm btn-view" onclick="openInquiryModal('${inq.id}')"><i class="fas fa-eye"></i> View</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load inquiries:', err);
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-red-400 py-4">Failed to load inquiries.</td></tr>`;
  }
}

async function openInquiryModal(inquiryId) {
  let inquiry = null;
  try {
    const { data, error } = await _supabase
      .from('inquiries')
      .select('*')
      .eq('id', inquiryId)
      .single();
    if (error) throw error;
    inquiry = data;
    viewingInquiry = inquiry;
  } catch (err) {
    console.error('Failed to fetch inquiry:', err);
    showToast('Failed to load inquiry details.', 'error');
    return;
  }

  const html = `
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-white">Inquiry Details</h2>
      <button class="text-slate-400 hover:text-white transition-colors text-xl" onclick="closeModal()"><i class="fas fa-times"></i></button>
    </div>

    <!-- Inquiry Details (Read-only) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div>
        <label class="form-label text-slate-500">Full Name</label>
        <p class="text-white font-medium">${escapeHtml(inquiry.full_name || inquiry.name || '—')}</p>
      </div>
      <div>
        <label class="form-label text-slate-500">Email</label>
        <p><a href="mailto:${escapeHtml(inquiry.email)}" class="text-primary-400 hover:text-primary-300">${escapeHtml(inquiry.email || '—')}</a></p>
      </div>
      <div>
        <label class="form-label text-slate-500">Phone</label>
        <p class="text-slate-300">${escapeHtml(inquiry.phone || '—')}</p>
      </div>
      <div>
        <label class="form-label text-slate-500">Company</label>
        <p class="text-slate-300">${escapeHtml(inquiry.company || '—')}</p>
      </div>
      <div>
        <label class="form-label text-slate-500">Service Type</label>
        <p class="text-slate-300">${escapeHtml(inquiry.service_type || '—')}</p>
      </div>
      <div>
        <label class="form-label text-slate-500">Budget</label>
        <p class="text-slate-300">${escapeHtml(inquiry.budget_range || inquiry.budget || '—')}</p>
      </div>
    </div>

    <div class="mb-6">
      <label class="form-label text-slate-500">Message</label>
      <div class="p-4 bg-slate-800/50 rounded-lg text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">${escapeHtml(inquiry.message || 'No message provided.')}</div>
    </div>

    <div class="mb-4">
      <label class="form-label text-slate-500">Submitted</label>
      <p class="text-slate-300 text-sm">${formatDateTime(inquiry.created_at)}</p>
    </div>

    <hr class="border-slate-700 my-6">

    <!-- Status Update -->
    <form id="inquiry-form" onsubmit="updateInquiryStatus(event)">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="form-label">Status</label>
          <select id="inq-status" class="form-input">
            <option value="new" ${inquiry.status === 'new' ? 'selected' : ''}>New</option>
            <option value="contacted" ${inquiry.status === 'contacted' ? 'selected' : ''}>Contacted</option>
            <option value="closed" ${inquiry.status === 'closed' ? 'selected' : ''}>Closed</option>
          </select>
        </div>
      </div>

      <div class="mb-6">
        <label class="form-label">Admin Notes</label>
        <textarea id="inq-admin-notes" class="form-input" rows="3" placeholder="Internal notes about this inquiry...">${escapeHtml(inquiry.admin_notes || '')}</textarea>
      </div>

      <div class="flex justify-end gap-3">
        <button type="button" class="btn-secondary text-sm py-2" onclick="closeModal()">Close</button>
        <button type="submit" id="inq-save-btn" class="btn-primary text-sm py-2"><i class="fas fa-save"></i> Update Inquiry</button>
      </div>
    </form>
  `;

  openModal(html);
}

async function updateInquiryStatus(e) {
  e.preventDefault();
  if (!viewingInquiry) return;

  const btn = document.getElementById('inq-save-btn');
  const originalHTML = btn.innerHTML;
  setButtonLoading(btn, true);

  try {
    const status = document.getElementById('inq-status').value;
    const adminNotes = document.getElementById('inq-admin-notes').value.trim();

    const { error } = await _supabase
      .from('inquiries')
      .update({ status, admin_notes: adminNotes })
      .eq('id', viewingInquiry.id);

    if (error) throw error;

    showToast('Inquiry updated successfully!', 'success');
    closeModal();
    loadInquiries();
    loadRecentInquiries();
    loadDashboardStats();
  } catch (err) {
    console.error('Update inquiry error:', err);
    showToast('Failed to update inquiry: ' + (err.message || 'Unknown error'), 'error');
    setButtonLoading(btn, false, originalHTML);
  }
}

// ============================================
// SITE SETTINGS
// ============================================

async function loadSiteSettings() {
  try {
    const settings = await fetchAllSiteSettings();
    siteSettingsCache = settings;

    // Brand settings
    if (settings.brand) {
      const brand = settings.brand;
      setInputValue('setting-brand-name', brand.brand_name);
      setInputValue('setting-brand-tagline', brand.tagline);
      setInputValue('setting-brand-logo_alt', brand.logo_alt);
      renderBrandPreview('brand-logo-preview', brand.logo_url, 'Current logo');
      renderBrandPreview('brand-favicon-preview', brand.favicon_url, 'Current favicon');
    }

    // Hero settings
    if (settings.hero) {
      const hero = settings.hero;
      setInputValue('setting-hero-headline', hero.headline);
      setInputValue('setting-hero-subheadline', hero.subheadline);
      setInputValue('setting-hero-cta_primary', hero.cta_primary);
      setInputValue('setting-hero-cta_secondary', hero.cta_secondary);
    }

    // Contact settings
    if (settings.contact) {
      const contact = settings.contact;
      setInputValue('setting-contact-email', contact.email);
      setInputValue('setting-contact-phone', contact.phone);
      setInputValue('setting-contact-address', contact.address);
      setInputValue('setting-contact-working_hours', contact.working_hours);
    }

    // Social settings
    if (settings.social) {
      const social = settings.social;
      setInputValue('setting-social-github', social.github);
      setInputValue('setting-social-linkedin', social.linkedin);
      setInputValue('setting-social-twitter', social.twitter);
      setInputValue('setting-social-instagram', social.instagram);
    }

    // About settings
    if (settings.about) {
      const about = settings.about;
      setInputValue('setting-about-title', about.title);
      setInputValue('setting-about-description', about.description);
    }

    if (settings.stats?.items) {
      settings.stats.items.slice(0, 4).forEach((item, index) => {
        setInputValue(`setting-stats-${index + 1}-value`, item.value);
        setInputValue(`setting-stats-${index + 1}-label`, item.label);
      });
    }

    if (settings.footer) {
      setInputValue('setting-footer-description', settings.footer.description);
      setInputValue('setting-footer-copyright', settings.footer.copyright);
    }
  } catch (err) {
    console.error('Failed to load site settings:', err);
    showToast('Failed to load site settings.', 'error');
  }
}

function renderBrandPreview(id, url, label) {
  const container = document.getElementById(id);
  if (!container || !url) return;
  container.innerHTML = `<img src="${escapeHtml(url)}" alt="${escapeHtml(label)}" class="mx-auto max-h-24 rounded-lg object-contain"><p class="text-xs text-slate-400 mt-2">${escapeHtml(label)} — click to change</p>`;
}

function previewBrandImage(input, previewId) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = event => {
    const container = document.getElementById(previewId);
    if (container) container.innerHTML = `<img src="${event.target.result}" alt="Preview" class="mx-auto max-h-24 rounded-lg object-contain"><p class="text-xs text-slate-400 mt-2">New image selected</p>`;
  };
  reader.readAsDataURL(input.files[0]);
}

function setInputValue(id, value) {
  const el = document.getElementById(id);
  if (el && value !== undefined && value !== null) {
    el.value = value;
  }
}

function switchSettingsTab(tab) {
  // Update tab buttons
  document.querySelectorAll('.settings-tab').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-settings-tab') === tab);
  });

  // Show/hide panels
  document.querySelectorAll('.settings-panel').forEach(panel => {
    panel.classList.remove('active');
  });
  const target = document.getElementById('settings-' + tab);
  if (target) target.classList.add('active');
}

async function saveSettingsGroup(group) {
  // Find the save button within the settings panel
  const panel = document.getElementById('settings-' + group);
  const btn = panel?.querySelector('.btn-primary');
  let originalHTML = '';
  if (btn) {
    originalHTML = btn.innerHTML;
    setButtonLoading(btn, true);
  }

  try {
    let value = {};

    switch (group) {
      case 'hero':
        value = {
          headline: document.getElementById('setting-hero-headline').value.trim(),
          subheadline: document.getElementById('setting-hero-subheadline').value.trim(),
          cta_primary: document.getElementById('setting-hero-cta_primary').value.trim(),
          cta_secondary: document.getElementById('setting-hero-cta_secondary').value.trim()
        };
        break;
      case 'contact':
        value = {
          email: document.getElementById('setting-contact-email').value.trim(),
          phone: document.getElementById('setting-contact-phone').value.trim(),
          address: document.getElementById('setting-contact-address').value.trim(),
          working_hours: document.getElementById('setting-contact-working_hours').value.trim()
        };
        break;
      case 'social':
        value = {
          github: document.getElementById('setting-social-github').value.trim(),
          linkedin: document.getElementById('setting-social-linkedin').value.trim(),
          twitter: document.getElementById('setting-social-twitter').value.trim(),
          instagram: document.getElementById('setting-social-instagram').value.trim()
        };
        break;
      case 'about':
        value = {
          title: document.getElementById('setting-about-title').value.trim(),
          description: document.getElementById('setting-about-description').value.trim()
        };
        break;
      case 'brand': {
        const previous = siteSettingsCache.brand || {};
        let logoUrl = previous.logo_url || '';
        let logoPath = previous.logo_path || '';
        let faviconUrl = previous.favicon_url || '';
        let faviconPath = previous.favicon_path || '';
        const logoInput = document.getElementById('brand-logo-input');
        const faviconInput = document.getElementById('brand-favicon-input');

        if (logoInput.files && logoInput.files[0]) {
          const file = logoInput.files[0];
          logoPath = `brand/logo_${generateUUID()}.${getFileExtension(file.name)}`;
          logoUrl = await uploadFile('site-media', logoPath, file);
        }
        if (faviconInput.files && faviconInput.files[0]) {
          const file = faviconInput.files[0];
          faviconPath = `brand/favicon_${generateUUID()}.${getFileExtension(file.name)}`;
          faviconUrl = await uploadFile('site-media', faviconPath, file);
        }

        value = {
          brand_name: document.getElementById('setting-brand-name').value.trim(),
          tagline: document.getElementById('setting-brand-tagline').value.trim(),
          logo_alt: document.getElementById('setting-brand-logo_alt').value.trim(),
          logo_url: logoUrl,
          logo_path: logoPath,
          favicon_url: faviconUrl,
          favicon_path: faviconPath
        };
        break;
      }
      case 'stats':
        value = { items: [1, 2, 3, 4].map(index => ({
          value: document.getElementById(`setting-stats-${index}-value`).value.trim(),
          label: document.getElementById(`setting-stats-${index}-label`).value.trim()
        })).filter(item => item.value || item.label) };
        break;
      case 'footer':
        value = {
          description: document.getElementById('setting-footer-description').value.trim(),
          copyright: document.getElementById('setting-footer-copyright').value.trim()
        };
        break;
      default:
        throw new Error('Unknown settings group: ' + group);
    }

    // Upsert into site_settings
    const { error } = await _supabase
      .from('site_settings')
      .upsert({ key: group, value: value }, { onConflict: 'key' });

    if (error) throw error;

    siteSettingsCache[group] = value;

    showToast(`${group.charAt(0).toUpperCase() + group.slice(1)} settings saved successfully!`, 'success');
  } catch (err) {
    console.error('Save settings error:', err);
    showToast('Failed to save settings: ' + (err.message || 'Unknown error'), 'error');
  } finally {
    if (btn) setButtonLoading(btn, false, originalHTML);
  }
}

// ============================================
// DRAG & DROP FILE UPLOAD
// ============================================

function initFileUploadDragDrop(areaId, inputId) {
  const area = document.getElementById(areaId);
  const input = document.getElementById(inputId);
  if (!area || !input) return;

  ['dragenter', 'dragover'].forEach(evt => {
    area.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      area.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(evt => {
    area.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      area.classList.remove('dragover');
    });
  });

  area.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      // Create a new DataTransfer to set files on input
      const dt = new DataTransfer();
      if (input.multiple) {
        // Append all dropped files
        Array.from(files).forEach(f => dt.items.add(f));
      } else {
        dt.items.add(files[0]);
      }
      input.files = dt.files;
      // Trigger change event
      input.dispatchEvent(new Event('change'));
    }
  });
}


// ============================================
// ACCOUNT & PASSWORD MANAGEMENT
// ============================================

function loadAccountInfo() {
  const user = window._supabase.auth.user && window._supabase.auth.user() ? window._supabase.auth.user() : null;
  // Try to get user from session
  window._supabase.auth.getSession().then(function(result) {
    var session = result && result.data && result.data.session;
    if (session && session.user) {
      var email = session.user.email || 'admin@example.com';
      var initial = email.charAt(0).toUpperCase();
      var accountAvatar = document.getElementById('account-avatar');
      var accountEmail = document.getElementById('account-email-display');
      if (accountAvatar) accountAvatar.textContent = initial;
      if (accountEmail) accountEmail.textContent = email;
    }
  });
}

function togglePasswordVisibility(inputId, btn) {
  var input = document.getElementById(inputId);
  if (!input) return;
  var icon = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
}

async function handleChangePassword() {
  var currentPw = document.getElementById('current-password').value;
  var newPw = document.getElementById('new-password').value;
  var confirmPw = document.getElementById('confirm-password').value;
  var successDiv = document.getElementById('password-change-success');
  var errorDiv = document.getElementById('password-change-error');
  var errorText = document.getElementById('password-error-text');
  var btn = document.getElementById('change-password-btn');

  successDiv.classList.add('hidden');
  errorDiv.classList.add('hidden');

  // Validation
  if (!currentPw) {
    errorDiv.classList.remove('hidden');
    errorText.textContent = 'Please enter your current password.';
    return;
  }
  if (!newPw || newPw.length < 8) {
    errorDiv.classList.remove('hidden');
    errorText.textContent = 'New password must be at least 8 characters.';
    return;
  }
  if (newPw !== confirmPw) {
    errorDiv.classList.remove('hidden');
    errorText.textContent = 'New passwords do not match.';
    return;
  }
  if (currentPw === newPw) {
    errorDiv.classList.remove('hidden');
    errorText.textContent = 'New password must be different from current password.';
    return;
  }

  var originalHTML = btn.innerHTML;
  setButtonLoading(btn, true);

  try {
    // Verify current password by re-authenticating
    var sessionResult = await window._supabase.auth.getSession();
    var email = sessionResult.data.session.user.email;

    var signInResult = await window._supabase.auth.signInWithPassword({
      email: email,
      password: currentPw
    });
    if (signInResult.error) {
      throw new Error('Current password is incorrect.');
    }

    // Update password
    var updateResult = await window._supabase.auth.updateUser({ password: newPw });
    if (updateResult.error) {
      throw updateResult.error;
    }

    successDiv.classList.remove('hidden');
    showToast('Password changed successfully!', 'success');
    // Clear fields
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
  } catch (err) {
    console.error('Password change error:', err);
    errorDiv.classList.remove('hidden');
    errorText.textContent = err.message || 'Failed to change password. Please try again.';
  } finally {
    setButtonLoading(btn, false, originalHTML);
  }
}

async function handleAccountChangePassword() {
  var currentPw = document.getElementById('account-current-password').value;
  var newPw = document.getElementById('account-new-password').value;
  var confirmPw = document.getElementById('account-confirm-password').value;
  var successDiv = document.getElementById('account-password-success');
  var errorDiv = document.getElementById('account-password-error');
  var errorText = document.getElementById('account-password-error-text');
  var btn = document.getElementById('account-change-password-btn');

  successDiv.classList.add('hidden');
  errorDiv.classList.add('hidden');

  if (!currentPw) {
    errorDiv.classList.remove('hidden');
    errorText.textContent = 'Please enter your current password.';
    return;
  }
  if (!newPw || newPw.length < 8) {
    errorDiv.classList.remove('hidden');
    errorText.textContent = 'New password must be at least 8 characters.';
    return;
  }
  if (newPw !== confirmPw) {
    errorDiv.classList.remove('hidden');
    errorText.textContent = 'New passwords do not match.';
    return;
  }
  if (currentPw === newPw) {
    errorDiv.classList.remove('hidden');
    errorText.textContent = 'New password must be different from current password.';
    return;
  }

  var originalHTML = btn.innerHTML;
  setButtonLoading(btn, true);

  try {
    var sessionResult = await window._supabase.auth.getSession();
    var email = sessionResult.data.session.user.email;

    var signInResult = await window._supabase.auth.signInWithPassword({
      email: email,
      password: currentPw
    });
    if (signInResult.error) {
      throw new Error('Current password is incorrect.');
    }

    var updateResult = await window._supabase.auth.updateUser({ password: newPw });
    if (updateResult.error) {
      throw updateResult.error;
    }

    successDiv.classList.remove('hidden');
    showToast('Password changed successfully!', 'success');
    document.getElementById('account-current-password').value = '';
    document.getElementById('account-new-password').value = '';
    document.getElementById('account-confirm-password').value = '';
  } catch (err) {
    console.error('Password change error:', err);
    errorDiv.classList.remove('hidden');
    errorText.textContent = err.message || 'Failed to change password. Please try again.';
  } finally {
    setButtonLoading(btn, false, originalHTML);
  }
}
