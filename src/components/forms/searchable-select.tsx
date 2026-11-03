import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export interface Option {
  value: string;
  label: string;
}

/** Single-select with type-to-search, for long lists (classes, sections, years). */
export function SearchableSelect({
  id,
  options,
  value,
  onChange,
  placeholder = "Select…",
  disabled,
  invalid,
}: {
  id?: string;
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-between font-normal",
            !selected && "text-muted-foreground",
            invalid && "border-destructive",
          )}
        >
          <span className="truncate">{selected?.label ?? placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search…" />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={o.label}
                  onSelect={() => {
                    onChange(o.value === value ? "" : o.value);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", o.value === value ? "opacity-100" : "opacity-0")} />
                  {o.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Multi-select chips with search (teacher subjects/classes). */
export function MultiSearchableSelect({
  id,
  options,
  values,
  onChange,
  placeholder = "Select…",
  invalid,
}: {
  id?: string;
  options: Option[];
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const labels = options.filter((o) => values.includes(o.value)).map((o) => o.label);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-invalid={invalid || undefined}
          className={cn(
            "h-auto min-h-10 w-full justify-between font-normal",
            labels.length === 0 && "text-muted-foreground",
            invalid && "border-destructive",
          )}
        >
          <span className="line-clamp-2 text-left">
            {labels.length ? labels.join(", ") : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search…" />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {options.map((o) => {
                const on = values.includes(o.value);
                return (
                  <CommandItem
                    key={o.value}
                    value={o.label}
                    onSelect={() =>
                      onChange(on ? values.filter((v) => v !== o.value) : [...values, o.value])
                    }
                  >
                    <Check className={cn("mr-2 h-4 w-4", on ? "opacity-100" : "opacity-0")} />
                    {o.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
