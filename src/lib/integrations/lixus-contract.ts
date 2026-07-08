import { z } from "zod";
import type { GuestMessageContext } from "@/lib/ai/types";

export const lixusInboundMessageSchema = z.object({
  tenantId: z.string(),
  messageId: z.string(),
  conversationId: z.string().optional(),
  body: z.string().min(1),
  channel: z.string().default("MANUAL"),
  guest: z
    .object({
      id: z.string().optional(),
      name: z.string().optional(),
      language: z.string().optional()
    })
    .optional(),
  property: z
    .object({
      id: z.string().optional(),
      name: z.string().optional(),
      city: z.string().optional(),
      houseRules: z.string().optional(),
      checkInGuide: z.string().optional(),
      wifiName: z.string().optional()
    })
    .optional(),
  reservation: z
    .object({
      id: z.string().optional(),
      checkIn: z.string().optional(),
      checkOut: z.string().optional(),
      status: z.string().optional()
    })
    .optional(),
  recentMessages: z
    .array(
      z.object({
        author: z.string(),
        body: z.string()
      })
    )
    .default([])
});

export const lixusAgentWritePolicySchema = z.object({
  canCreateSuggestedTasks: z.boolean().default(true),
  canCreateApprovalItems: z.boolean().default(true),
  canCreateReportSignals: z.boolean().default(true),
  canSendGuestMessages: z.literal(false).default(false)
});

export type LixusInboundMessage = z.infer<typeof lixusInboundMessageSchema>;
export type LixusAgentWritePolicy = z.infer<typeof lixusAgentWritePolicySchema>;

export const defaultLixusAgentWritePolicy: LixusAgentWritePolicy = {
  canCreateSuggestedTasks: true,
  canCreateApprovalItems: true,
  canCreateReportSignals: true,
  canSendGuestMessages: false
};

export function toGuestMessageContext(input: LixusInboundMessage): GuestMessageContext {
  const message = lixusInboundMessageSchema.parse(input);

  return {
    tenantId: message.tenantId,
    conversationId: message.conversationId,
    sourceMessageId: message.messageId,
    message: message.body,
    channel: message.channel,
    guest: message.guest ? { name: message.guest.name, language: message.guest.language } : undefined,
    property: message.property,
    reservation: message.reservation,
    recentMessages: message.recentMessages
  };
}

export function assertGuestSendDisabled(policy: LixusAgentWritePolicy = defaultLixusAgentWritePolicy) {
  const parsed = lixusAgentWritePolicySchema.parse(policy);

  if (parsed.canSendGuestMessages !== false) {
    throw new Error("Guest-facing send must stay disabled until the real inbox connector is explicitly reviewed.");
  }

  return parsed;
}
