import assert from 'node:assert/strict';
import test from 'node:test';

import type { CharacterResponse } from '../../src/hooks/models.ts';
import { buildRequestFromPatches } from '../../src/hooks/patchToRequest.ts';

test('buildRequestFromPatches includes equipment and equippedArmor for equip-armor', () => {
  const currentCharacter: CharacterResponse = {
    equipment: [{ key: 'helm', name: 'Helmet' }],
    equippedArmor: { key: 'mail', name: 'Mail Shirt' },
  };

  const result = buildRequestFromPatches(
    [{ kind: 'equip-armor', equipmentIndex: 0 }],
    currentCharacter
  );

  assert.deepEqual(result, {
    equipment: currentCharacter.equipment,
    equippedArmor: currentCharacter.equippedArmor,
  });
});

test('buildRequestFromPatches includes equipment and equippedArmor for unequip-armor', () => {
  const currentCharacter: CharacterResponse = {
    equipment: [{ key: 'rags', name: 'Rags' }],
    equippedArmor: null,
  };

  const result = buildRequestFromPatches(
    [{ kind: 'unequip-armor' }],
    currentCharacter
  );

  assert.deepEqual(result, {
    equipment: currentCharacter.equipment,
    equippedArmor: currentCharacter.equippedArmor,
  });
});
