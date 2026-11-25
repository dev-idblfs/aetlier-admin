'use client';

import { useWatch } from 'react-hook-form';
import { SelectItem } from '@/lib/heroui';
import { FormInput, FormSelect, FormTextarea } from '@/components/ui';

export default function MessageFields({ prefix, templates, showDelay = false }) {
  const name = useWatch({ name: `${prefix}.template_name` });
  const language = useWatch({ name: `${prefix}.language` });
  const selected = templates.find((item) => item.name === name && item.language === language);
  const body = selected?.components?.find((component) => component.type === 'BODY')?.text;
  const names = [...new Set(templates.filter((t) => t.status === 'APPROVED').map((t) => t.name))];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormSelect name={`${prefix}.template_name`} label="Approved template" placeholder="Choose a template">
          {names.map((value) => <SelectItem key={value}>{value}</SelectItem>)}
        </FormSelect>
        <FormInput name={`${prefix}.language`} label="Language" description="Must match the approved language, such as en or en_US" />
      </div>
      {body && <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm whitespace-pre-wrap break-words">{body}</div>}
      <FormTextarea name={`${prefix}.parameters`} label="Body parameter values" minRows={3}
        description="One value per line, in numbered placeholder order. Use {first_name} or {name} for personalization. A review link can be a value." />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormInput name={`${prefix}.image_url`} label="Image URL (image templates only)" placeholder="https://…" />
        <FormInput name={`${prefix}.button_url`} label="Button URL (dynamic URL templates only)" placeholder="https://…" />
      </div>
      {showDelay && <FormInput name={`${prefix}.delay_hours`} label="Hours after enrollment" type="number"
        description="Measured from lead creation or appointment completion; maximum 360 hours (15 days)." />}
    </div>
  );
}
