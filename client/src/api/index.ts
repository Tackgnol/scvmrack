import createQueryClient from 'openapi-react-query';
import { api } from './client';
import { paths } from "./schema";

export const $api = createQueryClient(api);
export { api };
export type { paths, components } from './schema';

export type Character = NonNullable<
    paths['/characters/{id}']['get']['responses']['200']['content']['application/json']
>;

/** CharacterUpdate - allowed fields for PATCH /characters/{id} */
export type CharacterUpdate = NonNullable<
    paths['/characters/{id}']['patch']['requestBody']
>['content']['application/json'];

/** Equipment item */
export type EquipmentItem = NonNullable<Character['equipment']>[number];

/** Weapon item */
export type WeaponItem = NonNullable<Character['equipped_weapons']>[number];

/** Armor item */
export type ArmorItem = NonNullable<Character['equipped_armor']>;

/** Ability */
export type Ability = NonNullable<Character['abilities']>[number];

/** API Error response */
export type ApiError = {
    error?: string;
};
