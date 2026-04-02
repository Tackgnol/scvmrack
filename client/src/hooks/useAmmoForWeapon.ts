import { useCharacter } from '@/CharacterContext/CharacterContext';
import { type EquipmentItem } from '@/hooks/models';
import { useMemo } from 'react';

type AmmoInfo = {
    ammoCount: number | null;
    ammoType: string | null;
    equipmentIndex: number | null;
};

const NO_AMMO: AmmoInfo = { ammoCount: null, ammoType: null, equipmentIndex: null };

export function useAmmoForWeapon(weapon: EquipmentItem | null): AmmoInfo {
    const { character } = useCharacter();
    const equipment = character?.equipment;

    return useMemo(() => {
        if (!weapon?.ammoType || weapon.ammoType === 'Infinite') {
            return NO_AMMO;
        }

        const targetType = weapon.ammoType;

        if (!equipment || equipment.length === 0) {
            return { ammoCount: 0, ammoType: targetType, equipmentIndex: null };
        }

        // Sum amount across all inventory slots matching this ammo type
        let total = 0;
        let firstIndex: number | null = null;
        for (let i = 0; i < equipment.length; i++) {
            const item = equipment[i];
            if (item.ammoType === targetType && item.tags?.includes('ammo')) {
                if (firstIndex === null) firstIndex = i;
                total += 1;
            }
        }

        return {
            ammoCount: total,
            ammoType: targetType,
            equipmentIndex: firstIndex,
        };
    }, [weapon?.ammoType, equipment]);
}
