import { gl, canvas, mat4Perspective, mat4Identity, mat4Multiply } from './scene.js';

let camAngleY = 0;
let camAngleX = 15;
let camDist = 10;
let drag = false;
let lastX, lastY;

// 自动漫游
let autoOrbit = true;   // 默认开启自动环绕
const autoSpeed = 0.15;

// 视图矩阵
function getViewMatrix(){
    // 自动漫游：只有 autoOrbit 为 true 才转动
    if(autoOrbit) {
        camAngleY += autoSpeed;
    }
    const rY = camAngleY * Math.PI / 180;
    const rX = camAngleX * Math.PI / 180;
    const sinY = Math.sin(rY), cosY = Math.cos(rY);
    const sinX = Math.sin(rX), cosX = Math.cos(rX);

    const eyeX = camDist * cosX * sinY;
    const eyeY = camDist * sinX;
    const eyeZ = camDist * cosX * cosY;
    return lookAt([eyeX, eyeY, eyeZ], [0,0,0], [0,1,0]);
}

function lookAt(eye, center, up){
    const z = normalize([eye[0]-center[0], eye[1]-center[1], eye[2]-center[2]]);
    const x = normalize(cross(up, z));
    const y = cross(z, x);
    return [
        x[0], y[0], z[0], 0,
        x[1], y[1], z[1], 0,
        x[2], y[2], z[2], 0,
        -dot(x,eye), -dot(y,eye), -dot(z,eye), 1
    ];
}
function normalize(v){
    const l = Math.hypot(v[0],v[1],v[2]);
    return [v[0]/l, v[1]/l, v[2]/l];
}
function cross(a,b){
    return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
}
function dot(a,b){
    return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
}

// 投影矩阵
function getProjMatrix(){
    return mat4Perspective(60, canvas.width/canvas.height, 0.1, 100);
}

// 鼠标拖拽旋转相机
canvas.addEventListener('mousedown', e=>{
    drag = true;
    lastX = e.clientX;
    lastY = e.clientY;
});
canvas.addEventListener('mouseup', ()=>drag=false);
canvas.addEventListener('mouseleave', ()=>drag=false);
canvas.addEventListener('mousemove', e=>{
    if(!drag) return;
    // 用户拖拽，打断自动漫游
    autoOrbit = false;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    camAngleY += dx * 0.4;
    camAngleX += dy * 0.4;
    camAngleX = Math.max(-80, Math.min(80, camAngleX));
    lastX = e.clientX;
    lastY = e.clientY;
});

// 滚轮缩放
canvas.addEventListener('wheel', e=>{
    e.preventDefault();
    camDist += e.deltaY * 0.005;
    camDist = Math.max(4, Math.min(20, camDist));
});

// 切换正交/透视标记
let useOrtho = false;
function toggleProj(){
    useOrtho = !useOrtho;
}
function getProjection(){
    if(useOrtho){
        const aspect = canvas.width / canvas.height;
        const s = 6;
        return [1/s/aspect,0,0,0, 0,1/s,0,0, 0,0,-0.01,0, 0,0,0,1];
    }else{
        return getProjMatrix();
    }
}

// 空格切换漫游暂停
window.addEventListener('keydown',e=>{
    if(e.key === ' '){
        e.preventDefault();
        autoOrbit = !autoOrbit;
    }
})

// 每一帧更新自动环绕，main.js每帧调用
function updateCameraAuto(){
    if(autoOrbit && !drag){
        camAngleY += autoSpeed;
    }
}

export { getViewMatrix, getProjection, toggleProj, updateCameraAuto };
// 空格切换自动漫游
window.addEventListener('keydown', (e) => {
    if(e.key === ' ') {
        e.preventDefault();
        autoOrbit = !autoOrbit;
    }
});