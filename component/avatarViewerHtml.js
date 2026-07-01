// Three.js WebGL viewer — runs inside WebView as a self-contained HTML string.
// Extracted from screens/Avatar.jsx so the main component stays readable.
// Version 2.9.1: Framerate-independent temporal smoothing for ultra-smooth animations.
//
// Changes from v2.9.0:
//   - Converted hardcoded .slerp() blend factors into framerate-independent 
//     exponential smoothing using the actual clock delta time.
//   - Connected DEFAULT_SMOOTHING to the global translation loop.

const createViewerHtml = modelUris => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: transparent; }
    canvas { width: 100vw; height: 100vh; display: block; }
    #status {
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%,-50%);
      color: rgba(255,255,255,0.5);
      font-family: sans-serif; font-size: 14px; pointer-events: none;
    }
  </style>
</head>
<body>
  <div id="status">Loading avatar…</div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/js/loaders/GLTFLoader.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/js/controls/OrbitControls.js"></script>
  <script>
    // ── Scene globals ──────────────────────────────────────────────────────
    let scene, camera, renderer, controls, mixer, clock, avatarRoot, idleAction;
    const MODEL_URLS = ${JSON.stringify(modelUris)};
    window.bones = {};

    // ── Animation state ────────────────────────────────────────────────────
    let animFrames  = [];
    let animFPS     = 12;
    let animPlaying = false;
    let animStartMs = 0;
    let currentDeltaTime = 0.016; // Tracks current frame step time

    const TUNING = { speed: 1.0 };
    window.setTuning = function(t) { if (t) Object.assign(TUNING, t); };

    let restQuats    = {};
    let restBoneDirs = {};
    let restWorldDirs = {};
    let idleTimer    = null;
    let returnIdleTimeout = null;
    let gestureActive = false;
    let fixedAvatarPosition = new THREE.Vector3();
    let fixedAvatarScale = 1;

    // ── Fixed camera framing ─────────────────────────────────────────────
    const CAMERA_VIEW = {
      pos:    new THREE.Vector3(0, 1.80, 2.3),
      lookAt: new THREE.Vector3(0, 1.60, 0),
    };

    // Global smoothing responsivity factor. 
    // Higher = faster tracking/snappier, Lower = lazier/smoother transitions.
    const DEFAULT_SMOOTHING = 25.0; 

    const _qA = new THREE.Quaternion();
    const _qB = new THREE.Quaternion();
    const _qIdentity = new THREE.Quaternion();
    const _vA = new THREE.Vector3();
    const _vB = new THREE.Vector3();
    const _vC = new THREE.Vector3();
    const _mA = new THREE.Matrix4();

    // ── Messaging ──────────────────────────────────────────────────────────
    function send(payload) {
      console.log("WEBVIEW SEND:", payload);
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    }

    // ── Bone discovery ─────────────────────────────────────────────────────
    const BONE_MAP = {
      spine:           ['spine', 'chest', 'mixamorig:spine', 'mixamorig:spine1', 'mixamorig:spine2'],
      neck:            ['neck', 'mixamorig:neck'],
      head:            ['head', 'mixamorig:head'],
      rightShoulder:   ['rightshoulder', 'r_shoulder', 'mixamorig:rightshoulder'],
      rightArm:        ['rightarm', 'right_arm', 'r_arm', 'rarm', 'mixamorig:rightarm'],
      rightForeArm:    ['rightforearm', 'right_forearm', 'r_forearm', 'mixamorig:rightforearm'],
      rightHand:       ['righthand', 'right_hand', 'r_hand', 'mixamorig:righthand'],
      leftShoulder:    ['leftshoulder', 'l_shoulder', 'mixamorig:leftshoulder'],
      leftArm:         ['leftarm', 'left_arm', 'l_arm', 'larm', 'mixamorig:leftarm'],
      leftForeArm:     ['leftforearm', 'left_forearm', 'l_forearm', 'mixamorig:leftforearm'],
      leftHand:        ['lefthand', 'left_hand', 'l_hand', 'mixamorig:lefthand'],
      rightHandThumb1: ['righthandthumb1', 'mixamorig:righthandthumb1'],
      rightHandThumb2: ['righthandthumb2', 'mixamorig:righthandthumb2'],
      rightHandThumb3: ['righthandthumb3', 'mixamorig:righthandthumb3'],
      rightHandIndex1: ['righthandindex1', 'righthandindexproximal', 'mixamorig:righthandindex1'],
      rightHandIndex2: ['righthandindex2', 'righthandindexintermediate', 'mixamorig:righthandindex2'],
      rightHandIndex3: ['righthandindex3', 'righthandindexdistal', 'mixamorig:righthandindex3'],
      rightHandMiddle1:['righthandmiddle1', 'mixamorig:righthandmiddle1'],
      rightHandMiddle2:['righthandmiddle2', 'mixamorig:righthandmiddle2'],
      rightHandMiddle3:['righthandmiddle3', 'mixamorig:righthandmiddle3'],
      rightHandRing1:  ['righthandring1', 'mixamorig:righthandring1'],
      rightHandRing2:  ['righthandring2', 'mixamorig:righthandring2'],
      rightHandRing3:  ['righthandring3', 'mixamorig:righthandring3'],
      rightHandPinky1: ['righthandpinky1', 'mixamorig:righthandpinky1'],
      rightHandPinky2: ['righthandpinky2', 'mixamorig:righthandpinky2'],
      rightHandPinky3: ['righthandpinky3', 'mixamorig:righthandpinky3'],
      leftHandThumb1:  ['lefthandthumb1', 'mixamorig:lefthandthumb1'],
      leftHandThumb2:  ['lefthandthumb2', 'mixamorig:lefthandthumb2'],
      leftHandThumb3:  ['lefthandthumb3', 'mixamorig:lefthandthumb3'],
      leftHandIndex1:  ['lefthandindex1', 'mixamorig:lefthandindex1'],
      leftHandIndex2:  ['lefthandindex2', 'mixamorig:lefthandindex2'],
      leftHandIndex3:  ['lefthandindex3', 'mixamorig:lefthandindex3'],
      leftHandMiddle1: ['lefthandmiddle1', 'mixamorig:lefthandmiddle1'],
      leftHandMiddle2: ['lefthandmiddle2', 'mixamorig:lefthandmiddle2'],
      leftHandMiddle3: ['lefthandmiddle3', 'mixamorig:lefthandmiddle3'],
      leftHandRing1:   ['lefthandring1', 'mixamorig:lefthandring1'],
      leftHandRing2:   ['lefthandring2', 'mixamorig:lefthandring2'],
      leftHandRing3:   ['lefthandring3', 'mixamorig:lefthandring3'],
      leftHandPinky1:  ['lefthandpinky1', 'mixamorig:lefthandpinky1'],
      leftHandPinky2:  ['lefthandpinky2', 'mixamorig:lefthandpinky2'],
      leftHandPinky3:  ['lefthandpinky3', 'mixamorig:lefthandpinky3'],
    };

    function setIdlePlaying(on) {
      if (!idleAction) return;
      if (on) {
        idleAction.reset().setEffectiveWeight(1).play();
      } else {
        idleAction.setEffectiveWeight(0).stop();
      }
    }

    function resetPoseToRest() {
      Object.keys(window.bones).forEach(function(name) {
        if (window.bones[name] && restQuats[name]) {
          window.bones[name].quaternion.copy(restQuats[name]);
        }
      });
      if (avatarRoot) avatarRoot.updateMatrixWorld(true);
    }

    function registerBone(obj) {
      if (!obj || !obj.name) return;
      const cleanName = obj.name.toLowerCase().replace(/[_\\s]/g, '');
      Object.keys(BONE_MAP).forEach(function(key) {
        if (window.bones[key]) return;
        const matched = BONE_MAP[key].some(function(kw) {
          const kwClean = kw.replace(/[_\\s:]/g, '');
          return cleanName === kwClean || cleanName.includes(kwClean);
        });
        if (matched) window.bones[key] = obj;
      });
    }

    function findAvatarBones(root) {
      console.log("========== FINDING BONES ==========");
      window.bones = {};
      avatarRoot = root;

      root.traverse(function(obj) {
        if (obj.isBone || obj.type === "Bone") {
          registerBone(obj);
        }
        if (obj.isSkinnedMesh && obj.skeleton) {
          obj.skeleton.bones.forEach(function(b){
            registerBone(b);
          });
        }
      });

      restQuats = {};
      restBoneDirs = {};
      restWorldDirs = {};
      root.updateMatrixWorld(true);

      Object.keys(window.bones).forEach(function(k){
        const bone = window.bones[k];
        restQuats[k] = bone.quaternion.clone();

        const p1 = new THREE.Vector3();
        const p2 = new THREE.Vector3();
        bone.getWorldPosition(p1);

        if (bone.children.length > 0) {
          bone.children[0].getWorldPosition(p2);
        } else {
          p2.copy(p1).add(new THREE.Vector3(0, 1, 0));
        }

        restWorldDirs[k] = p2.clone().sub(p1).normalize();
        if (bone.children.length > 0) {
          restBoneDirs[k] = bone.children[0].position.clone().normalize();
        } else {
          restBoneDirs[k] = new THREE.Vector3(0, 1, 0);
        }
      });
    }

    function enforceAnatomicalConstraints(name, bone){
      if(!bone || !name.toLowerCase().includes("hand")) return;

      const e = new THREE.Euler().setFromQuaternion(bone.quaternion, "XYZ");
      if(name.includes("Thumb")){
        e.x = THREE.MathUtils.clamp(e.x, -0.80, 1.60);
        e.y = THREE.MathUtils.clamp(e.y, -1.30, 1.30);
        e.z = THREE.MathUtils.clamp(e.z, -1.30, 1.30);
      } else {
        e.x = THREE.MathUtils.clamp(e.x, -0.25, 1.90);
        e.y = THREE.MathUtils.clamp(e.y, -1.20, 1.20);
        e.z = THREE.MathUtils.clamp(e.z, -1.20, 1.20);
      }
      bone.quaternion.setFromEuler(e);
    }

    // Helper calculating framerate independent exponential smoothing factor
    function getExpBlendFactor(customModifier = 1.0) {
      return 1.0 - Math.exp(-DEFAULT_SMOOTHING * customModifier * currentDeltaTime);
    }

    // ── Wrist rotation via palm normal ─────────────────────────────────────
    function applyWristWithNormal(boneName, virtualFrame){
      const bone = window.bones[boneName];
      if(!bone) return false;

      const forward = virtualFrame[boneName];
      const normal = virtualFrame[boneName+"Normal"];
      if(!forward || !normal) return false;

      const parentWorld = bone.parent.getWorldQuaternion(new THREE.Quaternion());
      const invParent = parentWorld.clone().invert();

      const f = forward.clone().applyQuaternion(invParent).normalize();
      const n = normal.clone().applyQuaternion(invParent).normalize();

      const side = new THREE.Vector3();
      side.crossVectors(n, f).normalize();
      n.crossVectors(f, side).normalize();

      const mat = _mA;
      mat.makeBasis(side, f, n);

      const target = _qA;
      target.setFromRotationMatrix(mat);

      // Framerate independent slerp using temporal exponential smoothing
      const blend = getExpBlendFactor(1.2); 
      bone.quaternion.slerp(target, blend);
      bone.updateWorldMatrix(false, true);

      return true;
    }

    function applyBoneDirection(boneName, virtualFrame) {
      const bone = window.bones[boneName];
      if (!bone || !bone.parent) return false;

      const dir = virtualFrame[boneName];
      if (!dir) return false;

      bone.parent.updateWorldMatrix(true, false);
      bone.parent.getWorldQuaternion(_qA);
      _qB.copy(_qA).invert();

      _vA.copy(dir).applyQuaternion(_qB).normalize();

      const restDir = restBoneDirs[boneName];
      if (!restDir) return false;

      _vB.copy(restDir);
      if (/[123]$/.test(boneName)) {
        _vB.negate();
      }
      _vB.normalize();

      _qA.setFromUnitVectors(_vB, _vA);
      _qB.copy(restQuats[boneName]).multiply(_qA);

      // Dynamically calculate individual bone tracking weight scales
      let modifier = 1.0;
      if (boneName.includes("Thumb")) modifier = 0.8;
      else if (/[123]$/.test(boneName)) modifier = 0.85; // Other fingers
      else if (boneName.includes("Hand")) modifier = 1.2;

      const blend = getExpBlendFactor(modifier);
      bone.quaternion.slerp(_qB, blend);
      bone.updateWorldMatrix(false, true);

      return true;
    }

    // ── Virtual translation engine ─────────────────────────────────────────
    function applyBoneFrame(frameData) {
      if(!frameData || !avatarRoot) return;
      const virtualFrame = {};

      if(frameData.pose){
        const p = frameData.pose;
        const dir = (a,b)=>{
          return new THREE.Vector3(b.x-a.x, b.y-a.y, b.z-a.z).normalize();
        };

        if(p.rightShoulder && p.rightElbow) virtualFrame.rightArm = dir(p.rightShoulder,p.rightElbow);
        if(p.rightElbow && p.rightWrist) virtualFrame.rightForeArm = dir(p.rightElbow,p.rightWrist);
        if(p.leftShoulder && p.leftElbow) virtualFrame.leftArm = dir(p.leftShoulder,p.leftElbow);
        if(p.leftElbow && p.leftWrist) virtualFrame.leftForeArm = dir(p.leftElbow,p.leftWrist);
      }

      if(frameData.hands){
        ["left","right"].forEach(side=>{
          const pts = frameData.hands[side];
          if(!pts || pts.length!==21){
            APPLY_ORDER.filter(b=>b.startsWith(side)).forEach(name=>{
              const bone = window.bones[name];
              if(bone && restQuats[name]){
                bone.quaternion.slerp(restQuats[name], getExpBlendFactor(0.2));
              }
            });
            return;
          }

          const P = i => new THREE.Vector3(pts[i].x, pts[i].y, pts[i].z);
          const wrist = P(0);
          const index = P(5);
          const middle = P(9);
          const pinky = P(17);

          const handForward = middle.clone().sub(wrist).normalize();
          virtualFrame[side+"Hand"] = handForward;

          const indexVec = index.clone().sub(wrist).normalize();
          const middleVec = middle.clone().sub(wrist).normalize();
          const pinkyVec = pinky.clone().sub(wrist).normalize();
          const palmNormal = new THREE.Vector3();

          if (side === "right") {
            palmNormal.crossVectors(indexVec.clone().sub(middleVec), pinkyVec.clone().sub(indexVec));
          } else {
            palmNormal.crossVectors(pinkyVec.clone().sub(indexVec), indexVec.clone().sub(middleVec));
          }
          palmNormal.normalize();
          virtualFrame[side+"HandNormal"] = palmNormal;

          const chains = {
            Thumb:[1,2,3,4], Index:[5,6,7,8], Middle:[9,10,11,12], Ring:[13,14,15,16], Pinky:[17,18,19,20]
          };
          const makeDir = (a,b) => P(b).sub(P(a)).normalize();

          Object.entries(chains).forEach(([finger,j])=>{
            virtualFrame[side+"Hand"+finger+"1"] = makeDir(j[0],j[1]);
            virtualFrame[side+"Hand"+finger+"2"] = makeDir(j[1],j[2]);
            virtualFrame[side+"Hand"+finger+"3"] = makeDir(j[2],j[3]);
          });
        });
      }

      avatarRoot.updateMatrixWorld(true);

      ["rightArm", "rightForeArm", "leftArm", "leftForeArm"].forEach(name => {
        applyBoneDirection(name, virtualFrame);
      });

      ["rightHand", "leftHand"].forEach(name => {
        applyWristWithNormal(name, virtualFrame);
      });

      APPLY_ORDER.forEach(name=>{
        if(["rightArm","rightForeArm","leftArm","leftForeArm","rightHand","leftHand"].includes(name)) return;
        applyBoneDirection(name, virtualFrame);
        const bone = window.bones[name];
        if(bone) enforceAnatomicalConstraints(name, bone);
      });

      avatarRoot.updateMatrixWorld(true);
    }

    const APPLY_ORDER = [
      'rightArm', 'rightForeArm', 'rightHand',
      'rightHandThumb1',  'rightHandThumb2',  'rightHandThumb3',
      'rightHandIndex1',  'rightHandIndex2',  'rightHandIndex3',
      'rightHandMiddle1', 'rightHandMiddle2', 'rightHandMiddle3',
      'rightHandRing1',   'rightHandRing2',   'rightHandRing3',
      'rightHandPinky1',  'rightHandPinky2',  'rightHandPinky3',
      'leftArm',  'leftForeArm',  'leftHand',
      'leftHandThumb1',   'leftHandThumb2',   'leftHandThumb3',
      'leftHandIndex1',   'leftHandIndex2',   'leftHandIndex3',
      'leftHandMiddle1',  'leftHandMiddle2',  'leftHandMiddle3',
      'leftHandRing1',    'leftHandRing2',    'leftHandRing3',
      'leftHandPinky1',   'leftHandPinky2',   'leftHandPinky3',
    ];

    function returnToIdle() {
      if (idleTimer) clearInterval(idleTimer);
      let t = 0;
      const capturedQuats = {};
      Object.keys(window.bones).forEach(function(k) {
        capturedQuats[k] = window.bones[k].quaternion.clone();
      });
      idleTimer = setInterval(function() {
        t += 0.08;
        if (t >= 1) {
          t = 1;
          clearInterval(idleTimer);
          idleTimer = null;
          setIdlePlaying(true);
        }
        Object.keys(window.bones).forEach(function(k) {
          if (!restQuats[k]) return;
          window.bones[k].quaternion.slerpQuaternions(capturedQuats[k], restQuats[k], t);
        });
        if (avatarRoot) avatarRoot.updateMatrixWorld(true);
      }, 16);
    }

    function lerpVec(va, vb, alpha) {
      return {
        x: va.x + (vb.x - va.x) * alpha,
        y: va.y + (vb.y - va.y) * alpha,
        z: va.z + (vb.z - va.z) * alpha,
      };
    }

    function lerpFrame(a, b, alpha) {
      const out = { pose: {}, hands: { left: null, right: null } };
      if (a.pose && b.pose) {
        Object.keys(a.pose).forEach(function(k) {
          if (b.pose[k]) out.pose[k] = lerpVec(a.pose[k], b.pose[k], alpha);
        });
      }
      if (a.hands && b.hands) {
        ['left', 'right'].forEach(function(side) {
          const arrA = a.hands[side];
          const arrB = b.hands[side];
          if (!arrA || !arrB || !Array.isArray(arrA) || !Array.isArray(arrB)) return;
          const maxLen = Math.min(arrA.length, arrB.length);
          out.hands[side] = [];
          for (let i = 0; i < maxLen; i++) {
            out.hands[side].push(lerpVec(arrA[i], arrB[i], alpha));
          }
        });
      }
      return out;
    }

    window.playAnimation = function(frames, fps) {
      if (!frames || !Array.isArray(frames) || !frames.length) {
        send({ type: 'ANIM_ERROR', message: 'No animation frames' });
        return;
      }
      if (Object.keys(window.bones).length === 0) {
        send({ type: 'ANIM_ERROR', message: 'Avatar bones not mapped yet' });
        return;
      }
      gestureActive = true;
      setIdlePlaying(false);
      if (idleTimer)         { clearInterval(idleTimer);           idleTimer = null; }
      if (returnIdleTimeout) { clearTimeout(returnIdleTimeout); returnIdleTimeout = null; }

      resetPoseToRest();
      animFrames  = frames;
      animFPS     = fps || 12;
      animStartMs = performance.now();
      animPlaying = true;

      applyBoneFrame(animFrames[0]);
      send({ type: 'ANIM_START', frames: animFrames.length });
    };

    window.playGesture = function(bonesData) {
      if (!bonesData) return;
      window.playAnimation(Array.isArray(bonesData) ? bonesData : [bonesData]);
    };

    function fitModelToView(model) {
      const box    = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size   = box.getSize(new THREE.Vector3());
      const scale  = size.y ? 3 / size.y : 1;
      model.position.set(-center.x, -center.y + 0.5, -center.z);
      model.rotation.set(0, 0, 0);
      model.scale.set(scale, scale, scale);
      fixedAvatarPosition.copy(model.position);
      fixedAvatarScale = scale;
      scene.add(model);
    }

    function lockAvatarRootTransform() {
      if (!avatarRoot) return;
      avatarRoot.position.copy(fixedAvatarPosition);
      avatarRoot.rotation.set(0, 0, 0);
      avatarRoot.scale.set(fixedAvatarScale, fixedAvatarScale, fixedAvatarScale);
      avatarRoot.updateMatrixWorld(true);
    }

    function loadAvatarModel(loader, index) {
      const url = MODEL_URLS[index];
      if (!url) {
        send({ type: "ERROR", message: "Unable to load avatar model" });
        return;
      }
      loader.load(url, function(gltf) {
        document.getElementById("status").style.display = "none";
        const model = gltf.scene;
        fitModelToView(model);
        mixer = null;
        findAvatarBones(model);
        send({ type: "LOADED", bones: Object.keys(window.bones).length });
      }, undefined, function(error) {
        send({ type: "ERROR", message: error.message || "GLTF load failed" });
      });
    }

    function buildTuner() {
      const wrap  = document.createElement('div');
      wrap.style.cssText = 'position:absolute;left:8px;bottom:8px;z-index:10;font-family:sans-serif;';
      const panel = document.createElement('div');
      panel.style.cssText = 'display:none;background:rgba(10,10,15,0.85);padding:10px 12px;border-radius:12px;color:#fff;font-size:11px;min-width:160px;margin-bottom:8px;';

      function mkSlider(label, key, min, max, step) {
        const row = document.createElement('div');
        row.style.cssText = 'margin:8px 0;';
        const lab = document.createElement('div');
        lab.textContent = label + ': ' + TUNING[key];
        lab.style.cssText = 'margin-bottom:3px;opacity:0.85;';
        const inp = document.createElement('input');
        inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step; inp.value = TUNING[key];
        inp.style.cssText = 'width:100%;';
        inp.addEventListener('input', function() {
          TUNING[key] = parseFloat(inp.value);
          lab.textContent = label + ': ' + TUNING[key];
        });
        row.appendChild(lab); row.appendChild(inp);
        return row;
      }

      panel.appendChild(mkSlider('Speed', 'speed', 0.3, 2, 0.1));
      const btn = document.createElement('div');
      btn.textContent = 'TUNE';
      btn.style.cssText = 'width:48px;height:30px;line-height:30px;text-align:center;background:rgba(10,10,15,0.7);color:#fff;border-radius:15px;cursor:pointer;font-size:11px;font-weight:bold;letter-spacing:1px;';
      btn.addEventListener('click', function() {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      });

      wrap.appendChild(panel); wrap.appendChild(btn);
      document.body.appendChild(wrap);
    }

    // ── Render loop ────────────────────────────────────────────────────────
    function animate() {
      requestAnimationFrame(animate);
      
      // Essential update: save the variable frame duration to dynamic state
      currentDeltaTime = clock.getDelta();

      if (animPlaying && animFrames.length) {
        const cursor = ((performance.now() - animStartMs) / 1000) * animFPS * TUNING.speed;
        const last   = animFrames.length - 1;

        if (cursor >= last) {
          applyBoneFrame(animFrames[last]);
          animPlaying   = false;
          gestureActive = false;
          send({ type: 'ANIM_DONE' });
          returnIdleTimeout = setTimeout(returnToIdle, 600);
        } else {
          const i     = Math.floor(cursor);
          const alpha = cursor - i;
          applyBoneFrame(lerpFrame(animFrames[i], animFrames[i + 1], alpha));
        }
      } else if (mixer && !gestureActive) {
        mixer.update(currentDeltaTime);
      }

      lockAvatarRootTransform();
      if (controls) controls.update();
      renderer.render(scene, camera);
    }

    // ── Init ───────────────────────────────────────────────────────────────
    function init() {
      clock    = new THREE.Clock();
      scene    = new THREE.Scene();
      camera   = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.copy(CAMERA_VIEW.pos);
      camera.lookAt(CAMERA_VIEW.lookAt);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 3));
      renderer.outputEncoding    = THREE.sRGBEncoding;
      renderer.toneMapping       = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.setSize(window.innerWidth, window.innerHeight);
      document.body.appendChild(renderer.domElement);
      buildTuner();

      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.enablePan    = false;
      controls.enableRotate = false;
      controls.enableZoom   = false;
      controls.minDistance  = 2;
      controls.maxDistance  = 10;
      controls.target.copy(CAMERA_VIEW.lookAt);

      const ambient  = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambient);
      const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
      keyLight.position.set(3, 8, 5);
      scene.add(keyLight);
      const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
      fillLight.position.set(-5, 2, -2);
      scene.add(fillLight);

      const loader = new THREE.GLTFLoader();
      loadAvatarModel(loader, 0);
      animate();
    }

    window.addEventListener('resize', function() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    init();
  </script>
</body>
</html>
`;

export default createViewerHtml;