/**
 * Abstraction transporteur — étiquette + tracking.
 * @see docs (plan carrier-labels)
 */

class CarrierAdapter {
  constructor(name = "stub") {
    this.name = name;
  }

  async createShipment({ parcelId, weightKg, toAddress }) {
    return {
      ok: true,
      carrier: this.name,
      trackingNumber: `TRK-${parcelId}-${Date.now()}`,
      labelUrl: null,
      qrPayload: `parcel:${parcelId}:${Date.now()}`,
    };
  }
}

module.exports = { CarrierAdapter };
