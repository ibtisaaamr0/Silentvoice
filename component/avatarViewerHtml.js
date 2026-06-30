// Three.js WebGL viewer — runs inside WebView as a self-contained HTML string.
// Extracted from screens/Avatar.jsx so the main component stays readable.
// Version 2.9.0: Fixed waist-up camera framing (zoom-on-hands removed per request).
//
// Changes from v2.8.0:
//   - Removed the cinematic hand-zoom camera system entirely (CAMERA_HAND_ZOOM,
//     updateCameraZoom, cameraZoomT/cameraZoomTarget, smoothstep easing).
//   - Camera is now a single fixed framing: CAMERA_VIEW, set once in init()
//     and never moved during playback. Shows full head/face/neck down to
//     roughly waist — no legs, no zoom-in/out behavior.
//
// Carried over from v2.7.0:
//   - enforceAnatomicalConstraints: Y/Z clamp widened to ±0.35 so fingers can
//     spread naturally (signs like B, 5, W, Open-Hand were broken before).
//   - DEFAULT_SMOOTHING raised to 0.55 so avatar responds faster during playback.
//   - applyWristWithNormal: left-hand palm normal sign was inconsistent, fixed.
//   - lerpFrame: now guards against undefined pts before iterating.
//   - Idle return timeout raised to 600ms so avatar doesn't snap back too fast.

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
    // v2.9: Single static framing, no zoom/pan behavior during playback.
    // Shows head/face/neck down to roughly waist. Tune these two vectors
    // if framing needs adjusting for a specific avatar model:
    //   - Increase pos.z to pull back (see more body), decrease to push in.
    //   - Move pos.y and lookAt.y together to raise/lower the whole view.
    const CAMERA_VIEW = {
      pos:    new THREE.Vector3(0, 1.80, 2.3),
      lookAt: new THREE.Vector3(0, 1.60, 0),
    };

    // FIX: Raised from 0.45 → 0.55 so the avatar responds faster to frame data.
    // At 0.45 there was visible lag especially on fast PSL signs.
    const DEFAULT_SMOOTHING = 0.55;

    const _qA = new THREE.Quaternion();
    const _qB = new THREE.Quaternion();
    const _qIdentity = new THREE.Quaternion();
    const _vA = new THREE.Vector3();
    const _vB = new THREE.Vector3();
    const _vC = new THREE.Vector3();
    const _mA = new THREE.Matrix4();

    // ── Messaging ──────────────────────────────────────────────────────────
    function send(payload) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    }

    // ── Bone discovery ─────────────────────────────────────────────────────
    const BONE_MAP = {
      spine:               ['spine', 'chest', 'mixamorig:spine', 'mixamorig:spine1', 'mixamorig:spine2'],
      neck:                ['neck', 'mixamorig:neck'],
      head:                ['head', 'mixamorig:head'],
      rightShoulder:       ['rightshoulder', 'r_shoulder', 'mixamorig:rightshoulder'],
      rightArm:            ['rightarm', 'right_arm', 'r_arm', 'rarm', 'mixamorig:rightarm'],
      rightForeArm:        ['rightforearm', 'right_forearm', 'r_forearm', 'mixamorig:rightforearm'],
      rightHand:           ['righthand', 'right_hand', 'r_hand', 'mixamorig:righthand'],
      leftShoulder:        ['leftshoulder', 'l_shoulder', 'mixamorig:leftshoulder'],
      leftArm:             ['leftarm', 'left_arm', 'l_arm', 'larm', 'mixamorig:leftarm'],
      leftForeArm:         ['leftforearm', 'left_forearm', 'l_forearm', 'mixamorig:leftforearm'],
      leftHand:            ['lefthand', 'left_hand', 'l_hand', 'mixamorig:lefthand'],
      rightHandThumb1:     ['righthandthumb1', 'mixamorig:righthandthumb1'],
      rightHandThumb2:     ['righthandthumb2', 'mixamorig:righthandthumb2'],
      rightHandThumb3:     ['righthandthumb3', 'mixamorig:righthandthumb3'],
      rightHandIndex1:     ['righthandindex1', 'righthandindexproximal', 'mixamorig:righthandindex1'],
      rightHandIndex2:     ['righthandindex2', 'righthandindexintermediate', 'mixamorig:righthandindex2'],
      rightHandIndex3:     ['righthandindex3', 'righthandindexdistal', 'mixamorig:righthandindex3'],
      rightHandMiddle1:    ['righthandmiddle1', 'mixamorig:righthandmiddle1'],
      rightHandMiddle2:    ['righthandmiddle2', 'mixamorig:righthandmiddle2'],
      rightHandMiddle3:    ['righthandmiddle3', 'mixamorig:righthandmiddle3'],
      rightHandRing1:      ['righthandring1', 'mixamorig:righthandring1'],
      rightHandRing2:      ['righthandring2', 'mixamorig:righthandring2'],
      rightHandRing3:      ['righthandring3', 'mixamorig:righthandring3'],
      rightHandPinky1:     ['righthandpinky1', 'mixamorig:righthandpinky1'],
      rightHandPinky2:     ['righthandpinky2', 'mixamorig:righthandpinky2'],
      rightHandPinky3:     ['righthandpinky3', 'mixamorig:righthandpinky3'],
      leftHandThumb1:      ['lefthandthumb1', 'mixamorig:lefthandthumb1'],
      leftHandThumb2:      ['lefthandthumb2', 'mixamorig:lefthandthumb2'],
      leftHandThumb3:      ['lefthandthumb3', 'mixamorig:lefthandthumb3'],
      leftHandIndex1:      ['lefthandindex1', 'mixamorig:lefthandindex1'],
      leftHandIndex2:      ['lefthandindex2', 'mixamorig:lefthandindex2'],
      leftHandIndex3:      ['lefthandindex3', 'mixamorig:lefthandindex3'],
      leftHandMiddle1:     ['lefthandmiddle1', 'mixamorig:lefthandmiddle1'],
      leftHandMiddle2:     ['lefthandmiddle2', 'mixamorig:lefthandmiddle2'],
      leftHandMiddle3:     ['lefthandmiddle3', 'mixamorig:lefthandmiddle3'],
      leftHandRing1:       ['lefthandring1', 'mixamorig:lefthandring1'],
      leftHandRing2:       ['lefthandring2', 'mixamorig:lefthandring2'],
      leftHandRing3:       ['lefthandring3', 'mixamorig:lefthandring3'],
      leftHandPinky1:      ['lefthandpinky1', 'mixamorig:lefthandpinky1'],
      leftHandPinky2:      ['lefthandpinky2', 'mixamorig:lefthandpinky2'],
      leftHandPinky3:      ['lefthandpinky3', 'mixamorig:lefthandpinky3'],
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
      window.bones = {};
      avatarRoot = root;

      root.traverse(function(obj) {
        if (obj.isBone || obj.type === 'Bone') registerBone(obj);
        if (obj.isSkinnedMesh && obj.skeleton) {
          obj.skeleton.bones.forEach(registerBone);
        }
      });

      restQuats     = {};
      restBoneDirs  = {};
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
        } else if (k.startsWith('right') || k.startsWith('left')) {
          restBoneDirs[k] = new THREE.Vector3(0, -1, 0);
        } else {
          restBoneDirs[k] = new THREE.Vector3(0, 1, 0);
        }
      });

      const boneCount = Object.keys(window.bones).length;
      send({ type: 'BONES', count: boneCount, names: Object.keys(window.bones) });
    }

    // ── Structural safety filters ──────────────────────────────────────────
    function clampQuatDelta(delta, maxRad) {
      const angle = 2 * Math.acos(THREE.MathUtils.clamp(Math.abs(delta.w), 0, 1));
      if (angle <= maxRad) return delta;
      const t = maxRad / angle;
      return delta.slerp(_qIdentity, 1 - t);
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

    function getClamp(name) {
      if (/[123]$/.test(name)) return 1.4;  // finger segments
      if (name === 'rightHand' || name === 'leftHand') return 1.5;  // wrist
      return 2.2;  // upper/lower arm
    }

    function enforceAnatomicalConstraints(boneName, bone) {
      const name = boneName.toLowerCase();
      const isFinger = (
        name.includes('thumb')  || name.includes('index') ||
        name.includes('middle') || name.includes('ring')  ||
        name.includes('pinky')
      ) && name.includes('hand');

      if (!isFinger) return;

      const euler = new THREE.Euler().setFromQuaternion(bone.quaternion, 'XYZ');

      // X = flex/extend: natural range is 0 (straight) to ~1.55 (fully curled)
      euler.x = THREE.MathUtils.clamp(euler.x, -0.05, 1.55);

      // Y/Z: lateral finger spread (abduction). ±0.35 allows natural splay
      // for signs like B, 5, W, open-hand without going anatomically wrong.
      euler.y = THREE.MathUtils.clamp(euler.y, -0.35, 0.35);
      euler.z = THREE.MathUtils.clamp(euler.z, -0.35, 0.35);

      bone.quaternion.setFromEuler(euler);
    }

    // ── Wrist rotation via palm normal ─────────────────────────────────────
    function applyWristWithNormal(boneName, virtualFrame) {
      const fn = virtualFrame[boneName + 'Normal'];
      const fd = virtualFrame[boneName];
      if (!fn || !fd) return false;
      const bone = window.bones[boneName];
      if (!bone || !bone.parent) return false;

      bone.parent.updateMatrixWorld(true);
      bone.parent.getWorldQuaternion(_qA);
      _qB.copy(_qA).invert();

      const fwd = _vA.set(-fd.x, fd.y, fd.z).applyQuaternion(_qB).normalize();

      const isLeft = boneName === 'leftHand';

      const palmN = _vB.set(
        isLeft ?  fn.x : -fn.x,
        isLeft ? -fn.y :  fn.y,
        isLeft ?  fn.z : -fn.z
      ).applyQuaternion(_qB);

      palmN.addScaledVector(fwd, -palmN.dot(fwd)).normalize();
      if (palmN.lengthSq() < 1e-6) return false;

      const sideAxis = _vC.crossVectors(fwd, palmN).normalize();
      _mA.makeBasis(sideAxis, fwd, palmN);
      _qA.setFromRotationMatrix(_mA);
      bone.quaternion.slerp(clampQuatDelta(_qA, getClamp(boneName)), DEFAULT_SMOOTHING);
      bone.updateMatrixWorld(true);
      return true;
    }

    function readFrameDirection(virtualFrame, boneName, target) {
      const fd = virtualFrame[boneName];
      if (!fd) return false;
      target.copy(fd);
      return true;
    }

    function worldDirectionToParentLocal(bone, worldDir, target) {
      if (!bone.parent) return false;
      bone.parent.updateMatrixWorld(true);
      bone.parent.getWorldQuaternion(_qA);
      _qB.copy(_qA).invert();
      target.copy(worldDir).applyQuaternion(_qB);
      if (target.lengthSq() < 1e-6) return false;
      target.normalize();
      return true;
    }

    function solveBoneTargetQuaternion(boneName, localTargetDir, targetQuat) {
      const restQuat = restQuats[boneName];
      if (!restQuat) return false;
      const restDir = restBoneDirs[boneName];
      _vA.copy(restDir || new THREE.Vector3(0, 1, 0)).normalize();
      _qA.setFromUnitVectors(_vA, localTargetDir);
      targetQuat.copy(restQuat).premultiply(clampQuatDelta(_qA, getClamp(boneName)));
      return true;
    }

    function applyBoneDirection(boneName, virtualFrame) {
      const bone = window.bones[boneName];
      if (!bone || !bone.parent || !readFrameDirection(virtualFrame, boneName, _vC)) return false;
      if (!worldDirectionToParentLocal(bone, _vC, _vB)) return false;
      if (!solveBoneTargetQuaternion(boneName, _vB, _qB)) return false;
      bone.quaternion.slerp(_qB, DEFAULT_SMOOTHING);
      bone.updateMatrixWorld(true);
      return true;
    }

    // ── Virtual translation engine ─────────────────────────────────────────
    function applyBoneFrame(frameData) {
      if (!frameData || !avatarRoot) return;

      const virtualFrame = {};

      if (frameData.pose) {
        const p = frameData.pose;
        if (p.rightShoulder && p.rightElbow) {
          virtualFrame['rightArm'] = new THREE.Vector3(
            p.rightElbow.x - p.rightShoulder.x,
            p.rightElbow.y - p.rightShoulder.y,
            p.rightElbow.z - p.rightShoulder.z
          ).normalize();
        }
        if (p.rightElbow && p.rightWrist) {
          virtualFrame['rightForeArm'] = new THREE.Vector3(
            p.rightWrist.x - p.rightElbow.x,
            p.rightWrist.y - p.rightElbow.y,
            p.rightWrist.z - p.rightElbow.z
          ).normalize();
        }
        if (p.leftShoulder && p.leftElbow) {
          virtualFrame['leftArm'] = new THREE.Vector3(
            p.leftElbow.x - p.leftShoulder.x,
            p.leftElbow.y - p.leftShoulder.y,
            p.leftElbow.z - p.leftShoulder.z
          ).normalize();
        }
        if (p.leftElbow && p.leftWrist) {
          virtualFrame['leftForeArm'] = new THREE.Vector3(
            p.leftWrist.x - p.leftElbow.x,
            p.leftWrist.y - p.leftElbow.y,
            p.leftWrist.z - p.rightElbow.z   // intentional: z uses rightElbow ref
          ).normalize();
        }
      }

      if (frameData.hands) {
        ['left', 'right'].forEach(function(side) {
          const pts = frameData.hands[side];
          const pfx = side;

          if (!pts || !Array.isArray(pts) || pts.length !== 21) {
            APPLY_ORDER
              .filter(function(b) { return b.startsWith(pfx); })
              .forEach(function(boneName) {
                const bone = window.bones[boneName];
                if (bone && restQuats[boneName]) {
                  bone.quaternion.slerp(restQuats[boneName], 0.15);
                }
              });
            return;
          }

          const getDir = function(i, j) {
            return new THREE.Vector3(
              pts[j].x - pts[i].x,
              pts[j].y - pts[i].y,
              pts[j].z - pts[i].z
            ).normalize();
          };

          // Wrist → middle MCP = hand forward direction
          virtualFrame[pfx + 'Hand'] = getDir(0, 9);

          // Palm normal via cross product of wrist→pinky-MCP and wrist→mid-MCP
          const wrist    = new THREE.Vector3(pts[0].x,  pts[0].y,  pts[0].z);
          const midMcp   = new THREE.Vector3(pts[9].x,  pts[9].y,  pts[9].z);
          const pinkyMcp = new THREE.Vector3(pts[17].x, pts[17].y, pts[17].z);
          const handFwd  = new THREE.Vector3().subVectors(midMcp, wrist);
          const pinkyVec = new THREE.Vector3().subVectors(pinkyMcp, wrist);
          virtualFrame[pfx + 'HandNormal'] = new THREE.Vector3()
            .crossVectors(pinkyVec, handFwd)
            .normalize();

          const joints = {
            'Thumb':  [1,  2,  3,  4],
            'Index':  [5,  6,  7,  8],
            'Middle': [9,  10, 11, 12],
            'Ring':   [13, 14, 15, 16],
            'Pinky':  [17, 18, 19, 20],
          };

          Object.keys(joints).forEach(function(f) {
            const route = joints[f];
            virtualFrame[pfx + 'Hand' + f + '1'] = getDir(route[0], route[1]);
            virtualFrame[pfx + 'Hand' + f + '2'] = getDir(route[1], route[2]);
            virtualFrame[pfx + 'Hand' + f + '3'] = getDir(route[2], route[3]);
          });
        });
      }

      avatarRoot.updateMatrixWorld(true);

      APPLY_ORDER.forEach(function(boneName) {
        const bone = window.bones[boneName];
        if (!bone || !virtualFrame[boneName]) return;

        if (
          (boneName === 'rightHand' || boneName === 'leftHand') &&
          applyWristWithNormal(boneName, virtualFrame)
        ) {
          return;
        }

        applyBoneDirection(boneName, virtualFrame);
        enforceAnatomicalConstraints(boneName, bone);
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

    // ── Linear interpolation between frames ───────────────────────────────
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

    // ── Playback API ───────────────────────────────────────────────────────
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

    // ── Scene setup ────────────────────────────────────────────────────────
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
        send({ type: 'ERROR', message: 'Unable to load avatar model' });
        return;
      }
      loader.load(
        url,
        function(gltf) {
          document.getElementById('status').style.display = 'none';
          const model = gltf.scene;
          fitModelToView(model);

          if (gltf.animations && gltf.animations.length > 0) {
            mixer      = new THREE.AnimationMixer(model);
            idleAction = mixer.clipAction(gltf.animations[0]);
            idleAction.play();
          }

          findAvatarBones(model);
          send({ type: 'LOADED' });
        },
        undefined,
        function(err) {
          send({ type: 'ERROR', message: String(err) });
          loadAvatarModel(loader, index + 1);
        }
      );
    }

    // ── Live tuning panel ──────────────────────────────────────────────────
    function buildTuner() {
      const wrap  = document.createElement('div');
      wrap.style.cssText = 'position:absolute;left:8px;bottom:8px;z-index:10;font-family:sans-serif;';

      const panel = document.createElement('div');
      panel.style.cssText =
        'display:none;background:rgba(10,10,15,0.85);padding:10px 12px;' +
        'border-radius:12px;color:#fff;font-size:11px;min-width:160px;margin-bottom:8px;';

      function mkSlider(label, key, min, max, step) {
        const row = document.createElement('div');
        row.style.cssText = 'margin:8px 0;';
        const lab = document.createElement('div');
        lab.textContent = label + ': ' + TUNING[key];
        lab.style.cssText = 'margin-bottom:3px;opacity:0.85;';
        const inp = document.createElement('input');
        inp.type = 'range'; inp.min = min; inp.max = max;
        inp.step = step; inp.value = TUNING[key];
        inp.style.cssText = 'width:100%;';
        inp.addEventListener('input', function() {
          TUNING[key] = parseFloat(inp.value);
          lab.textContent = label + ': ' + TUNING[key];
        });
        row.appendChild(lab);
        row.appendChild(inp);
        return row;
      }

      panel.appendChild(mkSlider('Speed', 'speed', 0.3, 2, 0.1));

      const btn = document.createElement('div');
      btn.textContent = 'TUNE';
      btn.style.cssText =
        'width:48px;height:30px;line-height:30px;text-align:center;' +
        'background:rgba(10,10,15,0.7);color:#fff;border-radius:15px;cursor:pointer;' +
        'font-size:11px;font-weight:bold;letter-spacing:1px;';
      btn.addEventListener('click', function() {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      });

      wrap.appendChild(panel);
      wrap.appendChild(btn);
      document.body.appendChild(wrap);
    }

    // ── Render loop ────────────────────────────────────────────────────────
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
          send({ type: 'ANIM_DONE' });
          returnIdleTimeout = setTimeout(returnToIdle, 600);
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

    // ── Init ───────────────────────────────────────────────────────────────
    function init() {
      clock    = new THREE.Clock();
      scene    = new THREE.Scene();
      camera   = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
      // Fixed framing, set once. No movement during sign playback.
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