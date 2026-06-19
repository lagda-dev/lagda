import type { Meta, StoryObj } from "@storybook/react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "./button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "./form"
import { Input } from "./input"

const meta: Meta = {
  title: "Components/Form",
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj

interface ProfileValues {
  displayName: string
}

const FormDemo = () => {
  const form = useForm<ProfileValues>({ defaultValues: { displayName: "" } })
  const [submitted, setSubmitted] = useState<string | null>(null)

  const onSubmit = (values: ProfileValues) => {
    setSubmitted(values.displayName)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-80 space-y-6">
        <FormField
          control={form.control}
          name="displayName"
          rules={{ required: "Display name is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display name</FormLabel>
              <FormControl>
                <Input placeholder="Ada Lovelace" {...field} />
              </FormControl>
              <FormDescription>This is the name shown on your signature.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Save</Button>
        {submitted && <p className="text-sm text-muted-foreground">Submitted: {submitted}</p>}
      </form>
    </Form>
  )
}

export const Default: Story = {
  render: () => <FormDemo />,
}
