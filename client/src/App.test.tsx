import { render, screen } from "@testing-library/react"
import App from "./App"

describe("App component", () => {
  it("renders heading", () => {
    render(<App />)
    expect(screen.getByText(/SwiftSlot/i)).toBeInTheDocument()
  })
})
