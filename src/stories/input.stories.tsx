// [build] library: 'shadcn'
import { Mail, Lock } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const meta = {
  title: "ui/Input",
  component: Input,
  tags: ["autodocs"],
  argTypes: {},
};
export default meta;

export const Default = {
  render: (args: any) => <Input {...args} />,
  args: {
    type: "email",
    placeholder: "Email",
  },
};

export const WithError = {
  render: (args: any) => (
    <div className="grid w-full max-w-sm items-center gap-1.5 pt-4">
      <Input {...args} />
    </div>
  ),
  args: {
    type: "email",
    placeholder: "yourname@chmsu.edu.ph",
    defaultValue: "invalid-email@",
    error: "Invalid email format",
  },
};

export const WithStartIcon = {
  render: (args: any) => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Input {...args} startIcon={<Mail size={16} />} />
    </div>
  ),
  args: {
    type: "email",
    placeholder: "Campus Email",
  },
};

export const WithErrorAndIcon = {
  render: (args: any) => (
    <div className="grid w-full max-w-sm items-center gap-1.5 pt-4">
      <Input {...args} startIcon={<Lock size={16} />} />
    </div>
  ),
  args: {
    type: "password",
    placeholder: "Password",
    defaultValue: "123",
    error: "Password must be at least 8 characters",
  },
};

export const Disabled = {
  render: (args: any) => <Input disabled {...args} />,
  args: { ...Default.args },
};

export const WithLabel = {
  render: (args: any) => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">{args.placeholder}</Label>
      <Input {...args} id="email" />
    </div>
  ),
  args: { ...Default.args },
};

export const WithText = {
  render: (args: any) => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email-2">{args.placeholder}</Label>
      <Input {...args} id="email-2" />
      <p className="text-sm text-slate-500">Enter your email address.</p>
    </div>
  ),
  args: { ...Default.args },
};

export const WithButton = {
  render: (args: any) => (
    <div className="flex w-full max-w-sm items-center space-x-2">
      <Input {...args} />
      <Button type="submit">Subscribe</Button>
    </div>
  ),
  args: { ...Default.args },
};
