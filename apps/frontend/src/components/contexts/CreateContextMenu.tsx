import { Button, Menu } from '@mantine/core';
import { IconBriefcase, IconChevronDown, IconPlus, IconRoute } from '@tabler/icons-react';

export interface CreateContextMenuProps {
  /** Opens the new draft document flow. */
  onCreateDraft: () => void;
  /** Opens the new process dialog with type preselected. */
  onCreateProcess: () => void;
  /** Opens the new project dialog with type preselected. */
  onCreateProject: () => void;
}

/**
 * Split create control: primary "Draft" action plus menu for Process and Project.
 * Used on Personal, Company, Department and Team context pages.
 */
export function CreateContextMenu({
  onCreateDraft,
  onCreateProcess,
  onCreateProject,
}: CreateContextMenuProps) {
  return (
    <Button.Group>
      <Button
        variant="filled"
        size="sm"
        leftSection={<IconPlus size={16} />}
        onClick={onCreateDraft}
      >
        Draft
      </Button>
      <Menu position="bottom-end" shadow="md" withinPortal>
        <Menu.Target>
          <Button variant="filled" size="sm" px="xs" aria-label="Create process or project">
            <IconChevronDown size={16} />
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item leftSection={<IconRoute size={16} />} onClick={onCreateProcess}>
            Process
          </Menu.Item>
          <Menu.Item leftSection={<IconBriefcase size={16} />} onClick={onCreateProject}>
            Project
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Button.Group>
  );
}
