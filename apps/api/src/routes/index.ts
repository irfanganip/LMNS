import { Router } from 'express';
import type { Request } from 'express';
import type { Db } from '../db/index.js';
import { authenticate, requireAuth, requireRole } from '../http/auth.js';
import { login, logout, me, register, resendOtp, verifyRegistration } from '../services/auth.js';
import {
  createPulse,
  getMenteeProfile,
  patchMenteeProfile,
  pulseLatest,
  pulses,
} from '../services/mentee.js';
import {
  createApplication,
  currentApplication,
  findOwnedApplication,
  applicationView,
  saveApplicationStorefront,
  saveSelfAssessment,
  saveApprovedStorefront,
  getApprovedStorefront,
  submitApplication,
  updateIdentity,
  withdrawApplication,
} from '../services/applications.js';
import {
  mentorDashboard,
  moduleDetail,
  modules,
  markModuleComplete,
  submitAssessment,
  submitUpgrade,
  upgradeStatus,
  uploadCertificate,
} from '../services/upgrade.js';
import { discoverMentors, facets, publicProfile, publicReviews } from '../services/discovery.js';
import {
  bookingOptions,
  cancelBooking,
  confirmPayment,
  createBooking,
  createPayment,
  getBooking,
  myBookings,
  receipt,
} from '../services/bookings.js';
import {
  alignment,
  completeBooking,
  confirmAlignment,
  postMessage,
  proposeAlignment,
  thread,
} from '../services/mediation.js';
import { myReviews, reviewState, submitReview } from '../services/reviews.js';
import {
  adminApplication,
  adminApplications,
  adminAudit,
  adminBadgeAction,
  adminDomainCheck,
  adminMentors,
  adminReasons,
  adminUpgrades,
  decideApplication,
  decideUpgrade,
  notifications,
  readNotification,
} from '../services/admin.js';

function query(req: Request): Record<string, unknown> {
  return req.query as unknown as Record<string, unknown>;
}

export function buildRouter(db: Db): Router {
  const router = Router();

  // --- Public --------------------------------------------------------------
  router.post('/auth/login', (req, res) => {
    res.json(login(db, req.body));
  });
  router.post('/auth/register', (req, res) => {
    res.status(201).json(register(db, req.body));
  });
  router.post('/auth/register/verify', (req, res) => {
    res.status(201).json(verifyRegistration(db, req.body));
  });
  router.post('/auth/otp/resend', (req, res) => {
    res.json(resendOtp(db, req.body));
  });
  router.get('/mentors', (req, res) => {
    res.json(discoverMentors(db, query(req)));
  });
  router.get('/mentors/facets', (_req, res) => {
    res.json(facets(db));
  });
  router.get('/mentors/:slug', (req, res) => {
    res.json(publicProfile(db, req.params.slug));
  });
  router.get('/mentors/:slug/reviews', (req, res) => {
    res.json(publicReviews(db, req.params.slug, query(req)));
  });

  // --- Authenticated -------------------------------------------------------
  router.use(authenticate(db));

  router.get('/auth/me', (req, res) => {
    res.json(me(db, requireAuth(req)));
  });
  router.post('/auth/logout', (req, res) => {
    const header = req.header('authorization') ?? '';
    const token = /^Bearer\s+(.+)$/i.exec(header.trim())?.[1] ?? '';
    logout(db, token);
    res.json({ ok: true });
  });

  // Mentee profile and pulses
  router.get('/me/mentee', (req, res) => {
    const user = requireRole(req, 'MENTEE');
    res.json(getMenteeProfile(db, user));
  });
  router.patch('/me/mentee', (req, res) => {
    const user = requireRole(req, 'MENTEE');
    res.json(patchMenteeProfile(db, user, req.body));
  });
  router.post('/me/pulses', (req, res) => {
    const user = requireRole(req, 'MENTEE');
    res.status(201).json(createPulse(db, user, req.body));
  });
  router.get('/me/pulses', (req, res) => {
    const user = requireRole(req, 'MENTEE');
    res.json(pulses(db, user, query(req)));
  });
  router.get('/me/pulses/latest', (req, res) => {
    const user = requireRole(req, 'MENTEE');
    res.json(pulseLatest(db, user));
  });
  router.get('/me/reviews', (req, res) => {
    res.json(myReviews(db, requireRole(req, 'MENTEE'), query(req)));
  });

  // Mentor application wizard
  router.post('/mentor/applications', (req, res) => {
    const user = requireRole(req, 'MENTOR');
    res.status(201).json(createApplication(db, user, req.body));
  });
  router.get('/mentor/applications/current', (req, res) => {
    const user = requireRole(req, 'MENTOR');
    res.json(currentApplication(db, user));
  });
  router.get('/mentor/applications/:id', (req, res) => {
    const user = requireRole(req, 'MENTOR');
    const application = findOwnedApplication(db, req.params.id, user);
    res.json(applicationView(db, application));
  });
  router.patch('/mentor/applications/:id/identity', (req, res) => {
    const user = requireRole(req, 'MENTOR');
    res.json(updateIdentity(db, req.params.id, user, req.body));
  });
  router.put('/mentor/applications/:id/self-assessment', (req, res) => {
    const user = requireRole(req, 'MENTOR');
    res.json(saveSelfAssessment(db, req.params.id, user, req.body));
  });
  router.put('/mentor/applications/:id/storefront', (req, res) => {
    const user = requireRole(req, 'MENTOR');
    res.json(saveApplicationStorefront(db, req.params.id, user, req.body));
  });
  router.post('/mentor/applications/:id/submit', (req, res) => {
    const user = requireRole(req, 'MENTOR');
    res.json(submitApplication(db, req.params.id, user));
  });
  router.post('/mentor/applications/:id/withdraw', (req, res) => {
    const user = requireRole(req, 'MENTOR');
    res.json(withdrawApplication(db, req.params.id, user));
  });
  router.get('/mentor/dashboard', (req, res) => {
    const user = requireRole(req, 'MENTOR');
    res.json(mentorDashboard(db, user));
  });
  router.get('/mentor/storefront', (req, res) => {
    const user = requireRole(req, 'MENTOR');
    res.json(getApprovedStorefront(db, user));
  });
  router.put('/mentor/storefront', (req, res) => {
    const user = requireRole(req, 'MENTOR');
    res.json(saveApprovedStorefront(db, user, req.body));
  });

  // Premium upgrade and training
  router.get('/mentor/upgrade', (req, res) => {
    const user = requireRole(req, 'MENTOR');
    res.json(upgradeStatus(db, user.id));
  });
  router.get('/training/modules', (req, res) => {
    const user = requireRole(req, 'MENTOR');
    res.json(modules(db, user.id));
  });
  router.get('/training/modules/:id', (req, res) => {
    const user = requireRole(req, 'MENTOR');
    res.json(moduleDetail(db, user.id, req.params.id));
  });
  router.post('/training/modules/:id/complete', (req, res) => {
    const user = requireRole(req, 'MENTOR');
    res.json(markModuleComplete(db, user.id, req.params.id));
  });
  router.post('/mentor/upgrade/assessment', (req, res) => {
    const user = requireRole(req, 'MENTOR');
    res.json(submitAssessment(db, user.id, req.body));
  });
  router.post('/mentor/upgrade/certificate', (req, res) => {
    const user = requireRole(req, 'MENTOR');
    res.status(201).json(uploadCertificate(db, user.id, req.body));
  });
  router.post('/mentor/upgrade/submit', (req, res) => {
    const user = requireRole(req, 'MENTOR');
    res.status(202).json(submitUpgrade(db, user.id));
  });

  // Discovery checkout helpers
  router.get('/mentors/:slug/booking-options', (req, res) => {
    requireRole(req, 'MENTEE');
    res.json(bookingOptions(db, req.params.slug));
  });

  // Bookings
  router.post('/bookings', (req, res) => {
    const user = requireRole(req, 'MENTEE');
    res.status(201).json(createBooking(db, user, req.body));
  });
  router.get('/bookings', (req, res) => {
    const user = requireRole(req, 'MENTEE', 'MENTOR');
    res.json(myBookings(db, user, query(req)));
  });
  router.get('/bookings/:id', (req, res) => {
    const user = requireAuth(req);
    res.json(getBooking(db, req.params.id, user));
  });
  router.post('/bookings/:id/payments', (req, res) => {
    const user = requireRole(req, 'MENTEE');
    res.status(201).json(createPayment(db, req.params.id, user, req.body));
  });
  router.post('/bookings/:id/payments/:paymentId/confirm', (req, res) => {
    const user = requireRole(req, 'MENTEE');
    res.json(confirmPayment(db, req.params.id, req.params.paymentId, user));
  });
  router.post('/bookings/:id/cancel', (req, res) => {
    const user = requireAuth(req);
    res.json(cancelBooking(db, req.params.id, user, req.body));
  });
  router.get('/bookings/:id/receipt', (req, res) => {
    const user = requireAuth(req);
    res.json(receipt(db, req.params.id, user));
  });

  // Mediation and alignment
  router.get('/bookings/:id/thread', (req, res) => {
    const user = requireAuth(req);
    res.json(thread(db, req.params.id, user));
  });
  router.post('/bookings/:id/messages', (req, res) => {
    const user = requireAuth(req);
    res.status(201).json(postMessage(db, req.params.id, user, req.body));
  });
  router.get('/bookings/:id/alignment', (req, res) => {
    const user = requireAuth(req);
    res.json(alignment(db, req.params.id, user));
  });
  router.put('/bookings/:id/alignment/:itemKey', (req, res) => {
    const user = requireAuth(req);
    res.json(proposeAlignment(db, req.params.id, req.params.itemKey, user, req.body));
  });
  router.post('/bookings/:id/alignment/:itemKey/confirm', (req, res) => {
    const user = requireAuth(req);
    res.json(confirmAlignment(db, req.params.id, req.params.itemKey, user));
  });
  router.post('/bookings/:id/complete', (req, res) => {
    const user = requireAuth(req);
    res.json(completeBooking(db, req.params.id, user));
  });

  // Reviews
  router.get('/bookings/:id/review', (req, res) => {
    const user = requireRole(req, 'MENTEE');
    res.json(reviewState(db, req.params.id, user));
  });
  router.post('/bookings/:id/review', (req, res) => {
    const user = requireRole(req, 'MENTEE');
    res.status(201).json(submitReview(db, req.params.id, user, req.body));
  });

  // Notifications
  router.get('/notifications', (req, res) => {
    res.json(notifications(db, requireAuth(req), query(req)));
  });
  router.post('/notifications/:id/read', (req, res) => {
    res.json(readNotification(db, req.params.id, requireAuth(req)));
  });

  // Admin console
  router.get('/admin/applications', (req, res) => {
    requireRole(req, 'ADMIN');
    res.json(adminApplications(db, query(req)));
  });
  router.get('/admin/applications/:id', (req, res) => {
    requireRole(req, 'ADMIN');
    res.json(adminApplication(db, req.params.id));
  });
  router.post('/admin/applications/:id/decision', (req, res) => {
    const user = requireRole(req, 'ADMIN');
    res.json(decideApplication(db, req.params.id, user, req.body));
  });
  router.get('/admin/reasons', (req, res) => {
    requireRole(req, 'ADMIN');
    res.json(adminReasons(db, query(req)));
  });
  router.get('/admin/upgrades', (req, res) => {
    requireRole(req, 'ADMIN');
    res.json(adminUpgrades(db, query(req)));
  });
  router.post('/admin/upgrades/:id/decision', (req, res) => {
    const user = requireRole(req, 'ADMIN');
    res.json(decideUpgrade(db, req.params.id, user, req.body));
  });
  router.get('/admin/mentors', (req, res) => {
    requireRole(req, 'ADMIN');
    res.json(adminMentors(db, query(req)));
  });
  router.post('/admin/mentors/:id/badge', (req, res) => {
    const user = requireRole(req, 'ADMIN');
    res.json(adminBadgeAction(db, req.params.id, user, req.body));
  });
  router.post('/admin/domains/check', (req, res) => {
    requireRole(req, 'ADMIN');
    res.json(adminDomainCheck(db, req.body));
  });
  router.get('/admin/audit', (req, res) => {
    requireRole(req, 'ADMIN');
    res.json(adminAudit(db, query(req)));
  });

  return router;
}
