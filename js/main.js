import { gl, canvas, sun, earth, moon, getSunMatrix, getEarthMatrix, getMoonMatrix } from './scene.js';
import { getViewMatrix, getProjection, toggleProj, updateCameraAuto } from './camera.js';
import { updateUI, showOrbitLines } from './ui.js';

// ====== 着色器源码 ======
const vsSource = `#version 300 es
in vec4 aPosition;
in vec2 aTexCoord;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProj;
out vec2 vTexCoord;
void main() {
    gl_Position = uProj * uView * uModel * aPosition;
    vTexCoord = aTexCoord;
}`;

const fsSource = `#version 300 es
precision highp float;
in vec2 vTexCoord;
uniform sampler2D uTexture;
out vec4 fragColor;
void main() {
    fragColor = texture(uTexture, vTexCoord);
}`;

// ====== 编译着色器 ======
function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('着色器编译错误:', gl.getShaderInfoLog(shader));
    }
    return shader;
}

let program;
function initProgram() {
    const vs = compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('着色器链接错误:', gl.getProgramInfoLog(program));
    }
    gl.useProgram(program);
}

// ====== 创建球体VAO ======
function createSphereVAO(sphere) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // 位置缓冲
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere.positions), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'aPosition');
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(posLoc);

    // 纹理坐标缓冲
    const texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere.texCoords), gl.STATIC_DRAW);
    const texLoc = gl.getAttribLocation(program, 'aTexCoord');
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texLoc);

    // 索引缓冲
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphere.indices), gl.STATIC_DRAW);

    gl.bindVertexArray(null);
    return { vao, count: sphere.indices.length };
}

// ====== 加载纹理 ======
function loadTexture(url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // 占位纹理（1x1 像素）
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 200, 100, 255]));

    const image = new Image();
    image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };
    image.src = url;
    return texture;
}

// ====== 绘制轨道线 ======
function drawOrbit(radius) {
    const points = [];
    for (let i = 0; i <= 64; i++) {
        const angle = i * Math.PI * 2 / 64;
        points.push(radius * Math.cos(angle), 0, radius * Math.sin(angle));
    }
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'aPosition');
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(posLoc);
    gl.drawArrays(gl.LINE_LOOP, 0, 65);
}

// ====== 主初始化和渲染循环 ======
let sunVAO, earthVAO, moonVAO;
let sunTex, earthTex, moonTex;

function init() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.05, 0.05, 0.1, 1);

    initProgram();

    sunVAO = createSphereVAO(sun);
    earthVAO = createSphereVAO(earth);
    moonVAO = createSphereVAO(moon);

    sunTex = loadTexture('textures/sun.jpg');
    earthTex = loadTexture('textures/earth.jpg');
    moonTex = loadTexture('textures/moon.jpg');
}

function drawSphere(vao, texture, modelMatrix) {
    gl.bindVertexArray(vao.vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(gl.getUniformLocation(program, 'uTexture'), 0);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uModel'), false, new Float32Array(modelMatrix));
    gl.drawElements(gl.TRIANGLES, vao.count, gl.UNSIGNED_SHORT, 0);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const view = getViewMatrix();
    const proj = getProjection();

    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uView'), false, new Float32Array(view));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uProj'), false, new Float32Array(proj));

    // 绘制太阳、地球、月球
    drawSphere(sunVAO, sunTex, getSunMatrix());
    drawSphere(earthVAO, earthTex, getEarthMatrix());
    drawSphere(moonVAO, moonTex, getMoonMatrix());

    // 绘制轨道线
    if (showOrbitLines()) {
        gl.bindVertexArray(null);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uModel'), false, new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]));
        gl.depthMask(false);
        drawOrbit(3.5);  // 地球轨道
        drawOrbit(1.2);  // 月球轨道
        gl.depthMask(true);
    }
}

function loop() {
    updateUI();
    updateCameraAuto();   //新增这一行！自动环绕更新
    render();
    requestAnimationFrame(loop);
}

init();
loop();