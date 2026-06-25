import i18n, { loadLanguage } from '@/i18n';
import { beforeAll, beforeEach } from 'vitest';

beforeAll(async () => {
  await loadLanguage('en');
});

beforeEach(async () => {
  await loadLanguage('en');
  await i18n.changeLanguage('en');
});
