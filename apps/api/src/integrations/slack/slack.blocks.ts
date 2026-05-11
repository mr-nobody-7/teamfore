import type { Block, KnownBlock } from "@slack/web-api";
import type { SlackApprovalPayload } from "./slack.types.js";

export function buildLeaveAppliedBlocks(
  payload: SlackApprovalPayload,
): (KnownBlock | Block)[] {
  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "Leave request submitted",
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Employee*\n${payload.requesterName}` },
        { type: "mrkdwn", text: `*Type*\n${payload.leaveType}` },
        { type: "mrkdwn", text: `*Start*\n${payload.startDate}` },
        { type: "mrkdwn", text: `*End*\n${payload.endDate}` },
      ],
    },
    ...(payload.reason
      ? [
          {
            type: "section" as const,
            text: {
              type: "mrkdwn" as const,
              text: `*Reason*\n${payload.reason}`,
            },
          },
        ]
      : []),
    ...(payload.leaveId
      ? [
          {
            type: "actions" as const,
            elements: [
              {
                type: "button" as const,
                text: {
                  type: "plain_text" as const,
                  text: "Approve",
                },
                style: "primary" as const,
                action_id: "leave_approve",
                value: payload.leaveId,
              },
              {
                type: "button" as const,
                text: {
                  type: "plain_text" as const,
                  text: "Reject",
                },
                style: "danger" as const,
                action_id: "leave_reject",
                value: payload.leaveId,
              },
            ],
          },
        ]
      : []),
  ];
}
