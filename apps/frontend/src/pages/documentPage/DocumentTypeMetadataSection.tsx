import { Stack } from '@mantine/core';
import { DocumentTypePicker } from '../../components/documents/DocumentTypePicker.js';
import {
  BLANK_DOCUMENT_SELECTION,
  type DocumentTypeSelection,
} from '../../components/documents/documentTypeTypes.js';

type Props = {
  contextId: string | null;
  typeId: string | null;
  onTypeIdChange: (typeId: string | null) => void;
};

/** Controlled type picker for metadata edit – saved with the main Save action. */
export function DocumentTypeMetadataSection({ contextId, typeId, onTypeIdChange }: Props) {
  const value: DocumentTypeSelection =
    typeId == null ? BLANK_DOCUMENT_SELECTION : { templateId: null, typeId, exampleTitle: null };

  return (
    <Stack gap="xs">
      <DocumentTypePicker
        contextId={contextId}
        value={value}
        onChange={(next) => onTypeIdChange(next.typeId)}
        applyTemplateOnSelect={false}
        mode="metadata"
      />
    </Stack>
  );
}
