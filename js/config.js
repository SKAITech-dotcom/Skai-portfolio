// ============================================
// SkaiTechgh Portfolio — Supabase Configuration
// ============================================
// Replace these with your actual Supabase project credentials
// Find them at: https://app.supabase.com → Project Settings → API

const SUPABASE_URL = 'https://njxxhfkzriiaclbtqqpv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_8N8nnPHTFw5miw4TA0-5jQ_1xkNc47g';
window.PASSWORD_RESET_REDIRECT_URL = 'https://skaiteam.wasmer.app/reset-password.html';

// Initialize Supabase client before any other site script can use it.
// Store it on window to avoid cross-script lexical-scope/TDZ collisions
// when static hosting serves an older cached script alongside this one.
if (!window.supabase || typeof window.supabase.createClient !== 'function') {
  throw new Error('Supabase SDK must load before js/config.js.');
}
window._supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Super Admin email — full CMS access
const SUPER_ADMIN_EMAIL = 'skaitech360@gmail.com';

// ============================================
// Storage Helpers
// ============================================

/**
 * Get the public URL for a file in Supabase Storage
 */
function getStorageUrl(bucket, path) {
  if (!path) return null;
  // If it's already a full URL, return as-is
  if (path.startsWith('http')) return path;
  const { data } = window._supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || null;
}

/**
 * Upload a file to Supabase Storage
 */
async function uploadFile(bucket, path, file) {
  const { data, error } = await window._supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });
  if (error) throw error;
  return getStorageUrl(bucket, data.path);
}

/**
 * Delete a file from Supabase Storage
 */
async function deleteFile(bucket, paths) {
  const pathArray = Array.isArray(paths) ? paths : [paths];
  const { error } = await window._supabase.storage
    .from(bucket)
    .remove(pathArray);
  if (error) throw error;
}

// ============================================
// Auth Helpers
// ============================================

/**
 * Get the currently authenticated user
 */
async function getCurrentUser() {
  const { data: { user }, error } = await window._supabase.auth.getUser();
  if (error) return null;
  return user;
}

/**
 * Sign in with email and password
 */
async function signIn(email, password) {
  const { data, error } = await window._supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
}

async function requestPasswordReset(email) {
  const { error } = await window._supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.PASSWORD_RESET_REDIRECT_URL
  });
  if (error) throw error;
}

/**
 * Sign up a new admin user (only super admin can do this)
 */
async function signUp(email, password) {
  const { data, error } = await window._supabase.auth.signUp({
    email,
    password
  });
  if (error) throw error;
  return data;
}

/**
 * Sign out the current user
 */
async function signOut() {
  const { error } = await window._supabase.auth.signOut();
  if (error) throw error;
  window.location.href = '/admin/';
}

/**
 * Check if the given user is a super admin
 */
function isSuperAdmin(user) {
  return user?.email === SUPER_ADMIN_EMAIL;
}

// ============================================
// Data Fetching Helpers (Public)
// ============================================

async function fetchTeamMembers() {
  const { data, error } = await window._supabase
    .from('team_members')
    .select('*')
    .eq('is_visible', true)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function fetchProjects(category = null) {
  let query = window._supabase
    .from('projects')
    .select('*')
    .eq('status', 'published')
    .order('display_order', { ascending: true });

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function fetchFlagshipProjects() {
  const { data, error } = await window._supabase
    .from('projects')
    .select('*')
    .eq('is_flagship', true)
    .eq('status', 'published')
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function fetchServices() {
  const { data, error } = await window._supabase
    .from('services')
    .select('*')
    .eq('is_visible', true)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function fetchTestimonials() {
  const { data, error } = await window._supabase
    .from('testimonials')
    .select('*')
    .eq('is_visible', true)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function fetchSiteSetting(key) {
  const { data, error } = await window._supabase
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .single();
  if (error) return null;
  return data?.value || null;
}

async function fetchAllSiteSettings() {
  const { data, error } = await window._supabase
    .from('site_settings')
    .select('*');
  if (error) throw error;
  const settings = {};
  (data || []).forEach(row => { settings[row.key] = row.value; });
  return settings;
}

async function fetchMediaAssets() {
  const { data, error } = await window._supabase
    .from('media_assets')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/**
 * Submit a contact/project inquiry
 */
async function submitInquiry(inquiryData) {
  const { data, error } = await window._supabase
    .from('inquiries')
    .insert([inquiryData])
    .select();
  if (error) throw error;
  return data;
}

// ============================================
// Toast Notification System
// ============================================

function showToast(message, type = 'success', duration = 4000) {
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = {
    success: '<i class="fas fa-check-circle"></i>',
    error: '<i class="fas fa-exclamation-circle"></i>',
    warning: '<i class="fas fa-exclamation-triangle"></i>',
    info: '<i class="fas fa-info-circle"></i>'
  };

  toast.innerHTML = `
    <div class="toast-content">
      ${icons[type] || icons.info}
      <span>${message}</span>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-show'));

  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  document.body.appendChild(container);
  return container;
}
