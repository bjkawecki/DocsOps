import { ActionIcon, Box, CopyButton, Tooltip } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import classes from './DocumentPreviewCodeBlock.module.css';

type Props = {
  code: string;
  language: string;
  /** Language label in the header; omit for untitled blocks. */
  label: string | null;
};

/**
 * Reader code block: language + copy in a real header strip inside the chrome
 * (not Mantine CodeHighlightTabs overlay, which sits on the top edge).
 */
export function DocumentPreviewCodeBlock({ code, language, label }: Props) {
  const trimmed = code.trim();

  return (
    <Box className={`${classes.root} document-preview-code-block`}>
      <div className={classes.header}>
        {label ? <span className={classes.lang}>{label}</span> : <span />}
        <CopyButton value={trimmed} timeout={2000}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="left">
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                aria-label={copied ? 'Copied' : 'Copy code'}
                onClick={copy}
              >
                {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </div>
      <CodeHighlight
        code={code}
        language={language}
        withCopyButton={false}
        radius={0}
        classNames={{
          codeHighlight: classes.codeBody,
          pre: classes.pre,
          code: classes.code,
        }}
      />
    </Box>
  );
}
