import {
  Box,
  Combobox,
  Group,
  InputBase,
  ScrollArea,
  Stack,
  Text,
  Tooltip,
  useCombobox,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconInfoCircle } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { apiFetch } from '../../api/client.js';
import {
  BLANK_DOCUMENT_SELECTION,
  type DocumentTypeDto,
  type DocumentTypeSelection,
} from './documentTypeTypes.js';

const BLANK_OPTION_VALUE = 'blank';
const BLANK_LABEL = 'No type';
const DROPDOWN_MIN_WIDTH = 480;

const hoverOptionStyle: CSSProperties = {
  backgroundColor: 'var(--mantine-color-default-hover)',
};

type Props = {
  contextId: string | null;
  value: DocumentTypeSelection;
  onChange: (next: DocumentTypeSelection) => void;
  /** When true, selecting a type uses defaultTemplateId (seed on create). */
  applyTemplateOnSelect?: boolean;
  mode?: 'create' | 'metadata';
};

type FlatOption = { value: string; label: string };

function optionValueForType(type: DocumentTypeDto, applyTemplateOnSelect: boolean): string {
  return applyTemplateOnSelect && type.defaultTemplateId ? type.defaultTemplateId : type.id;
}

function blankDescription(mode: 'create' | 'metadata'): string {
  return mode === 'create'
    ? 'No document type. You can set a type later without changing content.'
    : 'No document type. Changing the type later updates metadata only.';
}

function typicalContextLabel(type: DocumentTypeDto | null, isBlank: boolean): string | null {
  if (isBlank || type == null) return null;
  if (type.oftenUsedIn === 'process') return 'Typical context: Process';
  if (type.oftenUsedIn === 'project') return 'Typical context: Project';
  return null;
}

function sourceLabel(type: DocumentTypeDto | null, isBlank: boolean): string | null {
  if (isBlank) return null;
  if (type == null) return null;
  return type.source === 'custom' ? 'Custom' : 'Built-in';
}

export function DocumentTypePicker({
  contextId,
  value,
  onChange,
  applyTemplateOnSelect = true,
  mode = 'create',
}: Props) {
  const isNarrow = useMediaQuery('(max-width: 36em)');
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption();
      setHoveredKey(null);
    },
    onDropdownOpen: () => {
      setHoveredKey(null);
    },
  });

  const helpText =
    mode === 'create'
      ? 'A type with template inserts a starter outline. You can leave this blank and set a type later without changing content.'
      : 'Changing the type updates metadata only. Document content is not modified.';

  const { data, isPending } = useQuery({
    queryKey: ['document-types', contextId, 'picker'],
    queryFn: async (): Promise<DocumentTypeDto[]> => {
      const params = new URLSearchParams();
      if (contextId) params.set('contextId', contextId);
      const res = await apiFetch(`/api/v1/document-types?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load document types');
      const body = (await res.json()) as { items: DocumentTypeDto[] };
      return body.items;
    },
  });

  const items = useMemo(() => data ?? [], [data]);

  const selectedType = useMemo(() => {
    if (value.typeId == null && value.templateId == null) return null;
    return (
      items.find(
        (t) =>
          t.id === value.typeId ||
          (value.templateId != null && t.defaultTemplateId === value.templateId)
      ) ?? null
    );
  }, [items, value.templateId, value.typeId]);

  const selectedKey = selectedType
    ? optionValueForType(selectedType, applyTemplateOnSelect)
    : BLANK_OPTION_VALUE;

  const selectedLabel = selectedType?.label ?? BLANK_LABEL;

  const typeByOptionValue = useMemo(() => {
    const map = new Map<string, DocumentTypeDto>();
    for (const type of items) {
      map.set(optionValueForType(type, applyTemplateOnSelect), type);
    }
    return map;
  }, [applyTemplateOnSelect, items]);

  const processTypes = useMemo(
    () => items.filter((t) => t.source === 'builtin' && t.oftenUsedIn === 'process'),
    [items]
  );
  const projectTypes = useMemo(
    () => items.filter((t) => t.source === 'builtin' && t.oftenUsedIn === 'project'),
    [items]
  );
  const customTypes = useMemo(() => items.filter((t) => t.source === 'custom'), [items]);

  const toOption = (type: DocumentTypeDto): FlatOption => ({
    value: optionValueForType(type, applyTemplateOnSelect),
    label: type.label,
  });

  const flatOptions = useMemo((): FlatOption[] => {
    return [
      { value: BLANK_OPTION_VALUE, label: BLANK_LABEL },
      ...processTypes.map(toOption),
      ...projectTypes.map(toOption),
      ...customTypes.map(toOption),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lists + apply flag
  }, [applyTemplateOnSelect, customTypes, processTypes, projectTypes]);

  const keyboardKey =
    combobox.dropdownOpened && combobox.selectedOptionIndex >= 0
      ? (flatOptions[combobox.selectedOptionIndex]?.value ?? null)
      : null;

  const previewKey = hoveredKey ?? keyboardKey ?? selectedKey;
  const previewIsBlank = previewKey === BLANK_OPTION_VALUE;
  const previewType = previewIsBlank ? null : (typeByOptionValue.get(previewKey) ?? null);
  const previewTitle = previewIsBlank ? BLANK_LABEL : (previewType?.label ?? selectedLabel);
  const previewBody = previewIsBlank ? blankDescription(mode) : (previewType?.whenToUse ?? '');
  const typicalContext = typicalContextLabel(previewType, previewIsBlank);
  const source = sourceLabel(previewType, previewIsBlank);

  const applySelection = (id: string) => {
    if (id === BLANK_OPTION_VALUE) {
      onChange(BLANK_DOCUMENT_SELECTION);
      return;
    }
    const type =
      typeByOptionValue.get(id) ?? items.find((t) => t.id === id || t.defaultTemplateId === id);
    if (!type) return;
    if (applyTemplateOnSelect && type.defaultTemplateId) {
      onChange({
        templateId: type.defaultTemplateId,
        typeId: type.id,
        exampleTitle: type.exampleTitle,
      });
      return;
    }
    onChange({
      templateId: null,
      typeId: type.id,
      exampleTitle: type.exampleTitle,
    });
  };

  useEffect(() => {
    if (!combobox.dropdownOpened) setHoveredKey(null);
  }, [combobox.dropdownOpened]);

  const renderOption = (option: FlatOption) => {
    const isSelected = option.value === selectedKey;
    const isPreview = option.value === previewKey;
    return (
      <Combobox.Option
        key={option.value}
        value={option.value}
        active={isSelected}
        onMouseEnter={() => setHoveredKey(option.value)}
        style={isPreview && !isSelected ? hoverOptionStyle : undefined}
      >
        <Text size="sm" truncate fw={isSelected ? 600 : 400}>
          {option.label}
        </Text>
      </Combobox.Option>
    );
  };

  const listPanel = (
    <Box
      w={isNarrow ? '100%' : '50%'}
      style={{
        flex: isNarrow ? undefined : '1 1 50%',
        minWidth: 0,
        borderLeft: isNarrow ? undefined : '1px solid var(--mantine-color-default-border)',
        borderTop: isNarrow ? '1px solid var(--mantine-color-default-border)' : undefined,
      }}
    >
      <ScrollArea.Autosize mah={isNarrow ? 220 : 320} type="scroll" style={{ width: '100%' }}>
        <Combobox.Options>
          <Stack gap={4} p={4}>
            {renderOption({ value: BLANK_OPTION_VALUE, label: BLANK_LABEL })}
            {processTypes.length > 0 ? (
              <Combobox.Group label="Process">
                {processTypes.map((t) => renderOption(toOption(t)))}
              </Combobox.Group>
            ) : null}
            {projectTypes.length > 0 ? (
              <Combobox.Group label="Project">
                {projectTypes.map((t) => renderOption(toOption(t)))}
              </Combobox.Group>
            ) : null}
            {customTypes.length > 0 ? (
              <Combobox.Group label="Custom">
                {customTypes.map((t) => renderOption(toOption(t)))}
              </Combobox.Group>
            ) : null}
          </Stack>
        </Combobox.Options>
      </ScrollArea.Autosize>
    </Box>
  );

  const previewPanel = (
    <Box
      w={isNarrow ? '100%' : '50%'}
      p="md"
      style={{ flex: isNarrow ? undefined : '1 1 50%', minWidth: 0 }}
    >
      <Stack gap="sm">
        <Text size="md" fw={600} style={{ lineHeight: 1.3 }}>
          {previewTitle}
        </Text>
        <Stack gap={4}>
          {source ? (
            <Text size="sm" style={{ opacity: 0.9 }}>
              {source}
            </Text>
          ) : null}
          {typicalContext ? (
            <Text size="sm" style={{ opacity: 0.9 }}>
              {typicalContext}
            </Text>
          ) : null}
        </Stack>
        <Text size="sm" style={{ lineHeight: 1.5, opacity: 0.92 }}>
          {previewBody}
        </Text>
      </Stack>
    </Box>
  );

  if (isPending) {
    return (
      <Text size="sm" c="dimmed">
        Loading document types…
      </Text>
    );
  }

  return (
    <Stack gap="xs">
      <Group gap={6} align="center">
        <Text size="sm" fw={500}>
          Document type
        </Text>
        <Tooltip label={helpText} multiline maw={280} withArrow position="top-start">
          <Box
            component="span"
            style={{ display: 'inline-flex', color: 'var(--mantine-color-dimmed)' }}
            aria-label={helpText}
          >
            <IconInfoCircle size={14} stroke={1.5} />
          </Box>
        </Tooltip>
      </Group>
      <Combobox
        store={combobox}
        withinPortal
        onOptionSubmit={(next) => {
          applySelection(next);
          combobox.closeDropdown();
        }}
      >
        <Combobox.Target>
          <InputBase
            component="button"
            type="button"
            pointer
            rightSection={<Combobox.Chevron />}
            rightSectionPointerEvents="none"
            onClick={() => combobox.toggleDropdown()}
            w="100%"
            aria-label="Document type"
          >
            <Text size="sm" truncate style={{ textAlign: 'left' }}>
              {selectedLabel}
            </Text>
          </InputBase>
        </Combobox.Target>

        <Combobox.Dropdown
          p={0}
          miw={isNarrow ? undefined : DROPDOWN_MIN_WIDTH}
          w={isNarrow ? Math.min(DROPDOWN_MIN_WIDTH, 360) : undefined}
        >
          <Box
            style={{
              display: 'flex',
              flexDirection: isNarrow ? 'column' : 'row',
              alignItems: 'stretch',
              width: '100%',
            }}
          >
            {isNarrow ? (
              <>
                {listPanel}
                {previewPanel}
              </>
            ) : (
              <>
                {previewPanel}
                {listPanel}
              </>
            )}
          </Box>
        </Combobox.Dropdown>
      </Combobox>
    </Stack>
  );
}
