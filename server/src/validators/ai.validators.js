const { z } = require('zod');

const aiSuggestSchema = z.strictObject({
  symptoms: z
    .string()
    .trim()
    .min(5, 'Describe your symptoms in at least 5 characters')
    .max(500, 'Keep the description under 500 characters'),
});

module.exports = { aiSuggestSchema };