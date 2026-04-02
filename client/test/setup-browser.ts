import { loadLanguage } from '@/i18n';
import { beforeAll } from 'vitest';

beforeAll(async () => {
  await loadLanguage('en');
});
