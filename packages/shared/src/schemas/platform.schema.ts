import { z } from 'zod';

export const approvalDecisionSchema = z.object({
  decisionNote: z.string().trim().min(3).max(1000).optional(),
}).default({});

export type ApprovalDecisionSchema = z.infer<typeof approvalDecisionSchema>;
