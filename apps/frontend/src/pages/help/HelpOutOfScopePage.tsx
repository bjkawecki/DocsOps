import { List, Stack, Text, Title } from '@mantine/core';

export function HelpOutOfScopePage() {
  return (
    <Stack gap="sm" align="stretch" style={{ textAlign: 'left' }}>
      <Stack gap={6}>
        <Title order={1}>What DocsOps is not</Title>
        <Text>
          DocsOps holds <strong>durable internal knowledge</strong> with an official published
          stand: how the organisation works (processes) and what it is building or running
          (projects). It is not a replacement for every tool that stores text or tracks work.
        </Text>
        <Text>
          Rule of thumb: if the value still matters in weeks and someone should read it as{' '}
          <em>how we do this</em> or <em>what we know about this</em>, it belongs here. If it goes
          stale in hours or is a workflow step, use another system.
        </Text>
      </Stack>

      <Stack gap={6}>
        <Title order={2}>Out of scope</Title>
        <List spacing="sm">
          <List.Item>
            <strong>Issue trackers</strong> – assignees, sprints, triage status. Document a{' '}
            <em>known issue</em> (symptoms, workaround, link to the ticket) in DocsOps; keep the
            ticket lifecycle in Jira, GitHub Issues, Linear, or similar.
          </List.Item>
          <List.Item>
            <strong>Chat and ephemeral discussion</strong> – Slack, Teams, email threads. Capture
            decisions or lasting guidance as documents when they become organisational knowledge.
          </List.Item>
          <List.Item>
            <strong>Generic file drives</strong> – arbitrary binaries without a document lifecycle.
            Attachments belong on documents; bulk storage stays in Drive, Nextcloud, SharePoint, or
            object storage.
          </List.Item>
          <List.Item>
            <strong>Public product or API docs / developer portals</strong> – external audiences,
            SEO, public branding. Use dedicated doc sites; DocsOps stays intranet and org-native.
          </List.Item>
          <List.Item>
            <strong>Code as the source of truth</strong> – specs and docs owned by the repo and CI.
            DocsOps can complement internal process/project knowledge; it does not replace Git.
          </List.Item>
          <List.Item>
            <strong>Personal scratch without shared purpose</strong> – fleeting notes. Use personal
            space only as a draft pad; lasting knowledge belongs in a team or project context.
          </List.Item>
          <List.Item>
            <strong>Line-of-business systems</strong> – CRM, HR, ERP master data. Those systems
            remain authoritative; DocsOps may only link to them.
          </List.Item>
          <List.Item>
            <strong>Live ops signals</strong> – monitoring, alerts, dashboards. Put{' '}
            <em>runbooks</em> for those signals in DocsOps; keep the signal itself in the
            observability stack.
          </List.Item>
          <List.Item>
            <strong>Everyone-edits-the-truth wikis</strong> – live overwrite of the official stand.
            DocsOps separates draft work from what readers see after lead publication.
          </List.Item>
        </List>
      </Stack>

      <Stack gap={6}>
        <Title order={2}>Fine line</Title>
        <List spacing="xs">
          <List.Item>
            <strong>Known issue / workaround</strong> → DocsOps; <strong>who fixes the bug</strong>{' '}
            → tracker.
          </List.Item>
          <List.Item>
            <strong>Runbook for alert X</strong> → DocsOps; <strong>the alert UI</strong> → ops
            tools.
          </List.Item>
          <List.Item>
            <strong>Meeting decision</strong> → DocsOps (notes or ADR);{' '}
            <strong>meeting chat</strong> → not.
          </List.Item>
        </List>
      </Stack>
    </Stack>
  );
}
