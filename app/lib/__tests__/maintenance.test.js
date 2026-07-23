import { describe, it, expect } from 'vitest';
import { getMaintenanceStatus, STATUS_LABELS, STATUS_ORDER } from '../maintenance';

function isoDaysFromNow(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

describe('getMaintenanceStatus', () => {
  it('is "inconnu" when neither a km nor a date rule is set', () => {
    const status = getMaintenanceStatus({ interval_km: null, last_done_km: null, interval_months: null, last_done_date: null }, 50000);
    expect(status.status).toBe('inconnu');
  });

  describe('km-based rule', () => {
    it('is "retard" once currentKm reaches the due km', () => {
      const item = { interval_km: 1000, last_done_km: 10000, interval_months: null, last_done_date: null };
      const status = getMaintenanceStatus(item, 11000);
      expect(status.status).toBe('retard');
      expect(status.kmLeft).toBe(0);
    });

    it('is "bientot" within the warning window (max of 1500km or 10% of interval)', () => {
      const item = { interval_km: 10000, last_done_km: 0, interval_months: null, last_done_date: null };
      const status = getMaintenanceStatus(item, 8600); // dueKm=10000, kmLeft=1400 <= 1500
      expect(status.status).toBe('bientot');
    });

    it('is "ok" well before the warning window', () => {
      const item = { interval_km: 10000, last_done_km: 0, interval_months: null, last_done_date: null };
      const status = getMaintenanceStatus(item, 5000); // kmLeft=5000
      expect(status.status).toBe('ok');
    });
  });

  describe('date-based rule', () => {
    it('is "retard" once the due date has passed', () => {
      const item = { interval_km: null, last_done_km: null, interval_months: 0, last_done_date: isoDaysFromNow(-5) };
      expect(getMaintenanceStatus(item, null).status).toBe('retard');
    });

    it('is "bientot" within 60 days of the due date', () => {
      const item = { interval_km: null, last_done_km: null, interval_months: 0, last_done_date: isoDaysFromNow(30) };
      expect(getMaintenanceStatus(item, null).status).toBe('bientot');
    });

    it('is "ok" comfortably before the due date', () => {
      const item = { interval_km: null, last_done_km: null, interval_months: 0, last_done_date: isoDaysFromNow(100) };
      expect(getMaintenanceStatus(item, null).status).toBe('ok');
    });
  });

  it('is "retard" if either rule is overdue, even when the other is fine', () => {
    const item = {
      interval_km: 10000, last_done_km: 0, // km rule: comfortably ok
      interval_months: 0, last_done_date: isoDaysFromNow(-5), // date rule: overdue
    };
    const status = getMaintenanceStatus(item, 1000);
    expect(status.status).toBe('retard');
  });

  it('STATUS_ORDER covers exactly the keys in STATUS_LABELS', () => {
    expect(Object.keys(STATUS_ORDER).sort()).toEqual(Object.keys(STATUS_LABELS).sort());
  });
});
