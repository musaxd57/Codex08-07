import { describe, expect, it } from "vitest";
import { assertGuestSendDisabled, toGuestMessageContext } from "@/lib/integrations/lixus-contract";

describe("lixus integration contract", () => {
  it("maps a Lixus inbound message into the agent message context", () => {
    const context = toGuestMessageContext({
      tenantId: "tenant-1",
      messageId: "message-1",
      conversationId: "conversation-1",
      body: "Kapı şifresi çalışmıyor, dışarıda kaldık.",
      channel: "AIRBNB",
      guest: { id: "guest-1", name: "Musa", language: "tr" },
      property: {
        id: "property-1",
        name: "Galata Loft",
        city: "Istanbul",
        checkInGuide: "Kapı kodu rezervasyon günü gönderilir."
      },
      reservation: {
        id: "reservation-1",
        checkIn: "2026-07-08",
        checkOut: "2026-07-11",
        status: "confirmed"
      },
      recentMessages: [{ author: "GUEST", body: "Merhaba" }]
    });

    expect(context).toMatchObject({
      tenantId: "tenant-1",
      sourceMessageId: "message-1",
      conversationId: "conversation-1",
      message: "Kapı şifresi çalışmıyor, dışarıda kaldık.",
      channel: "AIRBNB",
      guest: { name: "Musa", language: "tr" },
      property: { id: "property-1", name: "Galata Loft" },
      reservation: { id: "reservation-1", status: "confirmed" }
    });
  });

  it("keeps guest-facing send disabled by contract", () => {
    expect(assertGuestSendDisabled().canSendGuestMessages).toBe(false);
    expect(() =>
      assertGuestSendDisabled({
        canCreateSuggestedTasks: true,
        canCreateApprovalItems: true,
        canCreateReportSignals: true,
        canSendGuestMessages: true
      } as never)
    ).toThrow();
  });
});
