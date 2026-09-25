import * as THREE from 'three';

export interface RimUniforms {
    uRimColor: { value: THREE.Color };
    uRimPower: { value: number };
    uRimStrength: { value: number };
    uBodyGlow: { value: number };
}

export function rimUniforms( color: string ): RimUniforms {
    return {
        uRimColor: { value: new THREE.Color( color ) },
        uRimPower: { value: 3 },
        uRimStrength: { value: 2 },
        uBodyGlow: { value: 0 },
    };
}

const RIM_HEAD = `
uniform vec3 uRimColor;
uniform float uRimPower;
uniform float uRimStrength;
uniform float uBodyGlow;
`;

const RIM_EMISSIVE = `
#include <emissivemap_fragment>
float rimK = pow( 1.0 - clamp( dot( normal, normalize( vViewPosition ) ), 0.0, 1.0 ), uRimPower );
totalEmissiveRadiance += uRimColor * rimK * uRimStrength + diffuseColor.rgb * uBodyGlow;
`;

function withRim( source: THREE.Material, uniforms: RimUniforms ): THREE.Material {
    const material = source.clone();
    if ( ! ( material instanceof THREE.MeshStandardMaterial ) ) return material;
    material.onBeforeCompile = ( shader ) => {
        Object.assign( shader.uniforms, uniforms );
        shader.fragmentShader =
            RIM_HEAD + shader.fragmentShader.replace( '#include <emissivemap_fragment>', RIM_EMISSIVE );
    };
    material.customProgramCacheKey = () => 'voidbrawl-ship-rim';
    return material;
}

export function rimmedClone( scene: THREE.Object3D, uniforms: RimUniforms ): THREE.Object3D {
    const root = scene.clone( true );
    root.traverse( ( o ) => {
        const mesh = o as THREE.Mesh;
        if ( ! mesh.isMesh ) return;
        mesh.material = Array.isArray( mesh.material )
            ? mesh.material.map( ( m ) => withRim( m, uniforms ) )
            : withRim( mesh.material, uniforms );
    } );
    return root;
}

export function disposeMaterials( root: THREE.Object3D ): void {
    root.traverse( ( o ) => {
        const mesh = o as THREE.Mesh;
        if ( ! mesh.isMesh ) return;
        for ( const m of Array.isArray( mesh.material ) ? mesh.material : [ mesh.material ] ) m.dispose();
    } );
}
