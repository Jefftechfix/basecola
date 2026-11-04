import { useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { COUNTRY_DIALS, countryByIso, countryOptionLabel, flagUrl } from "@/lib/countries";
import { cn } from "@/lib/utils";

/** Real flag artwork for a country, with a quiet placeholder if it cannot load. */
export function CountryFlag({ iso, className }: { iso: string; className?: string }) {
  const [missing, setMissing] = useState(false);
  if (missing) {
    return <span aria-hidden className={cn("h-3.5 w-5 shrink-0 rounded-[2px] bg-muted", className)} />;
  }
  return (
    <img
      src={flagUrl(iso)}
      alt=""
      aria-hidden
      width={20}
      height={14}
      loading="lazy"
      decoding="async"
      onError={() => setMissing(true)}
      className={cn("h-3.5 w-5 shrink-0 rounded-[2px] object-cover ring-1 ring-black/10", className)}
    />
  );
}

type CountryCodeSelectProps = {
  /** ISO country code, e.g. "US". Empty means nothing picked yet. */
  value: string;
  onChange: (iso: string) => void;
  /** Extra styling for the closed control. */
  className?: string;
  ariaLabel?: string;
  /** Shown until the member picks their own country. */
  placeholder?: string;
};

/**
 * Phone dial-code picker: shows the flag with a short code such as "US +1"
 * and opens a searchable list so members can find their country quickly.
 * Nothing is preselected — every country is offered, not just the US.
 */
export function CountryCodeSelect({
  value,
  onChange,
  className,
  ariaLabel = "Country code",
  placeholder = "Code",
}: CountryCodeSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = countryByIso(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          {selected ? <CountryFlag iso={selected.iso} /> : <Globe className="h-4 w-4 shrink-0 opacity-60" />}
          <span className={cn("whitespace-nowrap", selected ? "font-semibold" : "font-normal text-muted-foreground")}>
            {selected ? countryOptionLabel(selected) : placeholder}
          </span>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 opacity-60 transition-transform", open && "rotate-180")}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 gap-0 p-0">
        <Command>
          <CommandInput placeholder="Search country or code" />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {COUNTRY_DIALS.map(item => (
                <CommandItem
                  key={item.iso}
                  value={`${item.iso} ${item.name} ${item.dial}`}
                  onSelect={() => {
                    onChange(item.iso);
                    setOpen(false);
                  }}
                  className="gap-2"
                >
                  <CountryFlag iso={item.iso} />
                  <span className="w-8 shrink-0 font-semibold">{item.iso}</span>
                  <span className="w-12 shrink-0 text-muted-foreground">{item.dial}</span>
                  <span className="truncate">{item.name}</span>
                  <Check
                    className={cn("ml-auto h-4 w-4", selected?.iso === item.iso ? "opacity-100" : "opacity-0")}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
