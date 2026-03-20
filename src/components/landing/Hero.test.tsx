import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import Hero from "./Hero";

describe("Hero Component", () => {
  it("renders the main project title", () => {
    render(<Hero />);
    const titleElement = screen.getByText(/Project/i);
    const mohenjoElement = screen.getByText(/Mohenjo/i);

    expect(titleElement).toBeInTheDocument();
    expect(mohenjoElement).toBeInTheDocument();
  });

  it("renders the waitlist call to action", () => {
    render(<Hero />);
    const button = screen.getByTestId("waitlist-button");

    expect(button).toBeInTheDocument();
    expect(button.textContent).toBe("Join the Waitlist");
  });

  it("displays the correct initial spot count", () => {
    render(<Hero />);
    const spotsElement = screen.getByTestId("spots-remaining");

    expect(spotsElement).toBeInTheDocument();
    expect(spotsElement.textContent).toBe("1,000");
  });
});
