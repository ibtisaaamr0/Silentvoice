// Three.js WebGL viewer — runs inside WebView as a self-contained HTML string.
// Extracted from screens/Avatar.jsx so the main component stays readable.
// To change animation logic edit applyBoneFrame() below.

const createViewerHtml = modelUris => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: transparent; }
    canvas { width: 100vw; height: 100vh; display: block; }
    #status { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
      color: rgba(255,255,255,0.5); font-family: sans-serif; font-size: 14px; pointer-events: none; }
  </style>
</head>
<body>
  <div id="status">Loading avatar…</div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/js/loaders/GLTFLoader.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/js/controls/OrbitControls.js"></script>
  <script>
    // ── Scene globals ──────────────────────────────────────────────────────────
    let scene, camera, renderer, controls, mixer, clock, avatarRoot, idleAction;
    const MODEL_URLS = ${JSON.stringify(modelUris)};
    window.bones = {};

    // ── Animation state ────────────────────────────────────────────────────────
    let animFrames = [];
    let animFPS    = 12;
    let animPlaying = false;
    let animStartMs = 0;

    // Live-tunable playback knobs (adjust via on-screen TUNE panel or window.setTuning)
    const TUNING = {
      speed: 1.0,        // playback speed multiplier
      smoothWindow: 3,   // temporal smoothing window (odd; 1 = off, higher = smoother)
    };
    window.setTuning = function(t) { if (t) Object.assign(TUNING, t); };
    let restQuats  = {};
    let restBoneDirs = {};
    let restWorldDirs = {};
    let idleTimer  = null;
    let returnIdleTimeout = null;
    let gestureActive = false;
    let fixedAvatarPosition = new THREE.Vector3();
    let fixedAvatarScale = 1;
    const JOINT_SCALE = 2.2;
    const ARM_BONES = ['rightArm', 'rightForeArm', 'leftArm', 'leftForeArm'];
    const FINGER_BONE_KEYS = [
      'rightHand','leftHand',
      'rightHandThumb1','rightHandThumb2','rightHandThumb3',
      'rightHandIndex1','rightHandIndex2','rightHandIndex3',
      'rightHandMiddle1','rightHandMiddle2','rightHandMiddle3',
      'rightHandRing1','rightHandRing2','rightHandRing3',
      'rightHandPinky1','rightHandPinky2','rightHandPinky3',
      'leftHandThumb1','leftHandThumb2','leftHandThumb3',
      'leftHandIndex1','leftHandIndex2','leftHandIndex3',
      'leftHandMiddle1','leftHandMiddle2','leftHandMiddle3',
      'leftHandRing1','leftHandRing2','leftHandRing3',
      'leftHandPinky1','leftHandPinky2','leftHandPinky3',
    ];
    const ALL_POSEABLE_BONES = ARM_BONES.concat(FINGER_BONE_KEYS);
    const _qA = new THREE.Quaternion();
    const _qB = new THREE.Quaternion();
    const _vA = new THREE.Vector3();
    const _vB = new THREE.Vector3();
    const _vC = new THREE.Vector3();
    const _mA = new THREE.Matrix4();

    // ── Messaging ──────────────────────────────────────────────────────────────
    function send(payload) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    }

    // ── Bone discovery ─────────────────────────────────────────────────────────
    const BONE_MAP = {
      spine:              ['spine', 'chest', 'mixamorig:spine', 'mixamorig:spine1', 'mixamorig:spine2'],
      neck:               ['neck', 'mixamorig:neck'],
      head:               ['head', 'mixamorig:head'],
      rightShoulder:      ['rightshoulder', 'r_shoulder', 'mixamorig:rightshoulder'],
      rightArm:           ['rightarm', 'right_arm', 'r_arm', 'rarm', 'mixamorig:rightarm'],
      rightForeArm:       ['rightforearm', 'right_forearm', 'r_forearm', 'mixamorig:rightforearm'],
      rightHand:          ['righthand', 'right_hand', 'r_hand', 'mixamorig:righthand'],
      leftShoulder:       ['leftshoulder', 'l_shoulder', 'mixamorig:leftshoulder'],
      leftArm:            ['leftarm', 'left_arm', 'l_arm', 'larm', 'mixamorig:leftarm'],
      leftForeArm:        ['leftforearm', 'left_forearm', 'l_forearm', 'mixamorig:leftforearm'],
      leftHand:           ['lefthand', 'left_hand', 'l_hand', 'mixamorig:lefthand'],
      rightHandThumb1:    ['righthandthumb1', 'mixamorig:righthandthumb1'],
      rightHandThumb2:    ['righthandthumb2', 'mixamorig:righthandthumb2'],
      rightHandThumb3:    ['righthandthumb3', 'mixamorig:righthandthumb3'],
      rightHandIndex1:    ['righthandindex1', 'righthandindexproximal', 'mixamorig:righthandindex1'],
      rightHandIndex2:    ['righthandindex2', 'righthandindexintermediate', 'mixamorig:righthandindex2'],
      rightHandIndex3:    ['righthandindex3', 'righthandindexdistal', 'mixamorig:righthandindex3'],
      rightHandMiddle1:   ['righthandmiddle1', 'mixamorig:righthandmiddle1'],
      rightHandMiddle2:   ['righthandmiddle2', 'mixamorig:righthandmiddle2'],
      rightHandMiddle3:   ['righthandmiddle3', 'mixamorig:righthandmiddle3'],
      rightHandRing1:     ['righthandring1', 'mixamorig:righthandring1'],
      rightHandRing2:     ['righthandring2', 'mixamorig:righthandring2'],
      rightHandRing3:     ['righthandring3', 'mixamorig:righthandring3'],
      rightHandPinky1:    ['righthandpinky1', 'mixamorig:righthandpinky1'],
      rightHandPinky2:    ['righthandpinky2', 'mixamorig:righthandpinky2'],
      rightHandPinky3:    ['righthandpinky3', 'mixamorig:righthandpinky3'],
      leftHandThumb1:     ['lefthandthumb1', 'mixamorig:lefthandthumb1'],
      leftHandThumb2:     ['lefthandthumb2', 'mixamorig:lefthandthumb2'],
      leftHandThumb3:     ['lefthandthumb3', 'mixamorig:lefthandthumb3'],
      leftHandIndex1:     ['lefthandindex1', 'mixamorig:lefthandindex1'],
      leftHandIndex2:     ['lefthandindex2', 'mixamorig:lefthandindex2'],
      leftHandIndex3:     ['lefthandindex3', 'mixamorig:lefthandindex3'],
      leftHandMiddle1:    ['lefthandmiddle1', 'mixamorig:lefthandmiddle1'],
      leftHandMiddle2:    ['lefthandmiddle2', 'mixamorig:lefthandmiddle2'],
      leftHandMiddle3:    ['lefthandmiddle3', 'mixamorig:lefthandmiddle3'],
      leftHandRing1:      ['lefthandring1', 'mixamorig:lefthandring1'],
      leftHandRing2:      ['lefthandring2', 'mixamorig:lefthandring2'],
      leftHandRing3:      ['lefthandring3', 'mixamorig:lefthandring3'],
      leftHandPinky1:     ['lefthandpinky1', 'mixamorig:lefthandpinky1'],
      leftHandPinky2:     ['lefthandpinky2', 'mixamorig:lefthandpinky2'],
      leftHandPinky3:     ['lefthandpinky3', 'mixamorig:lefthandpinky3'],
    };

    function setIdlePlaying(on) {
      if (!idleAction) return;
      if (on) {
        idleAction.reset();
        idleAction.setEffectiveWeight(1);
        idleAction.play();
      } else {
        idleAction.setEffectiveWeight(0);
        idleAction.stop();
      }
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
      window.bones = {};
      avatarRoot = root;

      root.traverse(function(obj) {
        if (obj.isBone || obj.type === 'Bone') registerBone(obj);
        if (obj.isSkinnedMesh && obj.skeleton) {
          obj.skeleton.bones.forEach(registerBone);
        }
      });

      restQuats = {};
      restBoneDirs = {};
      restWorldDirs = {};
      root.updateMatrixWorld(true);

      Object.keys(window.bones).forEach(function(k) {
        const bone = window.bones[k];
        restQuats[k] = bone.quaternion.clone();

        _vA.set(0, 0, 0);
        bone.getWorldPosition(_vA);
        if (bone.children && bone.children.length > 0) {
          bone.children[0].getWorldPosition(_vB);
        } else {
          _vB.copy(bone.position).applyQuaternion(bone.quaternion).add(_vA);
        }
        restWorldDirs[k] = _vB.sub(_vA).normalize();

        if (bone.children && bone.children.length > 0) {
          restBoneDirs[k] = bone.children[0].position.clone()
            .applyQuaternion(bone.quaternion)
            .normalize();
        } else if (bone.position.lengthSq() > 1e-6) {
          restBoneDirs[k] = bone.position.clone().normalize();
        } else if (k.startsWith('right')) {
          restBoneDirs[k] = new THREE.Vector3(0, -1, 0);
        } else if (k.startsWith('left')) {
          restBoneDirs[k] = new THREE.Vector3(0, -1, 0);
        } else {
          restBoneDirs[k] = new THREE.Vector3(0, 1, 0);
        }
      });

      const boneCount = Object.keys(window.bones).length;
      send({type: 'BONES', count: boneCount, names: Object.keys(window.bones)});
    }

    // ── Bone animation ─────────────────────────────────────────────────────────
    function getShoulderBone(side) {
      return window.bones[side + 'Shoulder'] || window.bones[side + 'Arm'];
    }

    function clampQuatDelta(delta, maxRad) {
      const angle = 2 * Math.acos(THREE.MathUtils.clamp(Math.abs(delta.w), 0, 1));
      if (angle <= maxRad) return delta;
      const t = maxRad / angle;
      return delta.clone().slerp(new THREE.Quaternion(), 1 - t);
    }

    function aimBoneAtWorldPoint(boneName, worldPoint, maxRad) {
      const bone = window.bones[boneName];
      if (!bone || !bone.parent) return false;

      const parent = bone.parent;
      parent.updateMatrixWorld(true);
      _mA.copy(parent.matrixWorld).invert();

      bone.getWorldPosition(_vA);
      _vB.copy(worldPoint).applyMatrix4(_mA);
      _vC.copy(_vA).applyMatrix4(_mA);
      _vB.sub(_vC);
      if (_vB.lengthSq() < 1e-6) return false;
      _vB.normalize();

      const restDir = restBoneDirs[boneName];
      if (!restDir) return false;

      const delta = new THREE.Quaternion().setFromUnitVectors(restDir, _vB);
      bone.quaternion.copy(restQuats[boneName]).multiply(clampQuatDelta(delta, maxRad || 2.2));
      return true;
    }

    function jointToWorld(shoulderBone, joint) {
      shoulderBone.getWorldPosition(_vA);
      return _vA.clone().add(
        new THREE.Vector3(joint.x, joint.y, joint.z).multiplyScalar(JOINT_SCALE),
      );
    }

    function applyArmIK(side, joints) {
      const shoulder = getShoulderBone(side);
      const upper = window.bones[side + 'Arm'];
      const fore = window.bones[side + 'ForeArm'];
      if (!shoulder || !upper || !fore || !joints) return;

      const elbowKey = side + 'Elbow';
      const wristKey = side + 'Wrist';
      if (!joints[elbowKey] || !joints[wristKey]) return;

      upper.quaternion.copy(restQuats[side + 'Arm']);
      fore.quaternion.copy(restQuats[side + 'ForeArm']);

      const elbowWorld = jointToWorld(shoulder, joints[elbowKey]);
      const wristWorld = jointToWorld(shoulder, joints[wristKey]);

      aimBoneAtWorldPoint(side + 'Arm', elbowWorld, 2.4);
      avatarRoot.updateMatrixWorld(true);
      aimBoneAtWorldPoint(side + 'ForeArm', wristWorld, 2.4);
    }

    // Root-to-tip so each parent transform is committed before children read it
    const APPLY_ORDER = [
      'rightArm','rightForeArm','rightHand',
      'leftArm','leftForeArm','leftHand',
      'rightHandThumb1','rightHandThumb2','rightHandThumb3',
      'rightHandIndex1','rightHandIndex2','rightHandIndex3',
      'rightHandMiddle1','rightHandMiddle2','rightHandMiddle3',
      'rightHandRing1','rightHandRing2','rightHandRing3',
      'rightHandPinky1','rightHandPinky2','rightHandPinky3',
      'leftHandThumb1','leftHandThumb2','leftHandThumb3',
      'leftHandIndex1','leftHandIndex2','leftHandIndex3',
      'leftHandMiddle1','leftHandMiddle2','leftHandMiddle3',
      'leftHandRing1','leftHandRing2','leftHandRing3',
      'leftHandPinky1','leftHandPinky2','leftHandPinky3',
    ];

    function getClamp(name) {
      if (/[123]$/.test(name)) return 1.4;   // finger segment
      if (name === 'rightHand' || name === 'leftHand') return 1.5;  // wrist
      return 2.2;                              // upper arm / forearm
    }

    // ── Full wrist rotation using palm normal ──────────────────────────────────
    // When rightHandNormal / leftHandNormal is present in the frame data (v2 JSON),
    // we build a complete 3-axis rotation for the wrist instead of the
    // direction-only setFromUnitVectors approach which leaves axial twist arbitrary.
    // palm normal = direction the palm surface faces (e.g. toward viewer for palm-out).
    function applyWristWithNormal(boneName, frameData) {
      const fn = frameData[boneName + 'Normal'];
      const fd = frameData[boneName];
      if (!fn || !fd) return false;
      const bone = window.bones[boneName];
      if (!bone || !bone.parent) return false;

      bone.parent.updateMatrixWorld(true);
      bone.parent.getWorldQuaternion(_qA);
      _qB.copy(_qA).invert();

      // Hand forward direction (wrist → middle MCP) in parent-local space, x-negated
      const fwd = new THREE.Vector3(-fd.x, fd.y, fd.z).applyQuaternion(_qB).normalize();

      // Palm normal in parent-local space.
      // Right hand: pinky is image-right when palm faces viewer → cross product gives +z (toward camera) → x-negate only.
      // Left hand:  pinky is image-left when palm faces viewer → cross product gives -z (away from camera) → negate all three.
      const isLeft = boneName === 'leftHand';
      const palmN = new THREE.Vector3(
        isLeft ? fn.x  : -fn.x,
        isLeft ? -fn.y : fn.y,
        isLeft ? -fn.z : fn.z
      ).applyQuaternion(_qB);
      // Orthogonalise: remove any component along fwd so axes stay perpendicular
      palmN.addScaledVector(fwd, -palmN.dot(fwd)).normalize();
      if (palmN.lengthSq() < 1e-6) return false;

      // Build rotation matrix: local+Y = fwd, local+Z = palmN, local+X = fwd × palmN
      const sideAxis = new THREE.Vector3().crossVectors(fwd, palmN).normalize();
      const rotM = new THREE.Matrix4().makeBasis(sideAxis, fwd, palmN);
      const q = new THREE.Quaternion().setFromRotationMatrix(rotM);
      bone.quaternion.copy(clampQuatDelta(q, getClamp(boneName)));
      bone.updateMatrixWorld(true);
      return true;
    }

    function applyBoneFrame(frameData) {
      if (!frameData || !avatarRoot) return;

      ALL_POSEABLE_BONES.forEach(function(name) {
        if (window.bones[name] && restQuats[name]) {
          window.bones[name].quaternion.copy(restQuats[name]);
        }
      });
      avatarRoot.updateMatrixWorld(true);

      APPLY_ORDER.forEach(function(boneName) {
        if (!frameData[boneName]) return;
        const bone = window.bones[boneName];
        if (!bone) return;

        const fd = frameData[boneName];
        _vC.set(fd.x, fd.y, fd.z);
        if (_vC.lengthSq() < 1e-6) return;
        _vC.normalize();

        if (ARM_BONES.indexOf(boneName) !== -1) {
          // Parent-local +Y: same approach that works for fingers, unified for all bones.
          // Arms in standard rigs (Mixamo/humanoid) grow along local +Y.
          // Scale z*0.2 to suppress metric depth from pose_world_landmarks.
          if (!bone.parent) return;
          bone.parent.updateMatrixWorld(true);
          bone.parent.getWorldQuaternion(_qA);
          _qB.copy(_qA).invert();
          _vC.set(fd.x, fd.y, fd.z * 0.2).normalize();
          _vB.copy(_vC).applyQuaternion(_qB).normalize();
          const armDelta = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0), _vB
          );
          bone.quaternion.copy(clampQuatDelta(armDelta, getClamp(boneName)));
          bone.updateMatrixWorld(true);
        } else if (boneName === 'rightHand' || boneName === 'leftHand') {
          // WRIST -> full 3-axis rotation: uses palm normal for roll/twist.
          // applyWristWithNormal returns false only if HandNormal is absent in data.
          if (!applyWristWithNormal(boneName, frameData)) {
            if (!bone.parent) return;
            bone.parent.updateMatrixWorld(true);
            bone.parent.getWorldQuaternion(_qA);
            _qB.copy(_qA).invert();
            _vB.copy(_vC).applyQuaternion(_qB).normalize();
            const delta = new THREE.Quaternion().setFromUnitVectors(
              new THREE.Vector3(0, 1, 0), _vB
            );
            bone.quaternion.copy(clampQuatDelta(delta, getClamp(boneName)));
          }
          bone.updateMatrixWorld(true);
        } else {
          // FINGERS -> aim in PARENT-LOCAL space so each segment articulates
          // correctly relative to the (heavily rotated) wrist.
          if (!bone.parent) return;
          bone.parent.updateMatrixWorld(true);
          bone.parent.getWorldQuaternion(_qA);
          _qB.copy(_qA).invert();
          _vB.copy(_vC).applyQuaternion(_qB).normalize();

          const delta = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0), _vB
          );
          bone.quaternion.copy(clampQuatDelta(delta, getClamp(boneName)));
          bone.updateMatrixWorld(true);
        }
      });

      avatarRoot.updateMatrixWorld(true);
    }

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

    // ── Public API: called from React Native ───────────────────────────────────
    // ── Temporal smoothing + interpolation ─────────────────────────────────────
    function isVec(v) { return v && typeof v.x === 'number'; }

    // Moving-average over a temporal window kills MediaPipe jitter before playback.
    function smoothFrames(frames, win) {
      if (!win || win < 2 || frames.length < 3) return frames;
      const half = Math.floor(win / 2);
      const vecKeys = {};
      frames.forEach(function(fr) {
        Object.keys(fr).forEach(function(k) { if (isVec(fr[k])) vecKeys[k] = 1; });
      });
      const out = frames.map(function() { return {}; });
      frames.forEach(function(fr, idx) {
        Object.keys(fr).forEach(function(k) { if (!isVec(fr[k])) out[idx][k] = fr[k]; });
      });
      Object.keys(vecKeys).forEach(function(k) {
        for (let i = 0; i < frames.length; i++) {
          let sx = 0, sy = 0, sz = 0, n = 0;
          for (let j = i - half; j <= i + half; j++) {
            if (j < 0 || j >= frames.length) continue;
            const v = frames[j][k];
            if (!isVec(v)) continue;
            sx += v.x; sy += v.y; sz += v.z; n++;
          }
          if (n > 0) {
            let x = sx / n, y = sy / n, z = sz / n;
            const len = Math.sqrt(x * x + y * y + z * z);
            if (len > 1e-6) { x /= len; y /= len; z /= len; }
            out[i][k] = {x: x, y: y, z: z};
          } else if (frames[i][k]) {
            out[i][k] = frames[i][k];
          }
        }
      });
      return out;
    }

    // Blend two keyframes so 12 FPS source renders smoothly at display rate.
    function lerpFrame(a, b, alpha) {
      const out = {};
      const ks = {};
      Object.keys(a).forEach(function(k) { ks[k] = 1; });
      Object.keys(b).forEach(function(k) { ks[k] = 1; });
      Object.keys(ks).forEach(function(k) {
        const va = a[k], vb = b[k];
        if (isVec(va) && isVec(vb)) {
          out[k] = {
            x: va.x + (vb.x - va.x) * alpha,
            y: va.y + (vb.y - va.y) * alpha,
            z: va.z + (vb.z - va.z) * alpha,
          };
        } else {
          out[k] = vb || va;
        }
      });
      return out;
    }

    window.playAnimation = function(frames, fps) {
      if (!frames || !Array.isArray(frames) || !frames.length) {
        send({type: 'ANIM_ERROR', message: 'No animation frames'});
        return;
      }
      if (Object.keys(window.bones).length === 0) {
        send({type: 'ANIM_ERROR', message: 'Avatar bones not mapped yet'});
        return;
      }

      gestureActive = true;
      setIdlePlaying(false);
      if (idleTimer) { clearInterval(idleTimer); idleTimer = null; }
      if (returnIdleTimeout) { clearTimeout(returnIdleTimeout); returnIdleTimeout = null; }

      animFrames  = smoothFrames(frames, TUNING.smoothWindow);
      animFPS     = fps || 12;
      animStartMs = performance.now();
      animPlaying = true;

      applyBoneFrame(animFrames[0]);
      send({type: 'ANIM_START', frames: animFrames.length});
    };

    window.playGesture = function(bonesData) {
      if (!bonesData) return;
      if (Array.isArray(bonesData)) {
        window.playAnimation(bonesData);
      } else {
        window.playAnimation([bonesData]);
      }
    };

    // ── Scene setup ────────────────────────────────────────────────────────────
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
      if (!url) { send({type: 'ERROR', message: 'Unable to load avatar model'}); return; }

      loader.load(
        url,
        function(gltf) {
          document.getElementById('status').style.display = 'none';
          const model = gltf.scene;
          fitModelToView(model);

          if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            idleAction = mixer.clipAction(gltf.animations[0]);
            idleAction.play();
          }

          findAvatarBones(model);
          send({type: 'LOADED'});
        },
        undefined,
        function() { loadAvatarModel(loader, index + 1); }
      );
    }

    // ── Live tuning panel (drag sliders to fix arm posture in real time) ────────
    function buildTuner() {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'position:absolute;left:8px;bottom:8px;z-index:10;font-family:sans-serif;';

      const panel = document.createElement('div');
      panel.style.cssText = 'display:none;background:rgba(10,10,15,0.85);padding:10px 12px;' +
        'border-radius:12px;color:#fff;font-size:11px;min-width:160px;margin-bottom:8px;';

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
      panel.appendChild(mkSlider('Smoothing', 'smoothWindow', 1, 9, 2));

      const btn = document.createElement('div');
      btn.textContent = 'TUNE';
      btn.style.cssText = 'width:48px;height:30px;line-height:30px;text-align:center;' +
        'background:rgba(10,10,15,0.7);color:#fff;border-radius:15px;cursor:pointer;' +
        'font-size:11px;font-weight:bold;letter-spacing:1px;';
      btn.addEventListener('click', function() {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      });

      wrap.appendChild(panel);
      wrap.appendChild(btn);
      document.body.appendChild(wrap);
    }

    function animate() {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (animPlaying && animFrames.length) {
        const cursor = ((performance.now() - animStartMs) / 1000) * animFPS * TUNING.speed;
        const last   = animFrames.length - 1;
        if (cursor >= last) {
          applyBoneFrame(animFrames[last]);
          animPlaying   = false;
          gestureActive = false;
          send({type: 'ANIM_DONE'});
          returnIdleTimeout = setTimeout(returnToIdle, 300);
        } else {
          const i     = Math.floor(cursor);
          const alpha = cursor - i;
          applyBoneFrame(lerpFrame(animFrames[i], animFrames[i + 1], alpha));
        }
      } else if (mixer && !gestureActive) {
        mixer.update(delta);
      }

      lockAvatarRootTransform();
      if (controls) controls.update();
      renderer.render(scene, camera);
    }

    function init() {
      clock    = new THREE.Clock();
      scene    = new THREE.Scene();
      camera   = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 1.5, 5);
      camera.lookAt(0, 1, 0);

      renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, powerPreference: 'high-performance'});
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 3));
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
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
      controls.target.set(0, 1, 0);

      const ambient = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambient);
      const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
      keyLight.position.set(3, 8, 5);
      scene.add(keyLight);
      const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
      fillLight.position.set(-5, 2, -2);
      scene.add(fillLight);

      loadAvatarModel(new THREE.GLTFLoader(), 0);
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
