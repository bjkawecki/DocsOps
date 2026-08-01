import { Anchor, List, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';

export function HelpDocumentTypesPage() {
  return (
    <Stack gap={0} align="stretch" style={{ textAlign: 'left' }}>
      <Title order={1}>Document types</Title>
      <Text component="p">
        A <strong>document type</strong> describes what kind of document you are writing (Policy,
        Runbook, ADR, …). A <strong>template</strong> is optional starter content for that type.
        Context (process / project) answers <em>where</em> the document lives; type answers{' '}
        <em>what</em> it is. Built-ins cover a small core; scope leads can add custom types for
        everything else.
      </Text>

      <Title order={2}>Choosing a document type</Title>
      <List spacing="xs">
        <List.Item>
          Pick a type with a template to insert a chapter outline into the new draft.
        </List.Item>
        <List.Item>
          Choose blank document if you want an empty draft. You can still set a type later.
        </List.Item>
        <List.Item>
          Process and Project groups are typical homes for a type – suggestions, not hard rules.
        </List.Item>
      </List>

      <Title order={2}>Process types: which one?</Title>
      <Text component="p" fs="italic">
        Common mix-ups and when to pick which:
      </Text>
      <List spacing="sm">
        <List.Item>
          <strong>Policy vs Standard:</strong> Policy states binding intent (“data must be
          protected”). Standard makes it measurable (“passwords must be at least 12 characters”).
        </List.Item>
        <List.Item>
          <strong>Guideline vs Policy/Standard:</strong> Guideline is recommended practice;
          deviation is OK with judgment. Policy and Standard are binding.
        </List.Item>
        <List.Item>
          <strong>Procedure vs Runbook:</strong> Procedure is a calm, recurring SOP. Runbook is
          time-critical incident response (diagnose, mitigate, verify).
        </List.Item>
      </List>

      <Title order={2}>Project types: which one?</Title>
      <List spacing="sm">
        <List.Item>
          <strong>ADR vs Architecture overview:</strong> ADR records one decision and its
          trade-offs. Architecture overview is the living system map; update ADRs when decisions
          change.
        </List.Item>
        <List.Item>
          <strong>Runbook vs Post-mortem:</strong> Runbook during the incident; Post-mortem after
          recovery for timeline, causes, and lasting fixes.
        </List.Item>
      </List>

      <Title order={2}>Changing type later</Title>
      <Text component="p">
        On the document Metadata tab you can set, change, or clear the type. That updates metadata
        only – existing draft and published content stay unchanged. Templates are never re-applied
        to existing documents.
      </Text>

      <Title order={2}>Templates</Title>
      <Text component="p">
        Scope leads and admins can define <strong>custom document types</strong> with a default
        template (for example checklists, playbooks, meeting notes, or known-issue pages). Built-in
        types ship with the platform and cannot be deleted.
      </Text>
      <List spacing="xs">
        <List.Item>Company, department, or team leads for their own scope.</List.Item>
        <List.Item>Admins for platform-wide custom types.</List.Item>
        <List.Item>
          Authors without a lead role can use types when creating documents, but do not see the
          manage page.
        </List.Item>
      </List>
      <Text component="p">
        Open{' '}
        <Anchor component={Link} to="/templates">
          Templates
        </Anchor>{' '}
        under Catalog (visible only with manage rights). Create a custom type with label, when to
        use, example title, and section headings with prompts.
      </Text>
    </Stack>
  );
}
