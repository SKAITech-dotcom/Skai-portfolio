document.addEventListener('DOMContentLoaded', initializePasswordReset);

async function initializePasswordReset() {
  const message = document.getElementById('reset-message');
  const form = document.getElementById('reset-form');

  try {
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      const { error } = await window._supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    }

    let session = (await window._supabase.auth.getSession()).data.session;
    if (!session) session = await waitForRecoverySession();

    if (!session) {
      showResetMessage(message, 'This reset link is invalid or expired. Request a new one from the admin login.', 'error');
      return;
    }

    form.classList.remove('hidden');
  } catch (error) {
    console.error('Password reset initialization error:', error);
    showResetMessage(message, 'This reset link is invalid or expired. Request a new one from the admin login.', 'error');
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const password = document.getElementById('new-password').value;
    const confirmation = document.getElementById('confirm-password').value;
    const button = document.getElementById('reset-submit');

    if (password.length < 8) {
      showResetMessage(message, 'Password must be at least 8 characters.', 'error');
      return;
    }
    if (password !== confirmation) {
      showResetMessage(message, 'Passwords do not match.', 'error');
      return;
    }

    button.disabled = true;
    try {
      const { error } = await window._supabase.auth.updateUser({ password });
      if (error) throw error;
      showResetMessage(message, 'Password updated. You can now sign in.', 'success');
      form.reset();
    } catch (error) {
      console.error('Password reset update error:', error);
      showResetMessage(message, error.message || 'Could not update the password.', 'error');
    } finally {
      button.disabled = false;
    }
  });
}

function waitForRecoverySession() {
  return new Promise((resolve) => {
    let finished = false;
    let subscription;
    const finish = (session) => {
      if (finished) return;
      finished = true;
      if (subscription) subscription.unsubscribe();
      resolve(session || null);
    };
    const authState = window._supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) finish(session);
    });
    subscription = authState.data.subscription;
    setTimeout(() => finish(null), 5000);
  });
}

function showResetMessage(element, text, type) {
  element.textContent = text;
  element.className = `mb-4 p-3 rounded-lg text-sm ${type === 'success' ? 'bg-green-500/20 border border-green-500/30 text-green-400' : 'bg-red-500/20 border border-red-500/30 text-red-400'}`;
}
