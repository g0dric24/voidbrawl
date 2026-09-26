import { addAfterEffect } from '@react-three/fiber';
import { leadPoint, SHIP_CLASSES, type ShipClassId, type TeamId, vec3 } from '@voidbrawl/shared';
import type { World } from 'koota';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { LocalPlayer, Pilot, Remote, RemotePose, Vital } from '../ecs/traits';
import { world } from '../ecs/world';
import { sceneCamera } from '../scene-camera';
import { TEAM_COLORS } from '../team-colors';
import { viewPose } from '../view-pose';
import { type ScreenPoint, toScreen } from './marker-math';

const SLOTS = 8;
const EDGE_MARGIN = 48;

interface Slot {
    root: HTMLDivElement | null;
    name: HTMLSpanElement | null;
    distance: HTMLSpanElement | null;
    lead: HTMLDivElement | null;
}

const _sp: ScreenPoint = { x: 0, y: 0, onScreen: false, angle: 0 };
const _lead = vec3();
const _leadV = new THREE.Vector3();

function myGun( w: World ): { team: TeamId; speed: number } | null {
    const pilot = w.queryFirst( LocalPlayer, Pilot )?.get( Pilot );
    if ( ! pilot ) return null;
    const along = viewPose.velocity.dot( viewPose.forward );
    return { team: pilot.team, speed: SHIP_CLASSES[ pilot.classId ].gun.boltSpeed + Math.max( 0, along ) };
}

function hide( slot: Slot ): void {
    if ( slot.root ) slot.root.dataset.state = 'hidden';
    if ( slot.lead ) slot.lead.dataset.state = 'hidden';
}

interface LeadInput {
    camera: THREE.PerspectiveCamera;
    pose: { position: THREE.Vector3; velocity: THREE.Vector3 };
    speed: number;
    color: string;
    w: number;
    h: number;
}

function paintLead( slot: Slot, { camera, pose, speed, color, w, h }: LeadInput ) {
    const lead = slot.lead;
    if ( ! lead ) return;
    lead.style.setProperty( '--team', color );
    if ( ! leadPoint( viewPose.position, pose.position, pose.velocity, speed, _lead ) ) {
        lead.dataset.state = 'hidden';
        return;
    }
    toScreen( _leadV.set( _lead.x, _lead.y, _lead.z ), camera, w, h, EDGE_MARGIN, _sp );
    lead.dataset.state = _sp.onScreen ? 'shown' : 'hidden';
    lead.style.setProperty( '--x', `${ _sp.x }px` );
    lead.style.setProperty( '--y', `${ _sp.y }px` );
}

interface ShipView {
    pilot: { team: TeamId; name: string; classId: ShipClassId };
    pose: { position: THREE.Vector3; velocity: THREE.Vector3 };
}

function paintBracket( root: HTMLDivElement, enemy: boolean, team: TeamId ): void {
    root.dataset.state = _sp.onScreen ? 'shown' : enemy ? 'edge' : 'hidden';
    root.dataset.enemy = String( enemy );
    root.style.setProperty( '--x', `${ _sp.x }px` );
    root.style.setProperty( '--y', `${ _sp.y }px` );
    root.style.setProperty( '--angle', `${ _sp.angle }rad` );
    root.style.setProperty( '--team', TEAM_COLORS[ team ] );
}

function paintLabel( slot: Slot, ship: ShipView ): void {
    if ( slot.name && slot.name.textContent !== ship.pilot.name ) slot.name.textContent = ship.pilot.name;
    if ( slot.distance ) {
        const range = Math.round( ship.pose.position.distanceTo( viewPose.position ) );
        slot.distance.textContent = `${ range }u · ${ SHIP_CLASSES[ ship.pilot.classId ].name }`;
    }
}

function paintSlot( slot: Slot, ship: ShipView, lead: Omit< LeadInput, 'pose' | 'color' > & { team: TeamId } ): void {
    const root = slot.root;
    if ( ! root ) return;
    const enemy = ship.pilot.team !== lead.team;
    toScreen( ship.pose.position, lead.camera, lead.w, lead.h, EDGE_MARGIN, _sp );
    paintBracket( root, enemy, ship.pilot.team );
    paintLabel( slot, ship );
    if ( enemy && _sp.onScreen ) {
        paintLead( slot, { ...lead, pose: ship.pose, color: TEAM_COLORS[ ship.pilot.team ] } );
    } else if ( slot.lead ) slot.lead.dataset.state = 'hidden';
}

function paint( slots: Slot[] ): void {
    const camera = sceneCamera.current;
    const me = myGun( world );
    if ( ! camera || ! me ) return;
    const lead = { camera, speed: me.speed, team: me.team, w: window.innerWidth, h: window.innerHeight };
    let i = 0;
    world.query( Remote, Pilot, RemotePose, Vital ).readEach( ( [ pilot, pose, vital ] ) => {
        const slot = slots[ i++ ];
        if ( ! slot ) return;
        if ( ! pose.ready || vital.dead ) hide( slot );
        else paintSlot( slot, { pilot, pose }, lead );
    } );
    for ( ; i < slots.length; i++ ) hide( slots[ i ] );
}

export function ShipMarkers() {
    const slots = useRef< Slot[] >(
        Array.from( { length: SLOTS }, () => ( { root: null, name: null, distance: null, lead: null } ) ),
    );

    // JUSTIFIED EFFECT — brackets a post-render subscription to R3F's frame loop, an outside-React system, to this mount.
    useEffect( () => addAfterEffect( () => paint( slots.current ) ), [] );

    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
            { slots.current.map( ( slot, index ) => (
                <div key={ index } className="contents">
                    <div
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
                    <div
                        ref={ ( el ) => {
                            slot.lead = el;
                        } }
                        data-state="hidden"
                        className="absolute top-0 left-0 size-3 translate-x-[calc(var(--x)-50%)] translate-y-[calc(var(--y)-50%)] rounded-full border-2 border-(--team) data-[state=hidden]:hidden [--team:#fff] [--x:-100px] [--y:-100px]"
                    />
                </div>
            ) ) }
        </div>
    );
}
