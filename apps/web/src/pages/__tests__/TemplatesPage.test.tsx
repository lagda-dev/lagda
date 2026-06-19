import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// TemplatesPage is driven by the typed resource hooks, so we mock the templates + entities modules and
// assert (1) the list renders a row per template, (2) opening the create dialog shows the form, and
// (3) submitting a filled form calls the create mutation with the entered values.

const useTemplatesList = vi.fn()
const useEntitiesList = vi.fn()
const createMutateAsync = vi.fn()
const useCreateTemplate = vi.fn()
const useUpdateTemplate = vi.fn()
const useDeleteTemplate = vi.fn()

vi.mock("../../api/resources/templates", () => ({
  useTemplatesList: () => useTemplatesList(),
  useCreateTemplate: () => useCreateTemplate(),
  useUpdateTemplate: () => useUpdateTemplate(),
  useDeleteTemplate: () => useDeleteTemplate(),
}))
vi.mock("../../api/resources/entities", () => ({ useEntitiesList: () => useEntitiesList() }))

import { TemplatesPage } from "../TemplatesPage"

const idleMutation = (mutateAsync: () => Promise<unknown>) => ({ mutateAsync, isPending: false })

describe("TemplatesPage", () => {
  beforeEach(() => {
    useTemplatesList.mockReset()
    useEntitiesList.mockReset()
    createMutateAsync.mockReset()
    createMutateAsync.mockResolvedValue({ id: "tpl-new", entityId: "ent-1", name: "New" })
    useCreateTemplate.mockReturnValue(idleMutation(createMutateAsync))
    useUpdateTemplate.mockReturnValue(idleMutation(vi.fn()))
    useDeleteTemplate.mockReturnValue(idleMutation(vi.fn()))
    useEntitiesList.mockReturnValue({
      data: { data: [{ id: "ent-1", organizationId: "org-1", name: "Acme", slug: "acme" }], nextCursor: null },
      isPending: false,
      isError: false,
    })
  })

  it("renders a row per template from the mocked data", () => {
    // Arrange
    useTemplatesList.mockReturnValue({
      data: { data: [{ id: "tpl-1", entityId: "ent-1", name: "Sales signature" }], nextCursor: null },
      isPending: false,
      isError: false,
    })

    // Act
    render(<TemplatesPage />)

    // Assert
    expect(screen.getByText("Sales signature")).toBeInTheDocument()
    expect(screen.getByText("Acme")).toBeInTheDocument()
  })

  it("shows the empty state when there are no templates", () => {
    // Arrange
    useTemplatesList.mockReturnValue({ data: { data: [], nextCursor: null }, isPending: false, isError: false })

    // Act
    render(<TemplatesPage />)

    // Assert
    expect(screen.getByText("No templates yet")).toBeInTheDocument()
  })

  it("opens the create dialog and calls the create mutation on submit", async () => {
    // Arrange
    useTemplatesList.mockReturnValue({ data: { data: [], nextCursor: null }, isPending: false, isError: false })
    render(<TemplatesPage />)

    // Act — open the dialog
    fireEvent.click(screen.getByRole("button", { name: "New template" }))
    expect(screen.getByText("Name the template, pick its entity, and provide its MJML source.")).toBeInTheDocument()

    // Act — fill the form and submit
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Marketing" } })
    fireEvent.change(screen.getByLabelText("MJML source"), { target: { value: "<mjml></mjml>" } })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))

    // Assert
    await vi.waitFor(() => expect(createMutateAsync).toHaveBeenCalledWith({ entityId: "ent-1", name: "Marketing", mjmlSource: "<mjml></mjml>" }))
  })
})
