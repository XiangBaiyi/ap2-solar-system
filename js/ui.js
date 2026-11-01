import {updateAngles} from './scene.js';
import {toggleProj} from './camera.js';

let speed1 = 1;
let speed2 = 1;
let tiltVal = 23.5;

const orbitSpeedInput = document.getElementById('orbitSpeed');
const spinSpeedInput = document.getElementById('spinSpeed');
const tiltInput = document.getElementById('earthTilt');
const showOrbitCheckbox = document.getElementById('showOrbit');

orbitSpeedInput.addEventListener('input', (e)=>{
    speed1 = parseFloat(e.target.value);
});
spinSpeedInput.addEventListener('input', (e)=>{
    speed2 = parseFloat(e.target.value);
});
tiltInput.addEventListener('input', (e)=>{
    tiltVal = parseFloat(e.target.value);
});

window.addEventListener('keydown', (e)=>{
    if(e.key.toLowerCase() === 'o'){
        toggleProj();
    }
});

function updateUI(){
    updateAngles(speed1, speed2, tiltVal);
}
function showOrbitLines(){
    return showOrbitCheckbox.checked;
}

export {updateUI, showOrbitLines};