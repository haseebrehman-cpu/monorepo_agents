import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@rdx/ui";

const meta = {
  title: "Components/Dialog",
  component: Dialog,
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: function DefaultStory() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open dialog</Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogTitle>Delete ticket</DialogTitle>
            <DialogDescription>
              This removes the ticket from the list. This action cannot be undone.
            </DialogDescription>
            <div className="mt-6 flex justify-end gap-2">
              <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
              <Button variant="primary" onClick={() => setOpen(false)}>
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  },
};
