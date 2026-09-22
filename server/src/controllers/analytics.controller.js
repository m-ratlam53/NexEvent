import * as analyticsService from '../services/analytics.service.js';

export async function eventAnalytics(req, res, next) {
  try {
    const analytics = await analyticsService.getEventAnalytics(req.params.id, req.user.id);
    res.json({ analytics });
  } catch (err) {
    next(err);
  }
}

export async function dashboard(req, res, next) {
  try {
    const analytics = await analyticsService.getOrganizerDashboardAnalytics(req.user.id);
    res.json({ analytics });
  } catch (err) {
    next(err);
  }
}
