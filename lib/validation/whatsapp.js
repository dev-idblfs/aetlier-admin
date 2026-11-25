import { z } from 'zod';

const httpsUrl = z.string().refine((value) => !value || /^https:\/\//.test(value), 'Use a public HTTPS URL');

export const whatsappMessageSchema = z.object({
  template_name: z.string().regex(/^[a-z0-9_]{1,100}$/, 'Choose an approved template'),
  language: z.string().regex(/^[a-zA-Z_]{2,12}$/, 'Enter a template language, such as en'),
  parameters: z.string().transform((value) => value ? value.split('\n').map((line) => line.trim()) : [])
    .pipe(z.array(z.string().max(1000)).max(20)),
  image_url: httpsUrl.transform((value) => value || null),
  button_url: httpsUrl.transform((value) => value || null),
  delay_hours: z.coerce.number().int().min(0).max(360),
});

export const whatsappWorkflowSchema = z.object({
  name: z.string().trim().min(1, 'Enter a workflow name').max(120),
  kind: z.enum(['lead', 'review']),
  steps: z.array(whatsappMessageSchema).min(1).max(8),
}).refine((value) => value.steps.every((step, i) => !i || step.delay_hours > value.steps[i - 1].delay_hours), {
  path: ['steps'], message: 'Use distinct, increasing delays from enrollment',
});

export const whatsappCampaignSchema = z.object({
  name: z.string().trim().min(1, 'Enter a campaign name').max(120),
  audience: z.object({
    kind: z.enum(['leads', 'patients']),
    lead_statuses: z.array(z.enum(['NEW', 'CONTACTED', 'QUALIFIED'])).min(1),
  }),
  message: whatsappMessageSchema,
});

export const whatsappScheduleSchema = z.object({
  scheduled_at: z.string().min(1, 'Choose a date and time').refine((value) => {
    const time = new Date(value).getTime();
    return Number.isFinite(time) && time >= Date.now() - 60000 && time <= Date.now() + 90 * 86400000;
  }, 'Choose a time between now and 90 days ahead'),
});

export const whatsappReplySchema = z.object({ text: z.string().trim().min(1, 'Enter a reply').max(4096) });
export const whatsappConnectionSchema = z.object({
  app_id: z.string().regex(/^\d{5,30}$/, 'Enter a numeric Meta app ID'),
  config_id: z.string().regex(/^\d{5,30}$/, 'Enter a numeric Embedded Signup configuration ID'),
});

export function blankMessage(delay_hours = 0) {
  return { template_name: '', language: 'en', parameters: '{first_name}', image_url: '', button_url: '', delay_hours };
}

export function messageToForm(message) {
  return { ...blankMessage(), ...message, parameters: (message.parameters || []).join('\n'),
    image_url: message.image_url || '', button_url: message.button_url || '' };
}
