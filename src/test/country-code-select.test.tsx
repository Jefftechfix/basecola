import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CountryCodeSelect } from "@/components/country-code-select";
import { countryOptionLabel, flagUrl } from "@/lib/countries";

describe("Phone dial-code field", () => {
  it("shows a short country code instead of the full name", () => {
    expect(countryOptionLabel({ name: "United States", iso: "US", dial: "+1" })).toBe("US +1");
    expect(countryOptionLabel({ name: "Nigeria", iso: "NG", dial: "+234" })).toBe("NG +234");
    expect(countryOptionLabel({ name: "United Kingdom", iso: "GB", dial: "+44" })).toBe("GB +44");
  });

  it("starts with no country preselected so every country is offered", () => {
    render(<CountryCodeSelect value="" onChange={vi.fn()} />);

    const trigger = screen.getByRole("button", { name: "Country code" });
    expect(trigger).toHaveTextContent("Code");
    expect(trigger).not.toHaveTextContent("US +1");
    expect(trigger.querySelector("img")).toBeNull();
  });

  it("shows the country flag next to the selected code", () => {
    render(<CountryCodeSelect value="US" onChange={vi.fn()} />);

    const trigger = screen.getByRole("button", { name: "Country code" });
    expect(trigger).toHaveTextContent("US +1");
    expect(trigger.querySelector("img")).toHaveAttribute("src", flagUrl("US"));
  });

  it("lets the member search and pick another country", async () => {
    const onChange = vi.fn();
    render(<CountryCodeSelect value="US" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Country code" }));
    fireEvent.change(screen.getByPlaceholderText("Search country or code"), {
      target: { value: "nigeria" },
    });

    fireEvent.click(await screen.findByText("Nigeria"));
    expect(onChange).toHaveBeenCalledWith("NG");
  });
});
