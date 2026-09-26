import { addAfterEffect } from '@react-three/fiber';
import { SHIP_CLASSES, type ShipClassId, type TeamId } from '@voidbrawl/shared';
import { useEffect, useRef } from 'react';
import type * as THREE from 'three';
import { activeArena } from '../../net/active-arena';
import { LocalPlayer, NetId, Pilot, Remote, RemotePose, Vital } from '../ecs/traits';
import { world } from '../ecs/world';
import { recentAttackers } from '../fx/fx-store';
import { rockBetween } from '../line-of-sight';
import { sceneCamera } from '../scene-camera';
import { TEAM_COLORS } from '../team-colors';
import { viewPose } from '../view-pose';
import { type ScreenPoint, toScreen } from './marker-math';

const SLOTS = 8;
const EDGE_MARGIN = 48;
const NEAR_RANGE = 400;
const ATTACKER_MEMORY_MS = 3000;

interface Slot {
    root: HTMLDivElement | null;
    name: HTMLSpanElement | null;
    distance: HTMLSpanElement | null;
}

interface View {
    camera: THREE.PerspectiveCamera;
    team: TeamId;
    w: number;
    h: number;
}

interface ShipView {
    id: string;
    pilot: { team: TeamId; name: string; classId: ShipClassId };
    pose: { position: THREE.Vector3 };
}

const _sp: ScreenPoint = { x: 0, y: 0, onScreen: false, angle: 0 };

function myTeam(): TeamId | null {
    return world.queryFirst( LocalPlayer, Pilot )?.get( Pilot )?.team ?? null;
}

function hide( slot: Slot ): void {
    if ( slot.root ) slot.root.dataset.state = 'hidden';
}

function attackedRecently( id: string ): boolean {
    return performance.now() - ( recentAttackers.get( id ) ?? Number.NEGATIVE_INFINITY ) < ATTACKER_MEMORY_MS;
}

function enemyShown( ship: ShipView, camera: THREE.PerspectiveCamera ): boolean {
    if ( _sp.onScreen ) {
        const arena = activeArena();
        return ! arena || ! rockBetween( camera.position, ship.pose.position, arena );
    }
    return ship.pose.position.distanceTo( viewPose.position ) <= NEAR_RANGE || attackedRecently( ship.id );
}

function paintBracket( root: HTMLDivElement, enemy: boolean, team: TeamId ): void {
    root.dataset.state = _sp.onScreen ? 'shown' : enemy ? 'edge' : 'hidden';
    root.dataset.enemy = String( enemy );
    root.style.setProperty( '--x', `${ _sp.x }px` );
    root.style.setProperty( '--y', `${ _sp.y }px` );
    root.style.setProperty( '--angle', `${ _sp.angle }rad` );
    root.style.setProperty( '--team', TEAM_COLORS[ team ] );
}

function paintLabel( slot: Slot, ship: ShipView, enemy: boolean ): void {
    if ( slot.name && slot.name.textContent !== ship.pilot.name ) slot.name.textContent = ship.pilot.name;
    if ( ! slot.distance ) return;
    const range = Math.round( ship.pose.position.distanceTo( viewPose.position ) );
    const kind = SHIP_CLASSES[ ship.pilot.classId ].name;
    slot.distance.textContent = ! enemy || range <= NEAR_RANGE ? `${ range }u · ${ kind }` : kind;
}

function paintSlot( slot: Slot, ship: ShipView, view: View ): void {
    const root = slot.root;
    if ( ! root ) return;
    const enemy = ship.pilot.team !== view.team;
    toScreen( ship.pose.position, view.camera, view.w, view.h, EDGE_MARGIN, _sp );
    if ( enemy && ! enemyShown( ship, view.camera ) ) {
        hide( slot );
        return;
    }
    paintBracket( root, enemy, ship.pilot.team );
    paintLabel( slot, ship, enemy );
}

function paint( slots: Slot[] ): void {
    const camera = sceneCamera.current;
    const team = myTeam();
    if ( ! camera || team === null ) return;
    const view = { camera, team, w: window.innerWidth, h: window.innerHeight };
    let i = 0;
    world.query( Remote, Pilot, RemotePose, Vital, NetId ).readEach( ( [ pilot, pose, vital, net ] ) => {
        const slot = slots[ i++ ];
        if ( ! slot ) return;
        if ( ! pose.ready || vital.dead ) hide( slot );
        else paintSlot( slot, { id: net.sessionId, pilot, pose }, view );
    } );
    for ( ; i < slots.length; i++ ) hide( slots[ i ] );
}

export function ShipMarkers() {
    const slots = useRef< Slot[] >(
        Array.from( { length: SLOTS }, () => ( { root: null, name: null, distance: null } ) ),
    );

    // JUSTIFIED EFFECT — brackets a post-render subscription to R3F's frame loop, an outside-React system, to this mount.
    useEffect( () => addAfterEffect( () => paint( slots.current ) ), [] );

    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
            { slots.current.map( ( slot, index ) => (
                <div
                    key={ index }
                    ref={ ( el ) => {
                        slot.root = el;
                    } }
                    data-state="hidden"
                    className="group absolute top-0 left-0 translate-x-[calc(var(--x)-50%)] translate-y-[calc(var(--y)-50%)] text-(--team) data-[state=hidden]:hidden [--angle:0rad] [--team:#fff] [--x:-100px] [--y:-100px]"
                >
                    <div className="relative size-10 group-data-[state=edge]:hidden group-data-[enemy=false]:size-6 group-data-[enemy=false]:opacity-70">
                        <div className="absolute top-0 left-0 size-3 border-t-2 border-l-2 border-current" />
                        <div className="absolute top-0 right-0 size-3 border-t-2 border-r-2 border-current" />
                        <div className="absolute bottom-0 left-0 size-3 border-b-2 border-l-2 border-current" />
                        <div className="absolute right-0 bottom-0 size-3 border-r-2 border-b-2 border-current" />
                        <div className="absolute top-full left-1/2 mt-1 flex -translate-x-1/2 flex-col items-center font-readout text-[11px] leading-tight font-semibold tracking-[0.12em] whitespace-nowrap text-shadow-readout">
                            <span
                                ref={ ( el ) => {
                                    slot.name = el;
                                } }
                            />
                            <span
                                ref={ ( el ) => {
                                    slot.distance = el;
                                } }
                                className="text-readout-dim"
                            />
                        </div>
                    </div>
                    <div className="hidden size-0 rotate-(--angle) border-y-[9px] border-l-[16px] border-y-transparent border-l-current group-data-[state=edge]:block" />
                </div>
            ) ) }
        </div>
    );
}
