import "/style/reset.css";

import "/style/index.css";

import * as three from "three";

import gsap from "gsap";

import texture_url from "/static/3.jpg";

/* ------------------------------------------------------------------------------------------------------ */
/* Html */
const canvas = document.createElement( "canvas" );

document.body.append( canvas );

const h1s = [ "TOURS", "CONE", "TORUSKONT" ].map( item => {

    const section = document.createElement( "section" );
    const h1 = document.createElement( "h1" );

    h1.textContent = item;
    section.append( h1 );
    document.body.append( section );

    return h1;

} );

/* ------------------------------------------------------------------------------------------------------ */
/* Renderer */
const renderer = new three.WebGLRenderer( {
    canvas,
    alpha: true,
    antialias: globalThis.devicePixelRatio < 2,
} );

renderer.setSize( globalThis.innerWidth, globalThis.innerHeight );
renderer.setPixelRatio( Math.min( globalThis.devicePixelRatio, 2 ) );

document.body.append( renderer.domElement );

/* Scene */
const scene = new three.Scene();

/* Camera */
const camera_group = new three.Group();
const aspect_ratio = globalThis.innerWidth / globalThis.innerHeight;
const camera = new three.OrthographicCamera( - 2.5 * aspect_ratio, 2.5 * aspect_ratio, 2.5, - 2.5, 0.1, 100 );

camera.position.z = 5;
camera_group.add(camera);
scene.add(camera_group);

/* Mesh */
// Texture
const loader = new three.TextureLoader();
const texture = loader.load( texture_url );
texture.minFilter = three.NearestFilter;
texture.magFilter = three.NearestFilter;

// Material
const material = new three.MeshToonMaterial( { gradientMap: texture, depthTest: false } );

//
const meshs = [];
const spacing = 5;

// Torus
const torus = new three.Mesh( new three.TorusGeometry( 0.7, 0.26, 64, 128 ), material );

torus.position.x = camera.right * 0.8;
torus.renderOrder = 1;
meshs.push( torus );
scene.add( torus );

// Cone
const cone = new three.Mesh( new three.ConeGeometry( 0.7, 1.4, 128 ), material );

cone.position.x = camera.right * 0.8;
cone.position.y = - spacing;
cone.renderOrder = 1;
meshs.push( cone );
scene.add( cone );

// Torusknot
const torusknot = new three.Mesh( new three.TorusKnotGeometry( 0.56, 0.25, 256, 64 ), material );

torusknot.position.x = camera.right * 0.8;
torusknot.position.y = - spacing * 2;
torusknot.renderOrder = 1;
meshs.push( torusknot );
scene.add( torusknot )

/* Particle */
// Geometry
const count = 10000;
const positions = new Float32Array( count * 3 );

for ( let i = 0; i < count; i ++ ) {

    positions[ i * 3 + 0 ] = ( Math.random() - 0.5 ) * ( camera.right - camera.left + 2 );
    positions[ i * 3 + 1 ] = - Math.random() * ( meshs.length * spacing + 2 ) + spacing * 0.5 + 1;
    positions[ i * 3 + 2 ] = ( Math.random() - 0.5 ) * 10;

}

const geometry_particle = new three.BufferGeometry();

geometry_particle.setAttribute( "position", new three.BufferAttribute( positions, 3 ) );

// Material
const material_particle = new three.PointsMaterial( { size: 1, sizeAttenuation: false } );

// Point
const particle = new three.Points( geometry_particle, material_particle );

scene.add( particle );

/* Light */
const light = new three.DirectionalLight();

light.position.set( 1, 1, 0 );
scene.add( light );

/* Scroll */
let previous_mesh = 0;

globalThis.addEventListener( "scroll", _ => {

    const scroll = globalThis.scrollY / globalThis.innerHeight; // [0, ...]

    camera_group.position.y = - scroll * spacing;

    const current_mesh = Math.round(scroll);

    if (current_mesh === previous_mesh) return;

    previous_mesh = current_mesh;

    gsap.to( meshs[ current_mesh ].rotation, {
        duration: 1.4,
        ease: "power.inOut",
        x: "+=6",
        y: "+=3",
        z: "+=1.5"
    } );

} );

/* Move */
const cursor = { x: 0, y: 0 };

globalThis.addEventListener( "mousemove", event => {

    cursor.x = event.clientX / ( globalThis.innerWidth - 1 ) - 0.5;      // [-0.5, 0.5]
    cursor.y = 1 - event.clientY / ( globalThis.innerHeight - 1 ) - 0.5; // [-0.5, 0.5]

} );

/* Resize */
locateH1();
locateMesh();

globalThis.addEventListener( "resize", _ => {

    const aspect_ratio = globalThis.innerWidth / globalThis.innerHeight;

    // Relocate UI
    relocateH1();

    // Relocate mesh
    relocateMesh();

    // Relocate particle
    relocateParticle();

    //
    camera.left = - 2.5 * aspect_ratio;
    camera.right = 2.5 * aspect_ratio;
    camera.updateProjectionMatrix();

    //
    renderer.setSize( globalThis.innerWidth, globalThis.innerHeight );
    renderer.setPixelRatio( Math.min( globalThis.devicePixelRatio, 2 ) );
    renderer.render( scene, camera );

} );

function locateH1() {

    h1s.forEach( h1 => h1.style.display = "block" );

    relocateH1();

}

function relocateH1() {

    if ( aspect_ratio <= 1 ) {

        h1s.forEach( h1 => {

            h1.style.top = "10%";
            h1.style.left = "50%";
            h1.style.transform = "translate(-50%, 0)";

        } );

        return;

    }

    h1s.forEach( h1 => {

        h1.style.top = "50%";
        h1.style.left = "15%";
        h1.style.transform = "translate(0, -50%)";

    } );

    return;

}

function locateMesh() {

    relocateMesh();

}

function relocateMesh() {

    if ( aspect_ratio <= 1 ) {

        meshs.forEach( mesh => mesh.position.x = 0 );

        return;

    }

    meshs.forEach( mesh => mesh.position.x = aspect_ratio * camera.top * 0.5 );

    return;

}

function relocateParticle() {

    const attribute = particle.geometry.getAttribute( "position" );
    const array = attribute.array;

    array.forEach( ( item, index ) => {

        if ( index % 3 !== 0 ) return;

        array[ index ] = ( Math.random() - 0.5 ) * ( 5 * aspect_ratio + 2 );

    });

    attribute.needsUpdate = true;

}

/* Render */
const clock = new three.Clock();

renderer.setAnimationLoop( function loop() {

    const delta_time = clock.getDelta();

    // Rotation
    meshs.forEach( mesh => {

        mesh.rotation.x += delta_time * 0.1;
        mesh.rotation.y += delta_time * 0.12;

    } );

    // Move
    const offset_amplitude = 0.5;  // 偏移的振幅
    const speed_amplitude = 0.1;   // 速度的振幅
    const eliminate_the_effect_of_the_frame_rate = delta_time * 60;

    camera.position.x += ( cursor.x * offset_amplitude - camera.position.x ) * speed_amplitude * eliminate_the_effect_of_the_frame_rate;
    camera.position.y += ( cursor.y * offset_amplitude - camera.position.y ) * speed_amplitude * eliminate_the_effect_of_the_frame_rate;

    renderer.render( scene, camera );

} );
