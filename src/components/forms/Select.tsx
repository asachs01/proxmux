import React from "react";
import { Box, Text, useInput } from "ink";

export interface SelectOption<T = string> {
  label: string;
  value: T;
  description?: string;
}

export interface SelectProps<T = string> {
  label: string;
  options: SelectOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  isActive?: boolean;
  placeholder?: string;
}

export function Select<T = string>({
  label,
  options,
  value,
  onChange,
  isActive = false,
  placeholder = "Select an option...",
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);

  const selectedOption = options.find((opt) => opt.value === value);

  useInput(
    (input, key) => {
      if (!isActive) return;

      if (key.return) {
        if (isOpen) {
          const selected = options[highlightedIndex];
          if (selected) {
            onChange(selected.value);
          }
          setIsOpen(false);
        } else {
          setIsOpen(true);
          const currentIndex = options.findIndex((opt) => opt.value === value);
          setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
        }
      } else if (key.escape) {
        setIsOpen(false);
      } else if (isOpen) {
        if (key.upArrow || input === "k") {
          setHighlightedIndex((prev) => Math.max(0, prev - 1));
        } else if (key.downArrow || input === "j") {
          setHighlightedIndex((prev) => Math.min(options.length - 1, prev + 1));
        }
      }
    },
    { isActive }
  );

  const displayValue = selectedOption?.label || placeholder;

  return (
    <Box flexDirection="column">
      <Box>
        <Text bold={isActive} color={isActive ? "cyan" : undefined}>
          {label}:{" "}
        </Text>
        <Text color={isActive ? "cyan" : "gray"}>[</Text>
        <Text color={selectedOption ? undefined : "gray"}>
          {" "}{displayValue}{" "}
        </Text>
        <Text color={isActive ? "cyan" : "gray"}>]</Text>
        {isActive && <Text dimColor> ↵ to {isOpen ? "select" : "open"}</Text>}
      </Box>

      {isOpen && isActive && (
        <Box flexDirection="column" paddingLeft={label.length + 2} marginTop={1}>
          {options.map((option, index) => {
            const isHighlighted = index === highlightedIndex;
            const isSelected = option.value === value;

            return (
              <Box key={String(option.value)}>
                <Text
                  inverse={isHighlighted}
                  color={isSelected ? "green" : undefined}
                  bold={isSelected}
                >
                  {isSelected ? "● " : "○ "}
                  {option.label}
                </Text>
                {option.description && (
                  <Text dimColor> - {option.description}</Text>
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
