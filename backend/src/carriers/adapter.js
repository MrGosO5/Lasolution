/**
 * Abstraction transporteur — étiquette + tracking.
 * @see docs (plan carrier-labels)
 */

const { formatAirtableTrackingNumber } = require("../lib/airtableTracking");

class CarrierAdapter {
  constructor(name = "stub") {
    this.name = name;
  }

  async createShipment({ parcelId, trackingNumber, weightKg, toAddress }) {
    const tracking = trackingNumber || formatAirtableTrackingNumber(parcelId);
    const qrPayload = process.env.LINKTREE_URL || "https://linktr.ee/LaSolution";
    return {
      ok: true,
      carrier: this.name,
      trackingNumber: tracking,
      labelUrl: null,
      qrPayload,
    };
  }
}

module.exports = { CarrierAdapter };
