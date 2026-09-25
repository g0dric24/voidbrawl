import { DEFAULT_CLASS, emptyShip, type ShipClassId, type TeamId } from '@voidbrawl/shared';
import { trait } from 'koota';

export const Sim = trait( () => emptyShip() );

export const Prev = trait( () => ( { x: 0, y: 0, z: 0, qx: 0, qy: 0, qz: 0, qw: 1 } ) );

export const Pilot = trait( { classId: DEFAULT_CLASS as ShipClassId, team: 0 as TeamId } );

export const LocalPlayer = trait();
