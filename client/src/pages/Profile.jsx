import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { changePasswordRequest } from '../services/auth.service';
import PasswordInput from '../components/PasswordInput';
import ThemeToggle from '../components/ThemeToggle';
import PageFade from '../components/motion/Reveal';
import { FIELD_CLASS, LABEL_CLASS, BUTTON_PRIMARY, BUTTON_SECONDARY } from '../utils/styles';

// Reuses the same client-side base64 upload pattern/cap already used for
// event posters (EventForm's handlePosterChange) rather than inventing a
// new upload mechanism.
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function formatMemberSince(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileError('Profile photo must be an image file.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setProfileError('Profile photo must be smaller than 5MB.');
      return;
    }

    setProfileError('');
    const reader = new FileReader();
    reader.onload = () => setProfileImage(reader.result);
    reader.readAsDataURL(file);
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileError('');
    if (!name.trim()) {
      setProfileError('Display name cannot be empty.');
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile({ name, profileImage });
      showToast('Profile updated.');
    } catch (err) {
      const message = err.response?.data?.error || 'Could not update profile';
      setProfileError(message);
      showToast(message, 'error');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordError('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    setChangingPassword(true);
    try {
      await changePasswordRequest({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      showToast('Password updated.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const message = err.response?.data?.error || 'Could not update password';
      setPasswordError(message);
      showToast(message, 'error');
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <PageFade>
        <h1 className="font-display text-3xl font-bold text-neutral-900 dark:text-neutral-100">Profile</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Manage your account details and password.</p>
      </PageFade>

      <PageFade
        delay={0.05}
        className="mt-8 rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <form onSubmit={handleProfileSubmit} className="space-y-5">
          <div className="flex flex-wrap items-center gap-4">
            {profileImage ? (
              <img src={profileImage} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-500 text-xl font-semibold text-white">
                {name?.[0]?.toUpperCase() || '?'}
              </span>
            )}
            <div className="flex flex-wrap gap-2">
              <label className={`${BUTTON_SECONDARY} cursor-pointer`}>
                Change photo
                <input type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
              </label>
              {profileImage && (
                <button type="button" onClick={() => setProfileImage(null)} className={BUTTON_SECONDARY}>
                  Remove
                </button>
              )}
            </div>
          </div>

          {profileError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
              {profileError}
            </p>
          )}

          <div>
            <label className={LABEL_CLASS}>Display name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className={FIELD_CLASS} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Email</label>
              <input
                disabled
                value={user?.email || ''}
                className={`${FIELD_CLASS} cursor-not-allowed bg-neutral-50 text-neutral-500 dark:bg-neutral-800/60 dark:text-neutral-500`}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Role</label>
              <input
                disabled
                value={user?.role || ''}
                className={`${FIELD_CLASS} cursor-not-allowed bg-neutral-50 capitalize text-neutral-500 dark:bg-neutral-800/60 dark:text-neutral-500`}
              />
            </div>
          </div>

          <p className="text-xs text-neutral-400 dark:text-neutral-500">Member since {formatMemberSince(user?.createdAt)}</p>

          <div className="flex justify-end">
            <button type="submit" disabled={savingProfile} className={BUTTON_PRIMARY}>
              {savingProfile ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </PageFade>

      <PageFade
        delay={0.1}
        className="mt-6 rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h2 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-100">Appearance</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Choose how NexEvent looks on this device.</p>
        <ThemeToggle className="mt-4" />
      </PageFade>

      <PageFade
        delay={0.15}
        className="mt-6 rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h2 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-100">Change password</h2>
        <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
          {passwordError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
              {passwordError}
            </p>
          )}
          <div>
            <label className={LABEL_CLASS}>Current password</label>
            <PasswordInput
              required
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className={FIELD_CLASS}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>New password</label>
              <PasswordInput
                required
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className={FIELD_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Confirm new password</label>
              <PasswordInput
                required
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className={FIELD_CLASS}
              />
            </div>
          </div>
          <p className="text-xs text-neutral-400 dark:text-neutral-500">At least 8 characters, with letters and numbers.</p>
          <div className="flex justify-end">
            <button type="submit" disabled={changingPassword} className={BUTTON_PRIMARY}>
              {changingPassword ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </PageFade>
    </div>
  );
}
