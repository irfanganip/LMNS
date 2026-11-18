import type { ReactNode } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useSession } from './auth/SessionProvider';
import { Banner } from './components/Banner';
import { SkeletonLines } from './components/Skeleton';
import { copy } from './copy/id';
import { roleLabel } from './demo/accounts';
import { AppShell } from './layout/AppShell';
import { AdminApplicationDetailScreen } from './screens/admin/AdminApplicationDetailScreen';
import { AdminBadgesScreen } from './screens/admin/AdminBadgesScreen';
import { AdminQueueScreen } from './screens/admin/AdminQueueScreen';
import { BookingRequestScreen } from './screens/mentee/BookingRequestScreen';
import { CheckoutScreen } from './screens/mentee/CheckoutScreen';
import { MyBookingsScreen } from './screens/mentee/MyBookingsScreen';
import { OnboardingProfileScreen } from './screens/mentee/OnboardingProfileScreen';
import { PaymentStatusScreen } from './screens/mentee/PaymentStatusScreen';
import { PulseScreen } from './screens/mentee/PulseScreen';
import { ReviewScreen } from './screens/mentee/ReviewScreen';
import { MentorApplicationWizard } from './screens/mentor/MentorApplicationWizard';
import { MentorDashboardScreen } from './screens/mentor/MentorDashboardScreen';
import { MentorIncomingScreen } from './screens/mentor/MentorIncomingScreen';
import { MentorPremiumScreen } from './screens/mentor/MentorPremiumScreen';
import { MentorStudioScreen } from './screens/mentor/MentorStudioScreen';
import { DiscoveryScreen } from './screens/public/DiscoveryScreen';
import { MentorProfileScreen } from './screens/public/MentorProfileScreen';
import { RegisterScreen } from './screens/public/RegisterScreen';
import { SignInScreen } from './screens/public/SignInScreen';
import { VerifyScreen } from './screens/public/VerifyScreen';
import { MediationRoomScreen } from './screens/shared/MediationRoomScreen';
import { NotFoundScreen } from './screens/shared/NotFoundScreen';

type Role = 'MENTEE' | 'MENTOR' | 'ADMIN';

const landing: Record<Role, string> = {
  MENTEE: '/booking',
  MENTOR: '/mentor/dashboard',
  ADMIN: '/admin/verifikasi',
};

/** Waits for the session to settle, then decides. Demo personas switch roles freely. */
function Guard({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { session } = useSession();
  const location = useLocation();

  if (session.phase === 'idle' || session.phase === 'loading') {
    return (
      <div className="card" aria-busy="true">
        <SkeletonLines lines={3} />
      </div>
    );
  }

  if (session.phase === 'anonymous') {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/masuk?next=${encodeURIComponent(next)}`} replace />;
  }

  if (!roles.includes(session.me.user.role)) {
    return (
      <Banner
        variant="warning"
        title={copy.notFoundRole}
        action={
          <Link className="btn btn--secondary btn--sm" to={landing[session.me.user.role]}>
            Ke halaman peran saya
          </Link>
        }
      >
        Anda masuk sebagai {roleLabel(session.me.user.role)}. Ganti persona lewat tombol di kanan
        atas untuk membuka halaman ini.
      </Banner>
    );
  }

  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DiscoveryScreen />} />
        <Route path="/mentor/:slug" element={<MentorProfileScreen />} />
        <Route path="/daftar" element={<RegisterScreen />} />
        <Route path="/verifikasi" element={<VerifyScreen />} />
        <Route path="/masuk" element={<SignInScreen />} />

        <Route
          path="/onboarding/profil"
          element={
            <Guard roles={['MENTEE']}>
              <OnboardingProfileScreen />
            </Guard>
          }
        />
        <Route
          path="/onboarding/pulse"
          element={
            <Guard roles={['MENTEE']}>
              <PulseScreen />
            </Guard>
          }
        />
        <Route
          path="/booking"
          element={
            <Guard roles={['MENTEE']}>
              <MyBookingsScreen />
            </Guard>
          }
        />
        <Route
          path="/booking/baru/:slug"
          element={
            <Guard roles={['MENTEE']}>
              <BookingRequestScreen />
            </Guard>
          }
        />
        <Route
          path="/booking/:id/pembayaran"
          element={
            <Guard roles={['MENTEE']}>
              <CheckoutScreen />
            </Guard>
          }
        />
        <Route
          path="/booking/:id/pembayaran/status"
          element={
            <Guard roles={['MENTEE']}>
              <PaymentStatusScreen />
            </Guard>
          }
        />
        <Route
          path="/booking/:id/ulasan"
          element={
            <Guard roles={['MENTEE']}>
              <ReviewScreen />
            </Guard>
          }
        />
        <Route
          path="/booking/:id/mediasi"
          element={
            <Guard roles={['MENTEE', 'MENTOR']}>
              <MediationRoomScreen />
            </Guard>
          }
        />

        <Route
          path="/mentor/dashboard"
          element={
            <Guard roles={['MENTOR']}>
              <MentorDashboardScreen />
            </Guard>
          }
        />
        <Route
          path="/mentor/pengajuan/:step"
          element={
            <Guard roles={['MENTOR']}>
              <MentorApplicationWizard />
            </Guard>
          }
        />
        <Route
          path="/mentor/studio"
          element={
            <Guard roles={['MENTOR']}>
              <MentorStudioScreen />
            </Guard>
          }
        />
        <Route
          path="/mentor/premium"
          element={
            <Guard roles={['MENTOR']}>
              <MentorPremiumScreen />
            </Guard>
          }
        />
        <Route
          path="/mentor/permintaan"
          element={
            <Guard roles={['MENTOR']}>
              <MentorIncomingScreen />
            </Guard>
          }
        />

        <Route
          path="/admin/verifikasi"
          element={
            <Guard roles={['ADMIN']}>
              <AdminQueueScreen />
            </Guard>
          }
        />
        <Route
          path="/admin/verifikasi/:id"
          element={
            <Guard roles={['ADMIN']}>
              <AdminApplicationDetailScreen />
            </Guard>
          }
        />
        <Route
          path="/admin/badge"
          element={
            <Guard roles={['ADMIN']}>
              <AdminBadgesScreen />
            </Guard>
          }
        />

        <Route path="*" element={<NotFoundScreen />} />
      </Routes>
    </AppShell>
  );
}
