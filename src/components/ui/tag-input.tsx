import { useState, useRef, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Badge } from "./badge";
import { Command, CommandGroup, CommandItem } from "./command";
import { cn } from "@/lib/utils";

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  error?: string;
  containerClassName?: string;
}

export function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder = "Add tags...",
  error,
  containerClassName,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue) {
      e.preventDefault();
      handleAddTags(inputValue);
    } else if (e.key === "," && inputValue) {
      e.preventDefault();
      handleAddTags(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleAddTags = (input: string) => {
    // Split by comma and process each tag
    const tags = input
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    const newTags = tags.filter(tag => !value.includes(tag));
    if (newTags.length > 0) {
      onChange([...value, ...newTags]);
    }
    setInputValue("");
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    handleAddTags(pastedText);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const addTag = (tag: string) => {
    if (!value.includes(tag)) {
      onChange([...value, tag]);
    }
    setInputValue("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const filteredSuggestions = suggestions.filter(
    (suggestion) =>
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.includes(suggestion)
  );

  return (
    <div className="relative">
      <div
        className={cn(
          "flex flex-wrap gap-2 p-2 border rounded-md min-h-[2.5rem]",
          containerClassName,
          error && "border-red-500"
        )}
      >
        {value.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
            <button
              type="button"
              className="ml-1 hover:bg-gray-200 rounded-full"
              onClick={() => removeTag(tag)}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => setShowSuggestions(true)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 outline-none bg-transparent min-w-[120px]"
        />
      </div>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      
      {showSuggestions && filteredSuggestions.length > 0 && (
        <Command className="absolute z-50 w-full mt-1 border rounded-md shadow-md bg-white">
          <CommandGroup>
            {filteredSuggestions.map((suggestion) => (
              <CommandItem
                key={suggestion}
                onSelect={() => addTag(suggestion)}
                className="cursor-pointer"
              >
                {suggestion}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      )}
    </div>
  );
} 