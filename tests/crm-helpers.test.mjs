import test from 'node:test';
import assert from 'node:assert/strict';
import { pkrToPaisa, formatPkr } from '../lib/crm-format.ts';
import { buildWaUrl, formatPhonePk } from '../lib/whatsapp.ts';

test('PKR parsing preserves exact paisa and rejects extra decimals', () => {
  assert.equal(pkrToPaisa('1,250.50'), 125050);
  assert.equal(pkrToPaisa('0.01'), 1);
  assert.equal(pkrToPaisa('12.345'), null);
  assert.equal(formatPkr(125050), 'Rs 1,250.50');
});

test('WhatsApp URL encodes Roman Urdu, emoji, ampersand, and newline', () => {
  const message = 'Assalam o alaikum 😊 & shukriya\nKal miltay hain';
  const url = buildWaUrl('+92 300 1234567', message);
  assert.equal(url, `https://wa.me/923001234567?text=${encodeURIComponent(message)}`);
  assert.equal(formatPhonePk('+923001234567'), '+92 300 1234567');
  assert.throws(() => buildWaUrl('03001234567', message));
});
