import React from "react";
import { Box, Text, useInput } from "ink";

export interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Yes",
  cancelLabel = "No",
  onConfirm,
  onCancel,
  isDestructive = false,
}: ConfirmDialogProps) {
  const [selected, setSelected] = React.useState<"confirm" | "cancel">("cancel");

  useInput((input, key) => {
    if (key.return) {
      if (selected === "confirm") {
        onConfirm();
      } else {
        onCancel();
      }
    } else if (key.escape || input === "n") {
      onCancel();
    } else if (input === "y") {
      onConfirm();
    } else if (key.leftArrow || key.rightArrow || input === "h" || input === "l") {
      setSelected((prev) => (prev === "confirm" ? "cancel" : "confirm"));
    } else if (key.tab) {
      setSelected((prev) => (prev === "confirm" ? "cancel" : "confirm"));
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor={isDestructive ? "red" : "yellow"}
      padding={1}
    >
      <Text bold color={isDestructive ? "red" : "yellow"}>
        {title}
      </Text>
      <Box marginY={1}>
        <Text>{message}</Text>
      </Box>
      <Box gap={2}>
        <Text
          inverse={selected === "confirm"}
          color={isDestructive ? "red" : "green"}
          bold={selected === "confirm"}
        >
          [{selected === "confirm" ? "●" : " "}] {confirmLabel} (y)
        </Text>
        <Text inverse={selected === "cancel"} bold={selected === "cancel"}>
          [{selected === "cancel" ? "●" : " "}] {cancelLabel} (n)
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>[Tab/←/→] Switch | [Enter] Select | [y/n] Quick select</Text>
      </Box>
    </Box>
  );
}
