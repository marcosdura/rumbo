import { afterEach } from "vitest"
import { cleanup } from "@testing-library/react"

// Sin globals de Vitest, Testing Library no desmonta solo entre tests.
afterEach(() => cleanup())
