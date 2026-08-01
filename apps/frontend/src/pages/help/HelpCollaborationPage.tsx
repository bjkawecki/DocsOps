import { Anchor, List, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';

export function HelpCollaborationPage() {
  return (
    <Stack gap={0} align="stretch" style={{ textAlign: 'left' }}>
      <Title order={1}>Reviews & approvals</Title>
      <Text component="p">
        Many teams are fine with <strong>real-time collaborative editing</strong> (several people in
        one live draft). DocsOps is aimed especially at organisations where that model is{' '}
        <strong>not</strong> how they want to ship documentation – whether because of regulation,
        distributed teams, or the need for a clear, agreed “official” version.
      </Text>
      <Title order={2}>Regulated and accountable work</Title>
      <Text component="p">
        In regulated settings, “whatever is in the shared buffer right now” is rarely the artifact
        you want to stand behind. You need a <strong>defined moment</strong> when a change is
        accepted: who reviewed it, what was approved, and what readers should treat as current.
        Review steps and a published line give you that boundary instead of a continuous stream of
        edits.
      </Text>
      <Title order={2}>Distributed and asynchronous teams</Title>
      <Text component="p">
        When people work across time zones or calendars, expecting everyone to be online in the same
        document at once is fragile. A workflow built around{' '}
        <strong>drafts, comments, and merge</strong> fits hand-offs: you finish a change, others
        review when they can, and the merged result becomes the shared truth – without requiring
        simultaneous presence.
      </Text>
      <Title order={2}>Why merge, not fancy live sync?</Title>
      <Text component="p">
        Keeping many cursors in sync in one surface is a deep engineering problem on its own. That
        is a secondary point: the main one is product fit. A <strong>merge-based</strong> path –
        draft → review (where needed) → integrate into a published version – matches how many
        organisations want <strong>predictable outcomes</strong>, readable history, and a single
        place for sign-off.
      </Text>
      <Title order={2}>Approvals hub</Title>
      <Text component="p">
        Open <strong>Approvals</strong> in the sidebar for decisions waiting on you. It has two
        sections:
      </Text>
      <List spacing="xs">
        <List.Item>
          <strong>Reviews</strong> – documents with pending inline suggestions you can accept or
          decline as a scope lead.
        </List.Item>
        <List.Item>
          <strong>Move requests</strong> – when someone asks to move a document{' '}
          <strong>into your scope</strong> (inbound: accept or reject) or when you requested a move{' '}
          <strong>out of your scope</strong> (outbound: withdraw while pending).
        </List.Item>
      </List>
      <Text component="p">
        How same-scope moves and cross-scope requests work on the document itself is covered under{' '}
        <Anchor component={Link} to="/help/contexts">
          Processes & projects → Moving documents
        </Anchor>
        .
      </Text>
      <Title order={2}>What you get</Title>
      <List spacing="xs">
        <List.Item>
          Published versions readers can trust, plus change history for audit and learning.
        </List.Item>
        <List.Item>Room for review and approval where your process requires it.</List.Item>
        <List.Item>Less ambiguity about what is “live” versus in progress.</List.Item>
        <List.Item>
          A single place for suggestion reviews and cross-scope document move decisions.
        </List.Item>
      </List>
    </Stack>
  );
}
