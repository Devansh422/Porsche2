const scrollContainer = document.getElementById('scroll-container');
                const sectionsRoot = document.getElementById('sections');
                const sections = Array.from(document.querySelectorAll('.section'));

                // Initialize Lenis Smooth Scroll (as per user specification)
                const lenis = new Lenis({
                    wrapper: scrollContainer,
                    content: sectionsRoot,
                    duration: 1.2,
                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                    direction: "vertical",
                    gestureDirection: "vertical",
                    smooth: true,
                    mouseMultiplier: 1,
                    smoothTouch: false,
                    touchMultiplier: 2,
                    infinite: false,
                });

        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);

        // Register GSAP plugins
        gsap.registerPlugin(ScrollTrigger);
        ScrollTrigger.defaults({ scroller: scrollContainer });

        // Import Three.js modules via import map
        import * as THREE from 'three';
        import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
        import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
        import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
        import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
        import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

        // Three.js setup
        let scene, camera, renderer, composer, bloomPass, model, modelRig, modelPivot, garageModel, controls, pivotHelper, keyLight, rimLight, ambientLight, fillLight, shadowCatcher, shadowMaterial, contactShadowCatcher, contactShadowMaterial;
        let neonRigGroup = null;
        const neonFlickerLights = [];
        const neonPointEntries = [];
        const tubeFixtureEntries = [];
        const detailHotspots = [];
        const detailHotspotRaycaster = new THREE.Raycaster();
        const detailHotspotPointer = new THREE.Vector2();
        const detailHotspotWorldPosition = new THREE.Vector3();
        const detailHotspotScreenPosition = new THREE.Vector3();
        const doorTooltipWorldPosition = new THREE.Vector3();
        const doorTooltipScreenPosition = new THREE.Vector3();
        let detailHotspotOverlay = null;
        let detailHotspotTitleEl = null;
        let detailHotspotBodyEl = null;
        let doorEnterTooltipOverlay = null;
        let activeDetailHotspot = null;
        let detailHotspotInteractionReady = false;
        let detailHotspotsReady = false;
        let detailHotspotDebuggerReady = false;
        let activeDetailHotspotTargetId = 'wheel';
        let neonDebuggerReady = false;
        let activeNeonTargetId = 'P1';
        const neonPointConfigs = [
            {
                id: 'P1',
                color: 0x39FF14,
                intensity: 14,
                distance: 21,
                decay: 2,
                emissiveIntensity: 2.9,
                position: new THREE.Vector3(-10.2, 2.2, 2.0),
                orientation: 'y',
                flickerAmplitude: 2.0,
                flickerSpeed: 1.8,
                flickerPhase: 0.4,
                rotationX: -0.5,
                rotationY: 0,
                rotationZ: -0.5
            },
            {
                id: 'P3',
                color: 0xCCFF00,
                intensity: 15,
                distance: 15,
                decay: 2,
                emissiveIntensity: 2.7,
                position: new THREE.Vector3(0.2, 5.26, -5.4),
                orientation: 'z',
                flickerAmplitude: 1.2,
                flickerSpeed: 1.5,
                flickerPhase: 2.3,
                rotationX: -0.4,
                rotationY: 0,
                rotationZ: 0
            }
        ];
        const tubeFixtureConfigs = [
            {
                id: 'T1',
                color: 0x00ffff,
                position: new THREE.Vector3(0, 5, 5),
                intensity: 12,
                distance: 10,
                emissiveIntensity: 1.5,
                flickerAmplitude: 1.0,
                flickerSpeed: 1.4,
                flickerPhase: 0.1,
                rotationX: 0,
                rotationY: 0,
                rotationZ: 0
            },
            {
                id: 'T3',
                color: 0xFF1493,
                position: new THREE.Vector3(6.9, 3.4, 0.7),
                intensity: 15,
                distance: 22,
                emissiveIntensity: 3.2,
                flickerAmplitude: 1.3,
                flickerSpeed: 1.5,
                flickerPhase: 1.6,
                rotationX: 0.31,
                rotationY: 0.05,
                rotationZ: -0.92
            }
        ];
        let cyberpunkNeonSetupDone = false;
        let garageFloorWorldY = Number.NaN;
        let neutralEnvironmentTexture = null;
        let modelScrollTimeline = null;
        let dragControlsReady = false;
        let isTranslateDrag = false;
        let isRotateDrag = false;
        const threeContainer = document.getElementById('three-content');
        const modelBasePosition = new THREE.Vector3();
        const defaultPivotOffset = new THREE.Vector3(0, 0, 0);
        const pivotOffset = defaultPivotOffset.clone();
        const pivotWorldPosition = new THREE.Vector3();
        const introCameraAimOffset = new THREE.Vector3(0, 0.6, 0);
        const dragRaycaster = new THREE.Raycaster();
        const dragPointer = new THREE.Vector2();
        const dragPlane = new THREE.Plane();
        const dragIntersection = new THREE.Vector3();
        const dragOffset = new THREE.Vector3();
        const lastDragRigPosition = new THREE.Vector3();
        const dragMovement = new THREE.Vector3();
        const orbitOffset = new THREE.Vector3();
        const orbitHorizontal = new THREE.Vector3();
        const shadowBaseCenter = new THREE.Vector3();
        const interiorCameraPosition = new THREE.Vector3(-10.61, 0.97, -5.68);
        const interiorCameraTarget = new THREE.Vector3(-10.63, 0.00, -8.66);
        const interiorAxisOffset = new THREE.Vector3(-1.24, 0, -1.72);
        let interiorCameraPresetInitialized = true;
        let cameraInteriorTransitionTween = null;
        let interiorCameraActive = false;
        const interiorCameraReturnPosition = new THREE.Vector3();
        const interiorCameraReturnTarget = new THREE.Vector3();
        const interiorDoorTargetsBeforeEntry = [];
        const interiorPivotKeyframesBeforeEntry = [];
        const interiorOrbitBaseOffset = new THREE.Vector3();
        const interiorOrbitSpherical = new THREE.Spherical();
        let interiorReturnSnapshotReady = false;
        let interiorPivotSnapshotReady = false;
        let controlsOrbitStateBeforeInterior = null;
        let dragLastX = 0;
        let isShiftPressed = false;
        let isAltPressed = false;
        let activeSectionIndex = 0;
        const smoothPivotEnabled = true;
        let shadowGroundBaseY = 0;
        let keyframeEditorReady = false;
        let camInNudgeControlsReady = false;
        let axisQuickControlsReady = false;
        let axisManualControlsReady = false;
        let introDomBuilt = false;
        let introActive = false;
        let introSequenceHasStarted = false;
        let introTimeline = null;
        let cinematicTextTimeline = null;
        const activeSplitTextInstances = [];
        let introMusicNode = null;
        let introAudioPreloadPromise = null;
        let cameraDebugStudioReady = false;
        let introCameraOverrideActive = false;
        const fixedShadowSettings = {
            opacity: 0.18,
            intensity: 0.18,
            bias: -0.00008,
            groundOffset: -0.03
        };
        const defaultLightPoint = [20, 30, -20];
        const orbitMinPolarAngle = THREE.MathUtils.degToRad(5);
        const orbitMaxPolarAngle = THREE.MathUtils.degToRad(88);
        const interiorOrbitAzimuthLimit = THREE.MathUtils.degToRad(34);
        const interiorOrbitPolarLimit = THREE.MathUtils.degToRad(20);
        const interiorOrbitDistanceTolerance = 0.12;
        const minimumCameraHeightAboveGarage = 0.18;
        const animationClock = new THREE.Clock();
        const wheelNamePattern = /(wheel|whl|tyre|tire|rim|trim|centerlock|hub|disc|disk|rotor)/i;
        const wheelStaticPartPattern = /(caliper|calliper)/i;
        const manualWheelExcludeLabels = [
            'object_381 sketchfab_scene',
            'object_375 sketchfab_scene',
            'object_393 sketchfab_scene',
            'object_387 sketchfab_scene'
        ];
        const manualWheelExcludeNames = new Set([
            'object_381',
            'object_375',
            'object_393',
            'object_387',
            'object_30',
            'object_39',
            'object_51',
            'object_42'
        ]);
        const manualCaliperMeshByWheelIndex = [
            'object_375',
            'object_393',
            'object_387',
            'object_381'
        ];
        const manualExtraCaliperMeshNames = [
            'object_30',
            'object_39',
            'object_51',
            'object_42'
        ];
        const bloomGlowTargetMeshName = 'object_318';
        const bloomGlowEmissiveColor = 0xFFFFFF;
        const bloomGlowEmissiveIntensity = 100.0;
        const hardcodedWheelAxisPoints = [
            new THREE.Vector3(-9.02, 1.40, -13.98),
            new THREE.Vector3(-15.65, 1.40, -14.01),
            new THREE.Vector3(-15.65, 1.54, -4.38),
            new THREE.Vector3(-9.02, 1.54, -4.35)
        ];
        const wheelRigs = [];
        const doorRigs = [];
        const doorAnalysisRows = [];
        let wheelControlsReady = false;
        let doorControlsReady = false;
        let wheelAutoSpin = false;
        let wheelSpinSpeed = 6;
        let engineControlsReady = false;
        let engineAudioReady = false;
        let engineRunning = false;
        let engineAudioContext = null;
        let engineMasterGainNode = null;
        let introLightReverbConvolverNode = null;
        let introLightReverbWetGainNode = null;
        let engineStartBuffer = null;
        let engineLoopBuffer = null;
        let engineRevBuffer = null;
        let engineStartSourceNode = null;
        let engineLoopSourceNode = null;
        let engineRevSourceNode = null;
        let engineStopTailSourceNode = null;
        let engineRevCurrentNormalized = 0;
        let engineRevTargetNormalized = 0;
        let engineRevHoldActive = false;
        let engineRevHoldStrengthNormalized = 0;
        let engineRevPulseStrengthNormalized = 0;
        let engineRevPulseActiveUntilMs = 0;
        let engineAudioLoadingPromise = null;
        let engineAudioPreloadPromise = null;
        let engineAudioPreloadedBuffers = null;
        let engineAudioWarmupStarted = false;
        let doorAudioReady = false;
        let doorOpenAudioElement = null;
        let doorCloseAudioElement = null;
        let engineStartRequiredPopupEl = null;
        let engineStartRequiredPopupHideTimer = null;
        let engineStartRequiredPopupLastShownAt = -Infinity;
        let engineStartSequenceId = 0;
        const engineStartAudioPath = 'assets/start.mp3';
        const engineLoopAudioPath = 'assets/engine.mp3';
        const engineRevAudioPath = 'assets/rev.mp3';
        const doorOpenAudioPath = 'assets/open.mp3';
        const doorCloseAudioPath = 'assets/close.mp3';
        const lightTurnOnAudioPath = 'assets/light.mp3';
        const porscheModelPath = 'assets/porsche.glb';
        const engineAudioCacheStoreName = 'porsche-engine-audio-v1';
        const introShotPresets = {
            wide: { pos: [15.0, 5.0, -45.0], aim: [0.12, 0.6, 0.0] },
            lowWheel: { pos: [10.0, -2.71, 45.0], aim: [0.25, -0.55, 0.0] },
            rearWing: { pos: [14.4, 10.0, 150.0], aim: [0.25, 0.9, 0.0] },
            sidePull: { pos: [13.46, 1.02, 90.0], aim: [0.07, 0.89, 0.0] },
            heroShot: { pos: [13.0, 0.58, -60.0], aim: [-4.0, 0.17, 0.0] }
        };
        const introCameraBeatMarkers = [
            { label: '0.0 wide', time: 0 },
            { label: '2.0 wide move', time: 2 },
            { label: '3.5 lowWheel', time: 3.5 },
            { label: '5.8 rearWing', time: 5.8 },
            { label: '8.0 sidePull', time: 8.0 },
            { label: '11.0 interior', time: 11.0 },
            { label: '13.2 resetIn', time: 13.2 },
            { label: '13.2 hero', time: 13.2 },
            { label: '14.4 heroHold', time: 14.4 }
        ];
        const introAudioAssetPaths = {
            cinematicDrone: engineLoopAudioPath,
            doorOpen: doorOpenAudioPath,
            doorClose: doorCloseAudioPath,
            doorClunk: doorCloseAudioPath,
            steeringCreak: doorOpenAudioPath,
            heroRev: engineRevAudioPath,
            lightTurnOn: lightTurnOnAudioPath
        };
        const introAudioBuffers = {};
        const introLightTurnOnAudioVolume = 0.62;
        const introLightReverbDryMix = 0.76;
        const introLightReverbWetMix = 0.42;
        const introLightReverbDurationSeconds = 1.25;
        const introLightReverbDecay = 2.1;
        const introLightRevealStepDuration = 0.5;
        const introEnvironmentLightTargets = [];
        const introNeonLightTargets = [];
        const introEnvironmentEmissiveTargets = [];
        const introNeonEmissiveTargets = [];
        const introEnvironmentSelfLitTargets = [];
        const introNeonSelfLitTargets = [];
        const introGarageReflectionTargets = [];
        const introGarageSurfaceTargets = [];
        const garagePrimaryLightMaterialName = 'glass';
        const garagePrimaryLightNodeName = 'object_3';
        const garagePrimaryLightMeshName = 'object_1';
        const garagePrimaryLightEmissiveColor = [0.428, 0.89, 1.0];
        const garagePrimaryLightEmissiveStrength = 10;
        const garageSurfaceOffColor = [0.01, 0.01, 0.01];
        const garageGlowMaterialPattern = /(light|lamp|neon|tube|strip|emissive|glow)/i;
        let introLightRevealTimeline = null;
        let introLightRevealCompleted = false;
        let neonFlickerEnabled = false;

        async function clearEngineAudioPersistentCache() {
            if (typeof window === 'undefined' || !('caches' in window)) {
                return;
            }

            try {
                await window.caches.delete(engineAudioCacheStoreName);
            } catch (error) {
                // Ignore Cache API deletion failures.
            }
        }

        async function fetchEngineAudioArrayBuffers(fetchOptions = undefined) {
            const canUsePersistentCache = (
                typeof window !== 'undefined'
                && 'caches' in window
                && (!fetchOptions || fetchOptions.cache !== 'no-store')
            );

            let audioCacheStore = null;
            if (canUsePersistentCache) {
                try {
                    audioCacheStore = await window.caches.open(engineAudioCacheStoreName);
                } catch (error) {
                    audioCacheStore = null;
                }
            }

            const loadResponse = async (audioPath) => {
                if (audioCacheStore) {
                    try {
                        const cachedResponse = await audioCacheStore.match(audioPath);
                        if (cachedResponse && cachedResponse.ok) {
                            return cachedResponse;
                        }
                    } catch (error) {
                        // Ignore Cache API lookup failures and fall back to network.
                    }
                }

                const networkResponse = await fetch(audioPath, fetchOptions);
                if (networkResponse.ok && audioCacheStore) {
                    try {
                        await audioCacheStore.put(audioPath, networkResponse.clone());
                    } catch (error) {
                        // Ignore Cache API write failures.
                    }
                }

                return networkResponse;
            };

            const [startResponse, loopResponse, revResponse] = await Promise.all([
                loadResponse(engineStartAudioPath),
                loadResponse(engineLoopAudioPath),
                loadResponse(engineRevAudioPath)
            ]);

            if (!startResponse.ok || !loopResponse.ok || !revResponse.ok) {
                throw new Error('One or more engine audio files failed to load.');
            }

            const [startArrayBuffer, loopArrayBuffer, revArrayBuffer] = await Promise.all([
                startResponse.arrayBuffer(),
                loopResponse.arrayBuffer(),
                revResponse.arrayBuffer()
            ]);

            return {
                startArrayBuffer,
                loopArrayBuffer,
                revArrayBuffer
            };
        }

        function getOrCreateSharedAudioContext() {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                return null;
            }

            if (!engineAudioContext) {
                engineAudioContext = new AudioContextClass();
            }

            if (!engineMasterGainNode) {
                engineMasterGainNode = engineAudioContext.createGain();
                engineMasterGainNode.gain.value = 1;
                engineMasterGainNode.connect(engineAudioContext.destination);
            }

            return engineAudioContext;
        }

        function createIntroLightReverbImpulse(audioContext, durationSeconds = introLightReverbDurationSeconds, decay = introLightReverbDecay) {
            const sampleRate = audioContext.sampleRate || 44100;
            const sampleLength = Math.max(1, Math.floor(sampleRate * durationSeconds));
            const impulse = audioContext.createBuffer(2, sampleLength, sampleRate);

            for (let channelIndex = 0; channelIndex < impulse.numberOfChannels; channelIndex += 1) {
                const channelData = impulse.getChannelData(channelIndex);
                for (let sampleIndex = 0; sampleIndex < sampleLength; sampleIndex += 1) {
                    const envelope = Math.pow(1 - (sampleIndex / sampleLength), decay);
                    channelData[sampleIndex] = (Math.random() * 2 - 1) * envelope;
                }
            }

            return impulse;
        }

        function ensureIntroLightReverb(audioContext) {
            if (!audioContext) {
                return false;
            }

            if (introLightReverbConvolverNode && introLightReverbWetGainNode) {
                return true;
            }

            try {
                introLightReverbConvolverNode = audioContext.createConvolver();
                introLightReverbConvolverNode.buffer = createIntroLightReverbImpulse(audioContext);

                introLightReverbWetGainNode = audioContext.createGain();
                introLightReverbWetGainNode.gain.value = introLightReverbWetMix;

                introLightReverbConvolverNode.connect(introLightReverbWetGainNode);
                introLightReverbWetGainNode.connect(engineMasterGainNode || audioContext.destination);
                return true;
            } catch (error) {
                introLightReverbConvolverNode = null;
                introLightReverbWetGainNode = null;
                return false;
            }
        }

        async function preloadIntroAudio() {
            if (introAudioPreloadPromise) {
                return introAudioPreloadPromise;
            }

            introAudioPreloadPromise = (async () => {
                const audioContext = getOrCreateSharedAudioContext();
                if (!audioContext) {
                    return false;
                }

                const entries = Object.entries(introAudioAssetPaths);
                await Promise.all(entries.map(async ([key, url]) => {
                    if (introAudioBuffers[key]) {
                        return;
                    }

                    try {
                        const response = await fetch(url, { cache: 'force-cache' });
                        if (!response.ok) {
                            throw new Error(`Failed to load ${url}`);
                        }

                        const arrayBuffer = await response.arrayBuffer();
                        const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
                        introAudioBuffers[key] = decodedBuffer;
                    } catch (error) {
                        console.warn(`[Intro Audio] Failed to preload ${key} from ${url}`, error);
                    }
                }));

                return true;
            })();

            try {
                return await introAudioPreloadPromise;
            } finally {
                introAudioPreloadPromise = null;
            }
        }

        function playPreloadedIntroAudio(key, volume = 1, loop = false) {
            const buffer = introAudioBuffers[key];
            const audioContext = getOrCreateSharedAudioContext();
            if (!buffer || !audioContext) {
                return null;
            }

            if (audioContext.state === 'suspended') {
                void audioContext.resume().catch(() => {
                    // Ignore resume failures and allow user gesture to resume later.
                });
            }

            const sourceNode = audioContext.createBufferSource();
            const gainNode = audioContext.createGain();
            sourceNode.buffer = buffer;
            sourceNode.loop = loop;
            gainNode.gain.value = volume;
            sourceNode.connect(gainNode);
            gainNode.connect(engineMasterGainNode || audioContext.destination);
            sourceNode.start();
            return {
                source: sourceNode,
                gain: gainNode
            };
        }

        function playIntroLightTurnOnSound(volume = introLightTurnOnAudioVolume) {
            const buffer = introAudioBuffers.lightTurnOn;
            const audioContext = getOrCreateSharedAudioContext();
            if (!buffer || !audioContext) {
                return null;
            }

            if (audioContext.state === 'suspended') {
                void audioContext.resume().catch(() => {
                    // Ignore resume failures and allow user gesture to resume later.
                });
            }

            const sourceNode = audioContext.createBufferSource();
            sourceNode.buffer = buffer;
            sourceNode.loop = false;

            const dryGainNode = audioContext.createGain();
            dryGainNode.gain.value = volume * introLightReverbDryMix;
            sourceNode.connect(dryGainNode);
            dryGainNode.connect(engineMasterGainNode || audioContext.destination);

            let reverbSendGainNode = null;
            if (ensureIntroLightReverb(audioContext) && introLightReverbConvolverNode) {
                reverbSendGainNode = audioContext.createGain();
                reverbSendGainNode.gain.value = volume;
                sourceNode.connect(reverbSendGainNode);
                reverbSendGainNode.connect(introLightReverbConvolverNode);
            }

            sourceNode.onended = () => {
                try {
                    sourceNode.disconnect();
                } catch (error) {
                    // Ignore cleanup errors.
                }
                try {
                    dryGainNode.disconnect();
                } catch (error) {
                    // Ignore cleanup errors.
                }
                if (reverbSendGainNode) {
                    try {
                        reverbSendGainNode.disconnect();
                    } catch (error) {
                        // Ignore cleanup errors.
                    }
                }
            };

            sourceNode.start();
            return {
                source: sourceNode,
                dryGain: dryGainNode,
                reverbSend: reverbSendGainNode
            };
        }

        const engineStartAudioVolume = 0.95;
        const engineLoopAudioVolume = 0.72;
        const doorOpenAudioVolume = 0.75;
        const doorCloseAudioVolume = 0.78;
        const engineRevScrollDeltaThreshold = 14;
        const engineRevAudioVolumeWhenStopped = 0.68;
        const engineRevAudioVolumeWhileRunning = 0.46;
        const engineRevPlaybackRateMin = 0.92;
        const engineRevPlaybackRateMax = 1.28;
        const engineLoopPlaybackRateIdle = 0.85;
        const engineLoopPlaybackRateMax = 2.65;
        const engineRevRiseTimeConstant = 0.032;
        const engineRevFallTimeConstant = 0.08;
        const engineRevPulseHoldMs = 180;
        const engineRevPulseStrengthMin = 0.76;
        const engineRevPulseStrengthRange = 0.2;
        const engineRevHoldStrengthMin = 0.93;
        const engineRevHoldStrengthRange = 0.07;
        const engineLoopTrimStart = 0.03;
        const engineLoopTrimEnd = 0.01;
        const engineStartToLoopOverlapSeconds = 0.015;
        const engineStopTailDurationSeconds = 0.52;
        const engineStopTailVolume = 0.5;
        const engineStopTailLowpassStartHz = 1100;
        const engineStopTailLowpassEndHz = 160;
        const engineStopTailPlaybackRateStart = 0.84;
        const engineStopTailPlaybackRateEnd = 0.54;
        const engineStartRequiredPopupCooldownMs = 900;
        const engineStartRequiredPopupDurationMs = 1250;
        const engineStartRequiredMessage = 'Press "S" to start the engine.';
        const engineAudioLoadingMessage = 'Engine audio is loading... Press "S" again in a moment.';
        const doorOpenAngle = THREE.MathUtils.degToRad(58);
        const doorAnimationDuration = 0.22;
        const doorSnapEpsilon = THREE.MathUtils.degToRad(0.08);
        const doorEnterTooltipShowThreshold = 0.08;
        const cinematicCameraTransitionDuration = 2;
        const cinematicCameraEase = createCubicBezierEase(0.22, 1, 0.36, 1);
        const interiorCameraTransitionDuration = cinematicCameraTransitionDuration;
        let doorOpenDirectionMultiplier = 1;
        const caliperDebugStatus = [];
        let steeringControlsReady = false;
        const frontWheelIndices = [];
        let steerLeftPressed = false;
        let steerRightPressed = false;
        let steeringAngle = 0;
        let steeringTargetAngle = 0;
        const maxSteeringAngle = THREE.MathUtils.degToRad(30);
        const steeringAnimationDuration = 0.25;
        const steeringSnapEpsilon = THREE.MathUtils.degToRad(0.05);
        const doorNamePattern = /(door|porta|puerta|portiera|tuer)/i;
        const doorSideLeftPattern = /(left|\blh\b|driver|_l\b|\bl\b|sx|izq)/i;
        const doorSideRightPattern = /(right|\brh\b|passenger|_r\b|\br\b|dx|der)/i;
        const doorFrontPattern = /(front|\bfr\b|fwd|fore|avant)/i;
        const doorRearPattern = /(rear|back|aft|\brr\b|post|hinten)/i;
        const doorIgnorePattern = /(wheel|rim|tyre|tire|glass|window|mirror|handle|hood|bonnet|trunk|boot|bumper|fender|spoiler|roof|wiper|light|lamp|caliper)/i;
        const manualDoorGroupNodeNames = [
            ['Object_471', 'Object_435', 'Object_84', 'Object_438','Object_180', 'Object_138', 'Object_435', 'Object_414', 'Object_204', 'Object_276', 'Object_279','Object_183', 'Object_57','Object_147', 'Object_18', 'Object_411', 'Object_99', 'Object_171', 'Object_258', 'Object_207' ],
            ['Object_420', 'Object_474', 'Object_141', 'Object_441', 'Object_87', 'Object_444', 'Object_90', 'Object_417', 'Object_201', 'Object_150','Object_24', 'Object_273', 'Object_186', 'Object_213', 'Object_282', 'Object_456', 'Object_177', 'Object_153', 'Object_63', 'Object_261']
        ];
        // Hardcoded hinge pivots in world space [x, y, z] for manual door groups.
        const manualDoorGroupPivotWorldPoints = [
            [-13.81, 0.88, -11.719],
            [-7.27, 0.88, -11.719]
        ];
        const doorPivotMarkerColors = [
            0xff3b30,
            0x30d158,
            0x0a84ff,
            0xff9f0a,
            0xbf5af2,
            0x64d2ff
        ];
        let doorPivotMarkersVisible = false;
        const maxScrollDeltaPerFrame = 180;
        let scrollWheelSpinIntensity = 0.5;
        let scrollWheelSmoothDuration = 0.18;
        const wheelGestureDeltaClamp = 120;
        const wheelGestureSpinIntensity = 0.2;
        let pendingWheelGestureRotation = 0;
        let smoothedScrollWheelDelta = 0;
        let lastScrollTop = scrollContainer.scrollTop || 0;
        const defaultAmbientLightColor = [0.04, 0.04, 0.16];
        const defaultAmbientLightIntensity = 0.14;
        const defaultFillLightColor = [0.08, 0.14, 0.3];
        const defaultFillGroundColor = [0.02, 0.02, 0.05];
        const defaultFillLightIntensity = 0.045;
        const defaultShadowColor = [0.05, 0.06, 0.12];
        const defaultShadowOpacity = fixedShadowSettings.opacity;
        const defaultContactShadowOpacity = 0.26;
        const defaultShadowRadius = 1.2;
        const garageModelPath = 'assets/garage.glb';
        const garagePlacementOffset = new THREE.Vector3(0, 0, 0);
        const garageUniformScale = 4;
        const defaultEnvironmentIntensityScale = 0.68;
        const defaultMinimumRoughness = 0;
        const defaultMoonLightColor = [0.267, 0.267, 0.533];
        const defaultRimLightColor = [0.06, 0.1, 0.22];
        const defaultRimLightPoint = [0, 4, -10];
        const defaultRimLightIntensity = 0.1;
        const defaultFogColor = [0.008, 0.008, 0.04];
        const defaultFogDensity = 0.05;
        const defaultBloomStrength = 1.5;
        const defaultBloomThreshold = 0.85;
        const defaultBloomRadius = 0.4;
        const modelMaterialStates = [];
        let lastAppliedEnvironmentIntensityScale = defaultEnvironmentIntensityScale;
        let lastAppliedMinimumRoughness = defaultMinimumRoughness;
        const enableModelAnalysisLogs = false;
        const enableDoorAnalysisLogs = false;
        const authorCreditId = 'author-credit';
        const authorCreditText = 'Devansh Verma';
        let authorCreditObserver = null;
        let authorCreditElementObserver = null;
        let authorCreditIntegrityIntervalId = null;
        const controlsVisibilityStorageKey = 'porsche-controls-visible';
        let controlsAreVisible = true;
        let mobileExperienceReady = false;
        const activeMobileHeldKeys = new Set();
        let mobileLandscapeLockAttempted = false;

        setupAuthorCreditProtection();
        setupDebugPanelToggle();
        setupEngineAudioControls();
        setupControlsToggleButton();
        setupMobileExperience();
        initThreeJS();
        animate();

        function initThreeJS() {
            // Scene
            scene = new THREE.Scene();
            scene.fog = new THREE.FogExp2(0x02020a, defaultFogDensity);

            // Camera
            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(0, 1, 3);

            // Renderer
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 0.84;
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.shadowMap.autoUpdate = false;
            renderer.shadowMap.needsUpdate = true;
            renderer.setClearColor(0x02020a, 1);
            renderer.domElement.style.pointerEvents = 'auto';
            renderer.domElement.style.cursor = 'grab';
            threeContainer.appendChild(renderer.domElement);

            const renderPass = new RenderPass(scene, camera);
            bloomPass = new UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                defaultBloomStrength,
                defaultBloomRadius,
                defaultBloomThreshold
            );
            composer = new EffectComposer(renderer);
            composer.addPass(renderPass);
            composer.addPass(bloomPass);

            const pmremGenerator = new THREE.PMREMGenerator(renderer);
            pmremGenerator.compileEquirectangularShader();

            // Clean preloader overlay, hidden only when all required assets and scene objects are ready.
            const preloaderOverlay = document.createElement('div');
            preloaderOverlay.style.position = 'fixed';
            preloaderOverlay.style.inset = '0';
            preloaderOverlay.style.display = 'flex';
            preloaderOverlay.style.alignItems = 'center';
            preloaderOverlay.style.justifyContent = 'center';
            preloaderOverlay.style.background = 'radial-gradient(circle at 50% 36%, rgba(18, 22, 34, 0.96), rgba(6, 8, 14, 0.98))';
            preloaderOverlay.style.backdropFilter = 'blur(4px)';
            preloaderOverlay.style.zIndex = '2000';
            preloaderOverlay.style.opacity = '1';
            preloaderOverlay.style.transition = 'opacity 260ms ease';

            const preloaderCard = document.createElement('div');
            preloaderCard.style.width = 'min(86vw, 420px)';
            preloaderCard.style.padding = '20px 18px';
            preloaderCard.style.borderRadius = '14px';
            preloaderCard.style.border = '1px solid rgba(255, 255, 255, 0.24)';
            preloaderCard.style.background = 'rgba(10, 12, 18, 0.9)';
            preloaderCard.style.boxShadow = '0 18px 60px rgba(0, 0, 0, 0.4)';
            preloaderCard.style.color = '#eef3ff';
            preloaderCard.style.fontFamily = 'monospace';

            const preloaderTitle = document.createElement('div');
            preloaderTitle.textContent = 'Preparing Porsche Experience';
            preloaderTitle.style.fontSize = '14px';
            preloaderTitle.style.letterSpacing = '0.03em';
            preloaderTitle.style.marginBottom = '10px';
            preloaderTitle.style.fontWeight = '700';

            const preloaderProgressTrack = document.createElement('div');
            preloaderProgressTrack.style.width = '100%';
            preloaderProgressTrack.style.height = '8px';
            preloaderProgressTrack.style.borderRadius = '999px';
            preloaderProgressTrack.style.background = 'rgba(255, 255, 255, 0.14)';
            preloaderProgressTrack.style.overflow = 'hidden';

            const preloaderProgressFill = document.createElement('div');
            preloaderProgressFill.style.width = '0%';
            preloaderProgressFill.style.height = '100%';
            preloaderProgressFill.style.borderRadius = '999px';
            preloaderProgressFill.style.background = 'linear-gradient(90deg, #9ed0ff, #f8faff)';
            preloaderProgressFill.style.transition = 'width 180ms ease';
            preloaderProgressTrack.appendChild(preloaderProgressFill);

            const preloaderStatusText = document.createElement('div');
            preloaderStatusText.style.fontSize = '12px';
            preloaderStatusText.style.opacity = '0.9';
            preloaderStatusText.style.marginTop = '10px';
            preloaderStatusText.textContent = 'Preparing scene assets... (0%)';

            preloaderCard.appendChild(preloaderTitle);
            preloaderCard.appendChild(preloaderProgressTrack);
            preloaderCard.appendChild(preloaderStatusText);
            preloaderOverlay.appendChild(preloaderCard);
            document.body.appendChild(preloaderOverlay);

            let preloaderDismissed = false;
            let preloaderHasError = false;
            let preloaderVisualProgress = 0;
            let environmentReady = false;
            let garageReady = false;
            let porscheReady = false;
            let assetFetchReady = false;

            const setPreloaderProgress = (ratio, label) => {
                if (preloaderHasError) {
                    return;
                }

                const clampedRatio = THREE.MathUtils.clamp(ratio, 0, 1);
                preloaderVisualProgress = Math.max(preloaderVisualProgress, clampedRatio);
                preloaderProgressFill.style.width = `${(preloaderVisualProgress * 100).toFixed(1)}%`;
                if (label) {
                    preloaderStatusText.textContent = `${label} (${Math.round(preloaderVisualProgress * 100)}%)`;
                }
            };

            const showPreloaderError = (message) => {
                preloaderHasError = true;
                preloaderProgressFill.style.width = '100%';
                preloaderProgressFill.style.background = 'linear-gradient(90deg, #ff6b6b, #ffd6d6)';
                preloaderCard.style.borderColor = 'rgba(255, 120, 120, 0.7)';
                preloaderStatusText.textContent = message;
            };

            const preloadEngineAudioInBackground = async () => {
                if (engineAudioReady || engineAudioPreloadedBuffers) {
                    return true;
                }

                if (engineAudioPreloadPromise) {
                    await engineAudioPreloadPromise;
                    return Boolean(engineAudioPreloadedBuffers);
                }

                engineAudioPreloadPromise = (async () => {
                    engineAudioPreloadedBuffers = await fetchEngineAudioArrayBuffers({ cache: 'force-cache' });
                })();

                try {
                    await engineAudioPreloadPromise;
                    return Boolean(engineAudioPreloadedBuffers);
                } catch (error) {
                    engineAudioPreloadedBuffers = null;
                    console.warn('Engine audio background preload failed:', error);
                    return false;
                } finally {
                    engineAudioPreloadPromise = null;
                }
            };

            const scheduleEngineAudioWarmup = () => {
                if (engineAudioWarmupStarted || engineAudioReady) {
                    return;
                }

                engineAudioWarmupStarted = true;

                const runWarmup = () => {
                    void (async () => {
                        try {
                            await preloadEngineAudioInBackground();
                            await ensureEngineAudioInitialized();
                        } catch (error) {
                            console.warn('Engine audio warmup failed:', error);
                        }
                    })();
                };

                runWarmup();
            };

            const closePreloaderIfReady = () => {
                if (preloaderDismissed || preloaderHasError) {
                    return;
                }

                if (!assetFetchReady || !environmentReady || !garageReady || !porscheReady) {
                    return;
                }

                setPreloaderProgress(1, 'Scene ready');
                scheduleEngineAudioWarmup();
                void preloadIntroAudio();
                preloaderDismissed = true;
                window.setTimeout(() => {
                    preloaderOverlay.style.opacity = '0';
                    preloaderOverlay.style.pointerEvents = 'none';
                    window.setTimeout(() => {
                        if (preloaderOverlay.parentNode) {
                            preloaderOverlay.parentNode.removeChild(preloaderOverlay);
                        }

                        buildIntroDOM(true);
                    }, 280);
                }, 100);
            };

            const loadingManager = new THREE.LoadingManager();
            loadingManager.onStart = () => {
                setPreloaderProgress(0.03, 'Loading files');
            };
            loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
                const ratio = itemsTotal > 0 ? itemsLoaded / itemsTotal : 0;
                setPreloaderProgress(Math.min(0.95, ratio * 0.95), `Loading files ${itemsLoaded}/${itemsTotal}`);
            };
            loadingManager.onLoad = () => {
                assetFetchReady = true;
                setPreloaderProgress(0.96, 'Building 3D scene');
                closePreloaderIfReady();
            };
            loadingManager.onError = (url) => {
                console.error('Failed to load asset:', url);
                showPreloaderError(`Failed to load: ${url}`);
            };

            const loader = new GLTFLoader(loadingManager);
            const hdrLoader = new RGBELoader(loadingManager);

            // Keep startup preloader focused on core scene files only.
            // Engine audio warms in background after scene ready; door audio stays lazy.
            scheduleEngineAudioWarmup();

            setPreloaderProgress(0.02, 'Preparing scene assets');

            // Lighting with HDR
            hdrLoader
                .setPath('assets/')
                .load('neutral.hdr', function (texture) {
                    texture.mapping = THREE.EquirectangularReflectionMapping;
                    const environmentTarget = pmremGenerator.fromEquirectangular(texture);
                    neutralEnvironmentTexture = environmentTarget.texture;
                    texture.dispose();
                    applyEnvironmentPreset();
                    environmentReady = true;
                    setPreloaderProgress(0.92, 'Environment ready');
                    closePreloaderIfReady();
                }, undefined, function (error) {
                    console.error('Error loading HDR:', error);
                    showPreloaderError('Failed to load environment HDR');
                });

            // Load GLB models - GLTFLoader works with both .gltf and .glb files
            loader.load(
                garageModelPath,
                function (gltf) {
                    garageModel = gltf.scene;
                    garageModel.scale.setScalar(garageUniformScale);

                    garageModel.traverse((node) => {
                        if (node.isMesh) {
                            node.castShadow = false;
                            node.receiveShadow = true;

                            const materials = Array.isArray(node.material)
                                ? node.material
                                : [node.material];

                            materials.forEach((material) => {
                                if (!material) {
                                    return;
                                }

                                registerGarageSurfaceMaterial(material);
                                registerGarageReflectionMaterial(material);

                                const nodeName = typeof node.name === 'string' ? node.name : '';
                                const materialName = typeof material.name === 'string' ? material.name : '';
                                const materialNameLower = materialName.toLowerCase();
                                const isGarageGlassMaterial = materialNameLower === garagePrimaryLightMaterialName
                                    || materialNameLower.includes(garagePrimaryLightMaterialName);
                                const likelySelfLitFixture = Boolean(material.isMeshBasicMaterial)
                                    || garageGlowMaterialPattern.test(nodeName)
                                    || garageGlowMaterialPattern.test(materialName)
                                    || isGarageGlassMaterial;

                                if (likelySelfLitFixture) {
                                    registerIntroSelfLitMaterial(material, 'environment');
                                }

                                if (!material.emissive) {
                                    return;
                                }

                                const hasEmissiveColor = (material.emissive.r + material.emissive.g + material.emissive.b) > 0.0001;
                                const extensionStrength = Number(
                                    material
                                    && material.userData
                                    && material.userData.gltfExtensions
                                    && material.userData.gltfExtensions.KHR_materials_emissive_strength
                                    && material.userData.gltfExtensions.KHR_materials_emissive_strength.emissiveStrength
                                );
                                const baseEmissiveIntensity = Number.isFinite(material.emissiveIntensity)
                                    ? material.emissiveIntensity
                                    : (Number.isFinite(extensionStrength)
                                        ? extensionStrength
                                        : (hasEmissiveColor ? 1 : 0));

                                const forcedGarageIntensity = isGarageGlassMaterial
                                    ? (Number.isFinite(extensionStrength) ? extensionStrength : 10)
                                    : 0;
                                const targetIntensity = Math.max(baseEmissiveIntensity, forcedGarageIntensity);

                                if ((targetIntensity > 0 && hasEmissiveColor) || isGarageGlassMaterial) {
                                    registerIntroEmissiveMaterial(material, targetIntensity, 'environment');
                                }
                            });
                        }

                        if (node.isLight) {
                            const baseIntensity = Number.isFinite(node.intensity) ? node.intensity : 1;
                            registerIntroLight(node, baseIntensity, 'environment');
                        }
                    });

                    scene.add(garageModel);
                    alignGarageToCar();
                    garageReady = true;
                    setPreloaderProgress(0.94, 'Garage ready');
                    closePreloaderIfReady();
                },
                undefined,
                function (error) {
                    console.warn('Error loading garage GLB model:', error);
                    showPreloaderError('Failed to load garage model');
                }
            );

            loader.load(
                porscheModelPath,
                function (gltf) {
                    model = gltf.scene;
                    modelRig = new THREE.Group();
                    modelPivot = new THREE.Group();
                    scene.add(modelRig);
                    modelRig.add(modelPivot);
                    modelPivot.add(model);

                    // Enable shadow casting for all model meshes.
                    model.traverse((node) => {
                        if (node.isMesh) {
                            node.castShadow = true;
                            node.receiveShadow = true;
                        }
                    });

                    applyObject51BloomGlow(model);

                    cacheModelMaterialStates(model);

                    const detectedWheelRigs = createWheelRigs(model);
                    wheelRigs.length = 0;
                    wheelRigs.push(...detectedWheelRigs);

                    // Center the model
                    const box = new THREE.Box3().setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());
                    model.position.sub(center);
                    modelBasePosition.copy(model.position);

                    if (enableModelAnalysisLogs) {
                        analyzePorscheModel(model, gltf);
                    }
                    analyzeAndRigDoors(model);

                    // Apply manual wheel axis points after centering, then detect front wheels.
                    applyHardcodedWheelAxisPoints();
                    updateFrontWheelIndices();
                    attachMappedCalipersToWheelSteering(model);
                    applyFrontWheelSteering(steeringAngle);

                    // Add a transparent ground plane that only shows shadows.
                    const centeredBox = new THREE.Box3().setFromObject(model);
                    const modelSize = centeredBox.getSize(new THREE.Vector3());
                    const centeredBoxCenter = centeredBox.getCenter(new THREE.Vector3());
                    const groundSize = Math.max(modelSize.x, modelSize.z) * 2.1;
                    shadowMaterial = new THREE.ShadowMaterial({ opacity: fixedShadowSettings.opacity });
                    shadowCatcher = new THREE.Mesh(
                        new THREE.PlaneGeometry(groundSize, groundSize),
                        shadowMaterial
                    );
                    shadowCatcher.rotation.x = -Math.PI / 2;
                    shadowGroundBaseY = centeredBox.min.y;
                    shadowBaseCenter.copy(centeredBoxCenter);
                    shadowCatcher.position.x = shadowBaseCenter.x;
                    shadowCatcher.position.z = shadowBaseCenter.z;
                    shadowCatcher.position.y = shadowGroundBaseY + fixedShadowSettings.groundOffset;
                    shadowCatcher.receiveShadow = true;
                    modelRig.add(shadowCatcher);

                    const contactShadowSize = Math.max(modelSize.x, modelSize.z) * 0.95;
                    contactShadowMaterial = new THREE.ShadowMaterial({ opacity: defaultContactShadowOpacity });
                    contactShadowCatcher = new THREE.Mesh(
                        new THREE.PlaneGeometry(contactShadowSize, contactShadowSize),
                        contactShadowMaterial
                    );
                    contactShadowCatcher.rotation.x = -Math.PI / 2;
                    contactShadowCatcher.position.y = shadowCatcher.position.y + 0.002;
                    contactShadowCatcher.receiveShadow = true;
                    modelRig.add(contactShadowCatcher);
                    updateShadowCatchersPlacement();

                    if (keyLight) {
                        keyLight.target = modelRig;
                    }

                    if (rimLight) {
                        rimLight.target = modelRig;
                    }

                    applyPivotOffsetFromKeyframe(0);
                    applyLightFromKeyframe(0);
                    initializeInteriorCameraPresetFromModel();

                    // Add orbit controls for cursor interaction (but disable scrolling interference)
                    controls = new OrbitControls(camera, renderer.domElement);
                    controls.enableDamping = true;
                    controls.dampingFactor = 0.1;
                    controls.rotateSpeed = 0.6;
                    controls.minPolarAngle = orbitMinPolarAngle;
                    controls.maxPolarAngle = orbitMaxPolarAngle;
                    // Important: Disable orbit controls from interfering with scroll
                    controls.enablePan = false;
                    controls.enableZoom = false;
                    // Allow rotation but make it not interfere with page scroll
                    controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };

                    modelPivot.getWorldPosition(pivotWorldPosition);
                    controls.target.copy(pivotWorldPosition);
                    controls.update();

                    renderer.domElement.addEventListener('pointerdown', () => {
                        renderer.domElement.style.cursor = 'grabbing';
                    });
                    renderer.domElement.addEventListener('pointerup', () => {
                        renderer.domElement.style.cursor = 'grab';
                    });
                    renderer.domElement.addEventListener('pointerleave', () => {
                        renderer.domElement.style.cursor = 'grab';
                    });

                    setupWheelControls();
                    setupDoorControls();
                    setupDoorEnterTooltipOverlay();
                    setupWheelSteeringControls();
                    setupModelDragControls();
                    setupModelScrollAnimations(sections, modelRig, modelPivot);
                    setupCyberpunkNeonRig(modelRig);
                    setupCarDetailHotspots(model);
                    applyHardcodedManualDoorPivotWorldPoints();
                    alignGarageToCar();
                    requestShadowUpdate();
                    ScrollTrigger.refresh();

                    porscheReady = true;
                    setPreloaderProgress(0.98, 'Porsche ready');
                    closePreloaderIfReady();
                },
                undefined,
                function (error) {
                    console.error('Error loading GLB model:', error);
                    showPreloaderError('Failed to load Porsche model');
                }
            );

            // Add ambient light
            ambientLight = new THREE.AmbientLight(0x0a0a2a, defaultAmbientLightIntensity);
            scene.add(ambientLight);
            registerIntroLight(ambientLight, defaultAmbientLightIntensity);

            fillLight = new THREE.HemisphereLight(0xffffff, 0xffffff, defaultFillLightIntensity);
            fillLight.color.setRGB(
                defaultFillLightColor[0],
                defaultFillLightColor[1],
                defaultFillLightColor[2]
            );
            fillLight.groundColor.setRGB(
                defaultFillGroundColor[0],
                defaultFillGroundColor[1],
                defaultFillGroundColor[2]
            );
            scene.add(fillLight);
            registerIntroLight(fillLight, defaultFillLightIntensity);

            // Add directional light
            keyLight = new THREE.DirectionalLight(0x444488, fixedShadowSettings.intensity);
            keyLight.position.set(
                defaultLightPoint[0],
                defaultLightPoint[1],
                defaultLightPoint[2]
            );
            keyLight.castShadow = true;
            keyLight.shadow.mapSize.set(4096, 4096);
            keyLight.shadow.bias = fixedShadowSettings.bias;
            keyLight.shadow.normalBias = 0.06;
            keyLight.shadow.radius = defaultShadowRadius;
            keyLight.shadow.camera.near = 0.5;
            keyLight.shadow.camera.far = 100;
            keyLight.shadow.camera.left = -24;
            keyLight.shadow.camera.right = 24;
            keyLight.shadow.camera.top = 24;
            keyLight.shadow.camera.bottom = -24;
            scene.add(keyLight);
            registerIntroLight(keyLight, fixedShadowSettings.intensity);

            rimLight = new THREE.DirectionalLight(0x102040, defaultRimLightIntensity);
            rimLight.position.set(
                defaultRimLightPoint[0],
                defaultRimLightPoint[1],
                defaultRimLightPoint[2]
            );
            rimLight.castShadow = false;
            scene.add(rimLight);
            registerIntroLight(rimLight, defaultRimLightIntensity);

            // Handle window resize
            window.addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
                if (composer) {
                    composer.setSize(window.innerWidth, window.innerHeight);
                }
                if (bloomPass) {
                    bloomPass.setSize(window.innerWidth, window.innerHeight);
                }

                if (modelRig && modelPivot) {
                    setupModelScrollAnimations(sections, modelRig, modelPivot);
                    ScrollTrigger.refresh();
                }
            });
        }

        function animate() {
            requestAnimationFrame(animate);
            const deltaTime = animationClock.getDelta();

            if (controls) {
                if (modelPivot) {
                    modelPivot.getWorldPosition(pivotWorldPosition);
                    if (introCameraOverrideActive) {
                        controls.target.set(
                            pivotWorldPosition.x + introCameraAimOffset.x,
                            pivotWorldPosition.y + introCameraAimOffset.y,
                            pivotWorldPosition.z + introCameraAimOffset.z
                        );
                    } else {
                        controls.target.copy(pivotWorldPosition);
                    }
                }

                controls.update();
                enforceCameraAboveGarageGround();
            }

            if (!isTranslateDrag && !isRotateDrag) {
                syncPivotOffsetToSection();
            }

            if (isTranslateDrag || isRotateDrag) {
                syncActiveDragTransform();
            }

            const wheelScrollChanged = updateScrollDrivenWheelRotation(deltaTime);

            let wheelAutoChanged = false;
            if (wheelAutoSpin && wheelSpinSpeed !== 0) {
                wheelAutoChanged = rotateWheels(wheelSpinSpeed * deltaTime);
            }

            const steeringChanged = updateSteeringAnimation(deltaTime);
            const doorChanged = updateDoorAnimation(deltaTime);
            updateEngineRevDynamics(deltaTime);

            if (isTranslateDrag || isRotateDrag || wheelScrollChanged || wheelAutoChanged || steeringChanged || doorChanged) {
                requestShadowUpdate();
            }

            updateCyberpunkNeonRig(animationClock.elapsedTime);
            updateActiveDetailHotspotOverlay();
            updateDoorEnterTooltipOverlay();

            if (composer) {
                composer.render();
            } else {
                renderer.render(scene, camera);
            }
        }

        function requestShadowUpdate() {
            if (!renderer || !renderer.shadowMap || !renderer.shadowMap.enabled) {
                return;
            }

            renderer.shadowMap.needsUpdate = true;
        }

        function removeElementById(elementId) {
            const element = document.getElementById(elementId);
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
            return element;
        }

        function buildIntroDOM(showStartOverlay = true) {
            if (!document.body) {
                return;
            }

            if (!document.getElementById('letterbox-top')) {
                const topBar = document.createElement('div');
                topBar.id = 'letterbox-top';
                topBar.className = 'letterbox-bar';
                document.body.appendChild(topBar);
            }

            if (!document.getElementById('letterbox-bottom')) {
                const bottomBar = document.createElement('div');
                bottomBar.id = 'letterbox-bottom';
                bottomBar.className = 'letterbox-bar';
                document.body.appendChild(bottomBar);
            }

            if (!document.getElementById('cinematic-text')) {
                const textContainer = document.createElement('div');
                textContainer.id = 'cinematic-text';
                document.body.appendChild(textContainer);
            }

            if (!document.getElementById('skip-intro')) {
                const skipButton = document.createElement('button');
                skipButton.id = 'skip-intro';
                skipButton.textContent = 'Skip >';
                skipButton.style.display = 'none';
                skipButton.addEventListener('click', skipIntro);
                document.body.appendChild(skipButton);
            }

            if (!document.getElementById('feature-hints')) {
                const hints = document.createElement('div');
                hints.id = 'feature-hints';
                hints.innerHTML = `
                    <div class="hint-chip">Orbit</div>
                    <div class="hint-chip">S - Engine</div>
                    <div class="hint-chip">J/K/L - Doors</div>
                    <div class="hint-chip">Enter - Sit Inside</div>
                `;
                document.body.appendChild(hints);
            }

            const existingOverlay = document.getElementById('intro-overlay');
            if (showStartOverlay) {
                if (existingOverlay) {
                    existingOverlay.remove();
                }

                introActive = true;
                introSequenceHasStarted = false;

                const overlay = document.createElement('div');
                overlay.id = 'intro-overlay';
                overlay.innerHTML = `
                    <p class="intro-overlay-subtitle">Porsche 911 GT3 RS - Interactive Experience</p>
                    <button class="intro-btn pulse" id="start-experience-btn">Start Experience</button>
                `;
                document.body.appendChild(overlay);
                window.requestAnimationFrame(() => {
                    overlay.classList.add('visible');
                });

                const startButton = document.getElementById('start-experience-btn');
                if (startButton) {
                    startButton.addEventListener('click', onStartExperienceClicked, { once: true });
                }

                if (controls) {
                    controls.enabled = false;
                }
                lenis.stop();
            } else if (existingOverlay) {
                existingOverlay.remove();
            }

            introDomBuilt = true;
        }

        function orbitPosition(pivot, radiusXZ, height, angleDeg) {
            const radians = THREE.MathUtils.degToRad(angleDeg);
            return new THREE.Vector3(
                pivot.x + radiusXZ * Math.cos(radians),
                pivot.y + height,
                pivot.z + radiusXZ * Math.sin(radians)
            );
        }

        function createCubicBezierEase(x1, y1, x2, y2) {
            const points = [x1, y1, x2, y2].map((value) => Number(value));
            if (!points.every((value) => Number.isFinite(value))) {
                return (progress) => Math.min(1, Math.max(0, progress));
            }

            const clampedX1 = Math.min(1, Math.max(0, points[0]));
            const clampedX2 = Math.min(1, Math.max(0, points[2]));
            const yPoint1 = points[1];
            const yPoint2 = points[3];

            const cx = 3 * clampedX1;
            const bx = 3 * (clampedX2 - clampedX1) - cx;
            const ax = 1 - cx - bx;

            const cy = 3 * yPoint1;
            const by = 3 * (yPoint2 - yPoint1) - cy;
            const ay = 1 - cy - by;

            const sampleCurveX = (t) => ((ax * t + bx) * t + cx) * t;
            const sampleCurveY = (t) => ((ay * t + by) * t + cy) * t;
            const sampleCurveDerivativeX = (t) => (3 * ax * t + 2 * bx) * t + cx;

            function solveCurveX(x) {
                let t = x;
                for (let i = 0; i < 8; i += 1) {
                    const slope = sampleCurveDerivativeX(t);
                    if (Math.abs(slope) < 1e-6) {
                        break;
                    }

                    const delta = sampleCurveX(t) - x;
                    t -= delta / slope;
                }

                let lower = 0;
                let upper = 1;
                t = Math.min(1, Math.max(0, t));

                for (let i = 0; i < 10; i += 1) {
                    const delta = sampleCurveX(t) - x;
                    if (Math.abs(delta) < 1e-6) {
                        break;
                    }

                    if (delta > 0) {
                        upper = t;
                    } else {
                        lower = t;
                    }

                    t = (lower + upper) * 0.5;
                }

                return t;
            }

            return (progress) => {
                const clampedProgress = Math.min(1, Math.max(0, progress));
                if (clampedProgress === 0 || clampedProgress === 1) {
                    return clampedProgress;
                }

                return sampleCurveY(solveCurveX(clampedProgress));
            };
        }

        function getIntroLightCollection(group = 'environment') {
            return group === 'neon'
                ? introNeonLightTargets
                : introEnvironmentLightTargets;
        }

        function getIntroEmissiveCollection(group = 'environment') {
            return group === 'neon'
                ? introNeonEmissiveTargets
                : introEnvironmentEmissiveTargets;
        }

        function getIntroSelfLitCollection(group = 'environment') {
            return group === 'neon'
                ? introNeonSelfLitTargets
                : introEnvironmentSelfLitTargets;
        }

        function registerIntroLight(light, targetIntensity, group = 'environment') {
            if (!light || !Number.isFinite(targetIntensity)) {
                return false;
            }

            const safeIntensity = Math.max(0, Number(targetIntensity) || 0);
            const lightCollection = getIntroLightCollection(group);
            const existingEntry = lightCollection.find((entry) => entry.light === light);

            if (existingEntry) {
                existingEntry.targetIntensity = safeIntensity;
            } else {
                lightCollection.push({
                    light,
                    targetIntensity: safeIntensity
                });
            }

            light.intensity = 0;
            return true;
        }

        function registerIntroEmissiveMaterial(material, targetEmissiveIntensity, group = 'environment') {
            if (
                !material
                || !material.emissive
                || !Number.isFinite(targetEmissiveIntensity)
            ) {
                return false;
            }

            const safeIntensity = Math.max(0, Number(targetEmissiveIntensity) || 0);
            const emissiveCollection = getIntroEmissiveCollection(group);
            const existingEntry = emissiveCollection.find((entry) => entry.material === material);
            const targetEmissiveColor = material.emissive.clone();

            if (existingEntry) {
                existingEntry.targetEmissiveIntensity = safeIntensity;
                existingEntry.targetEmissiveColor.copy(targetEmissiveColor);
            } else {
                emissiveCollection.push({
                    material,
                    targetEmissiveIntensity: safeIntensity,
                    targetEmissiveColor
                });
            }

            material.emissive.setRGB(0, 0, 0);
            material.emissiveIntensity = 0;
            material.needsUpdate = true;
            return true;
        }

        function registerIntroSelfLitMaterial(material, group = 'environment') {
            if (!material || !material.color || !material.color.isColor) {
                return false;
            }

            const selfLitCollection = getIntroSelfLitCollection(group);
            const existingEntry = selfLitCollection.find((entry) => entry.material === material);
            const targetColor = material.color.clone();

            if (existingEntry) {
                existingEntry.targetColor.copy(targetColor);
            } else {
                selfLitCollection.push({
                    material,
                    targetColor
                });
            }

            material.color.setRGB(0, 0, 0);
            material.needsUpdate = true;
            return true;
        }

        function registerGarageSurfaceMaterial(material) {
            if (!material || !material.color || !material.color.isColor) {
                return false;
            }

            const existingEntry = introGarageSurfaceTargets.find((entry) => entry.material === material);
            const targetColor = material.color.clone();
            const targetEmissiveColor = (material.emissive && material.emissive.isColor)
                ? material.emissive.clone()
                : null;
            const targetEmissiveIntensity = Number.isFinite(material.emissiveIntensity)
                ? material.emissiveIntensity
                : null;

            if (existingEntry) {
                existingEntry.targetColor.copy(targetColor);
                existingEntry.targetEmissiveColor = targetEmissiveColor;
                existingEntry.targetEmissiveIntensity = targetEmissiveIntensity;
            } else {
                introGarageSurfaceTargets.push({
                    material,
                    targetColor,
                    targetEmissiveColor,
                    targetEmissiveIntensity
                });
            }

            material.color.setRGB(
                garageSurfaceOffColor[0],
                garageSurfaceOffColor[1],
                garageSurfaceOffColor[2]
            );

            if (material.emissive && material.emissive.isColor) {
                material.emissive.setRGB(0, 0, 0);
            }

            if (Number.isFinite(material.emissiveIntensity)) {
                material.emissiveIntensity = 0;
            }

            material.needsUpdate = true;
            return true;
        }

        function forceGarageSurfaceOff() {
            introGarageSurfaceTargets.forEach(({ material }) => {
                if (!material || !material.color || !material.color.isColor) {
                    return;
                }

                material.color.setRGB(
                    garageSurfaceOffColor[0],
                    garageSurfaceOffColor[1],
                    garageSurfaceOffColor[2]
                );

                if (material.emissive && material.emissive.isColor) {
                    material.emissive.setRGB(0, 0, 0);
                }

                if (Number.isFinite(material.emissiveIntensity)) {
                    material.emissiveIntensity = 0;
                }

                material.needsUpdate = true;
            });
        }

        function restoreGarageSurfaceOn(duration = 0) {
            introGarageSurfaceTargets.forEach(({ material, targetColor, targetEmissiveColor, targetEmissiveIntensity }) => {
                if (!material || !material.color || !material.color.isColor) {
                    return;
                }

                const applyImmediately = !Number.isFinite(duration) || duration <= 0 || typeof gsap === 'undefined';
                if (applyImmediately) {
                    material.color.copy(targetColor);

                    if (material.emissive && material.emissive.isColor && targetEmissiveColor) {
                        material.emissive.copy(targetEmissiveColor);
                    }

                    if (targetEmissiveIntensity !== null && Number.isFinite(material.emissiveIntensity)) {
                        material.emissiveIntensity = targetEmissiveIntensity;
                    }

                    material.needsUpdate = true;
                    return;
                }

                gsap.to(material.color, {
                    r: targetColor.r,
                    g: targetColor.g,
                    b: targetColor.b,
                    duration,
                    ease: cinematicCameraEase,
                    onUpdate: () => {
                        material.needsUpdate = true;
                    }
                });

                if (material.emissive && material.emissive.isColor && targetEmissiveColor) {
                    gsap.to(material.emissive, {
                        r: targetEmissiveColor.r,
                        g: targetEmissiveColor.g,
                        b: targetEmissiveColor.b,
                        duration,
                        ease: cinematicCameraEase,
                        onUpdate: () => {
                            material.needsUpdate = true;
                        }
                    });
                }

                if (targetEmissiveIntensity !== null && Number.isFinite(material.emissiveIntensity)) {
                    gsap.to(material, {
                        emissiveIntensity: targetEmissiveIntensity,
                        duration,
                        ease: cinematicCameraEase,
                        onUpdate: () => {
                            material.needsUpdate = true;
                        }
                    });
                }
            });
        }

        function registerGarageReflectionMaterial(material) {
            if (!material) {
                return false;
            }

            const supportsEnvMapIntensity = Number.isFinite(material.envMapIntensity);
            const supportsRoughness = Number.isFinite(material.roughness);
            const supportsMetalness = Number.isFinite(material.metalness);

            const baseEnvMapIntensity = supportsEnvMapIntensity ? material.envMapIntensity : null;
            const baseRoughness = supportsRoughness ? material.roughness : null;
            const baseMetalness = supportsMetalness ? material.metalness : null;

            const hasReflectiveResponse = (baseEnvMapIntensity !== null && baseEnvMapIntensity > 0.0001)
                || (baseMetalness !== null && baseMetalness > 0.0001);

            if (!hasReflectiveResponse) {
                return false;
            }

            const existingEntry = introGarageReflectionTargets.find((entry) => entry.material === material);
            if (existingEntry) {
                existingEntry.baseEnvMapIntensity = baseEnvMapIntensity;
                existingEntry.baseRoughness = baseRoughness;
                existingEntry.baseMetalness = baseMetalness;
            } else {
                introGarageReflectionTargets.push({
                    material,
                    baseEnvMapIntensity,
                    baseRoughness,
                    baseMetalness
                });
            }

            if (supportsEnvMapIntensity) {
                material.envMapIntensity = 0;
            }
            if (supportsMetalness) {
                material.metalness = 0;
            }
            if (supportsRoughness) {
                material.roughness = 1;
            }
            material.needsUpdate = true;
            return true;
        }

        function forceGarageReflectionOff() {
            introGarageReflectionTargets.forEach(({ material }) => {
                if (!material) {
                    return;
                }

                if (Number.isFinite(material.envMapIntensity)) {
                    material.envMapIntensity = 0;
                }
                if (Number.isFinite(material.metalness)) {
                    material.metalness = 0;
                }
                if (Number.isFinite(material.roughness)) {
                    material.roughness = 1;
                }
                material.needsUpdate = true;
            });
        }

        function restoreGarageReflectionOn(duration = 0) {
            introGarageReflectionTargets.forEach(({ material, baseEnvMapIntensity, baseRoughness, baseMetalness }) => {
                if (!material) {
                    return;
                }

                const applyImmediately = !Number.isFinite(duration) || duration <= 0 || typeof gsap === 'undefined';
                if (applyImmediately) {
                    if (baseEnvMapIntensity !== null && Number.isFinite(material.envMapIntensity)) {
                        material.envMapIntensity = baseEnvMapIntensity;
                    }
                    if (baseMetalness !== null && Number.isFinite(material.metalness)) {
                        material.metalness = baseMetalness;
                    }
                    if (baseRoughness !== null && Number.isFinite(material.roughness)) {
                        material.roughness = baseRoughness;
                    }
                    material.needsUpdate = true;
                    return;
                }

                const tweenVars = {
                    duration,
                    ease: cinematicCameraEase,
                    onUpdate: () => {
                        material.needsUpdate = true;
                    }
                };

                if (baseEnvMapIntensity !== null && Number.isFinite(material.envMapIntensity)) {
                    tweenVars.envMapIntensity = baseEnvMapIntensity;
                }
                if (baseMetalness !== null && Number.isFinite(material.metalness)) {
                    tweenVars.metalness = baseMetalness;
                }
                if (baseRoughness !== null && Number.isFinite(material.roughness)) {
                    tweenVars.roughness = baseRoughness;
                }

                gsap.to(material, tweenVars);
            });
        }

        function forEachGaragePrimaryLightMaterial(callback) {
            if (!garageModel || typeof callback !== 'function') {
                return 0;
            }

            let processedCount = 0;

            garageModel.traverse((node) => {
                if (!node || !node.isMesh) {
                    return;
                }

                const nodeName = typeof node.name === 'string' ? node.name.toLowerCase() : '';
                const nodeMatched = nodeName === garagePrimaryLightNodeName
                    || nodeName.includes(garagePrimaryLightNodeName)
                    || nodeName === garagePrimaryLightMeshName
                    || nodeName.includes(garagePrimaryLightMeshName);

                const materials = Array.isArray(node.material)
                    ? node.material
                    : [node.material];

                materials.forEach((material) => {
                    if (!material) {
                        return;
                    }

                    const materialName = typeof material.name === 'string' ? material.name.toLowerCase() : '';
                    const materialMatched = materialName === garagePrimaryLightMaterialName
                        || materialName.includes(garagePrimaryLightMaterialName);

                    if (!nodeMatched && !materialMatched) {
                        return;
                    }

                    callback(material, node);
                    processedCount += 1;
                });
            });

            return processedCount;
        }

        function forceGaragePrimaryLightOff() {
            forEachGaragePrimaryLightMaterial((material) => {
                if (material.color && material.color.isColor) {
                    material.color.setRGB(0, 0, 0);
                }

                if (material.emissive && material.emissive.isColor) {
                    material.emissive.setRGB(0, 0, 0);
                }

                if (Number.isFinite(material.emissiveIntensity)) {
                    material.emissiveIntensity = 0;
                }

                if (
                    material.userData
                    && material.userData.gltfExtensions
                    && material.userData.gltfExtensions.KHR_materials_emissive_strength
                ) {
                    material.userData.gltfExtensions.KHR_materials_emissive_strength.emissiveStrength = 0;
                }

                material.needsUpdate = true;
            });
        }

        function restoreGaragePrimaryLightOn() {
            forEachGaragePrimaryLightMaterial((material) => {
                if (material.emissive && material.emissive.isColor) {
                    material.emissive.setRGB(
                        garagePrimaryLightEmissiveColor[0],
                        garagePrimaryLightEmissiveColor[1],
                        garagePrimaryLightEmissiveColor[2]
                    );
                }

                material.emissiveIntensity = garagePrimaryLightEmissiveStrength;

                if (
                    material.userData
                    && material.userData.gltfExtensions
                    && material.userData.gltfExtensions.KHR_materials_emissive_strength
                ) {
                    material.userData.gltfExtensions.KHR_materials_emissive_strength.emissiveStrength = garagePrimaryLightEmissiveStrength;
                }

                material.needsUpdate = true;
            });
        }

        function setIntroEnvironmentIntensityScale(scale) {
            applyMaterialSurfaceLook(Math.max(0, Number(scale) || 0), defaultMinimumRoughness, true);
        }

        function turnOffAllIntroLights() {
            [...introEnvironmentLightTargets, ...introNeonLightTargets].forEach(({ light }) => {
                if (light) {
                    light.intensity = 0;
                }
            });

            [...introEnvironmentEmissiveTargets, ...introNeonEmissiveTargets].forEach(({ material }) => {
                if (!material || !material.emissive) {
                    return;
                }

                material.emissive.setRGB(0, 0, 0);
                material.emissiveIntensity = 0;
                material.needsUpdate = true;
            });

            [...introEnvironmentSelfLitTargets, ...introNeonSelfLitTargets].forEach(({ material }) => {
                if (!material || !material.color || !material.color.isColor) {
                    return;
                }

                material.color.setRGB(0, 0, 0);
                material.needsUpdate = true;
            });

            forceGaragePrimaryLightOff();
            forceGarageSurfaceOff();
            forceGarageReflectionOff();

            setIntroEnvironmentIntensityScale(0);
        }

        function revealIntroLightsOneByOne() {
            if (introLightRevealCompleted || typeof gsap === 'undefined') {
                introLightRevealCompleted = true;
                neonFlickerEnabled = true;
                restoreGaragePrimaryLightOn();
                restoreGarageSurfaceOn(0);
                restoreGarageReflectionOn(0);
                setIntroEnvironmentIntensityScale(defaultEnvironmentIntensityScale);
                return Promise.resolve();
            }

            if (
                !introEnvironmentLightTargets.length
                && !introNeonLightTargets.length
                && !introEnvironmentEmissiveTargets.length
                && !introNeonEmissiveTargets.length
                && !introEnvironmentSelfLitTargets.length
                && !introNeonSelfLitTargets.length
                && !introGarageSurfaceTargets.length
                && !introGarageReflectionTargets.length
            ) {
                introLightRevealCompleted = true;
                neonFlickerEnabled = true;
                restoreGaragePrimaryLightOn();
                restoreGarageSurfaceOn(0);
                restoreGarageReflectionOn(0);
                setIntroEnvironmentIntensityScale(defaultEnvironmentIntensityScale);
                return Promise.resolve();
            }

            if (introLightRevealTimeline) {
                introLightRevealTimeline.kill();
                introLightRevealTimeline = null;
            }

            neonFlickerEnabled = false;
            turnOffAllIntroLights();

            return new Promise((resolve) => {
                const timeline = gsap.timeline({
                    onComplete: () => {
                        introLightRevealTimeline = null;
                        introLightRevealCompleted = true;
                        neonFlickerEnabled = true;
                        restoreGarageSurfaceOn(0);
                        restoreGarageReflectionOn(0);
                        setIntroEnvironmentIntensityScale(defaultEnvironmentIntensityScale);
                        resolve();
                    }
                });

                let revealOffset = 0;

                // Sequence 1: all garage.glb lights first.
                timeline.add(() => {
                    restoreGaragePrimaryLightOn();
                    restoreGarageSurfaceOn(introLightRevealStepDuration);
                    restoreGarageReflectionOn(introLightRevealStepDuration);
                    playIntroLightTurnOnSound(introLightTurnOnAudioVolume);
                }, revealOffset);
                revealOffset += introLightRevealStepDuration;

                introEnvironmentLightTargets.forEach(({ light, targetIntensity }) => {
                    timeline.add(() => {
                        playIntroLightTurnOnSound(introLightTurnOnAudioVolume);
                    }, revealOffset);
                    timeline.to(light, {
                        intensity: targetIntensity,
                        duration: introLightRevealStepDuration,
                        ease: cinematicCameraEase
                    }, revealOffset);
                    revealOffset += introLightRevealStepDuration;
                });

                introEnvironmentEmissiveTargets.forEach(({ material, targetEmissiveIntensity, targetEmissiveColor }) => {
                    timeline.add(() => {
                        playIntroLightTurnOnSound(introLightTurnOnAudioVolume);
                    }, revealOffset);
                    timeline.to(material, {
                        emissiveIntensity: targetEmissiveIntensity,
                        duration: introLightRevealStepDuration,
                        ease: cinematicCameraEase,
                        onUpdate: () => {
                            material.needsUpdate = true;
                        }
                    }, revealOffset);

                    if (material && material.emissive && targetEmissiveColor) {
                        timeline.to(material.emissive, {
                            r: targetEmissiveColor.r,
                            g: targetEmissiveColor.g,
                            b: targetEmissiveColor.b,
                            duration: introLightRevealStepDuration,
                            ease: cinematicCameraEase,
                            onUpdate: () => {
                                material.needsUpdate = true;
                            }
                        }, revealOffset);
                    }

                    revealOffset += introLightRevealStepDuration;
                });

                introEnvironmentSelfLitTargets.forEach(({ material, targetColor }) => {
                    timeline.add(() => {
                        playIntroLightTurnOnSound(introLightTurnOnAudioVolume);
                    }, revealOffset);
                    timeline.to(material.color, {
                        r: targetColor.r,
                        g: targetColor.g,
                        b: targetColor.b,
                        duration: introLightRevealStepDuration,
                        ease: cinematicCameraEase,
                        onUpdate: () => {
                            material.needsUpdate = true;
                        }
                    }, revealOffset);
                    revealOffset += introLightRevealStepDuration;
                });

                // Sequence 2: environment light ramp after garage.glb lights.
                const environmentIntensityProxy = { value: 0 };
                timeline.add(() => {
                    playIntroLightTurnOnSound(introLightTurnOnAudioVolume);
                }, revealOffset);
                timeline.to(environmentIntensityProxy, {
                    value: defaultEnvironmentIntensityScale,
                    duration: introLightRevealStepDuration,
                    ease: cinematicCameraEase,
                    onUpdate: () => {
                        setIntroEnvironmentIntensityScale(environmentIntensityProxy.value);
                    }
                }, revealOffset);
                revealOffset += introLightRevealStepDuration;

                // Sequence 3: neon lights last.

                introNeonLightTargets.forEach(({ light, targetIntensity }) => {
                    timeline.add(() => {
                        playIntroLightTurnOnSound(introLightTurnOnAudioVolume);
                    }, revealOffset);
                    timeline.to(light, {
                        intensity: targetIntensity,
                        duration: introLightRevealStepDuration,
                        ease: cinematicCameraEase
                    }, revealOffset);
                    revealOffset += introLightRevealStepDuration;
                });

                introNeonEmissiveTargets.forEach(({ material, targetEmissiveIntensity, targetEmissiveColor }) => {
                    timeline.add(() => {
                        playIntroLightTurnOnSound(introLightTurnOnAudioVolume);
                    }, revealOffset);
                    timeline.to(material, {
                        emissiveIntensity: targetEmissiveIntensity,
                        duration: introLightRevealStepDuration,
                        ease: cinematicCameraEase,
                        onUpdate: () => {
                            material.needsUpdate = true;
                        }
                    }, revealOffset);

                    if (material && material.emissive && targetEmissiveColor) {
                        timeline.to(material.emissive, {
                            r: targetEmissiveColor.r,
                            g: targetEmissiveColor.g,
                            b: targetEmissiveColor.b,
                            duration: introLightRevealStepDuration,
                            ease: cinematicCameraEase,
                            onUpdate: () => {
                                material.needsUpdate = true;
                            }
                        }, revealOffset);
                    }

                    revealOffset += introLightRevealStepDuration;
                });

                introNeonSelfLitTargets.forEach(({ material, targetColor }) => {
                    timeline.add(() => {
                        playIntroLightTurnOnSound(introLightTurnOnAudioVolume);
                    }, revealOffset);
                    timeline.to(material.color, {
                        r: targetColor.r,
                        g: targetColor.g,
                        b: targetColor.b,
                        duration: introLightRevealStepDuration,
                        ease: cinematicCameraEase,
                        onUpdate: () => {
                            material.needsUpdate = true;
                        }
                    }, revealOffset);
                    revealOffset += introLightRevealStepDuration;
                });

                introLightRevealTimeline = timeline;
            });
        }

        function getShotPreset(shotKey) {
            if (!shotKey || !Object.prototype.hasOwnProperty.call(introShotPresets, shotKey)) {
                return null;
            }

            return introShotPresets[shotKey];
        }

        function applyShotImmediate(shotKey) {
            const shot = getShotPreset(shotKey);
            if (!shot || !camera || !controls) {
                return false;
            }

            if (modelPivot) {
                modelPivot.getWorldPosition(pivotWorldPosition);
            }

            const position = orbitPosition(
                pivotWorldPosition,
                shot.pos[0],
                shot.pos[1],
                shot.pos[2]
            );

            introCameraAimOffset.set(shot.aim[0], shot.aim[1], shot.aim[2]);
            introCameraOverrideActive = true;
            camera.position.copy(position);
            controls.target.set(
                pivotWorldPosition.x + introCameraAimOffset.x,
                pivotWorldPosition.y + introCameraAimOffset.y,
                pivotWorldPosition.z + introCameraAimOffset.z
            );
            controls.update();
            return true;
        }

        function tweenToShot(shotKey, duration, ease = cinematicCameraEase) {
            const shot = getShotPreset(shotKey);
            if (!shot || !camera || !controls) {
                return gsap.timeline();
            }

            if (modelPivot) {
                modelPivot.getWorldPosition(pivotWorldPosition);
            }

            const position = orbitPosition(
                pivotWorldPosition,
                shot.pos[0],
                shot.pos[1],
                shot.pos[2]
            );

            introCameraOverrideActive = true;

            return gsap.timeline()
                .to(camera.position, {
                    x: position.x,
                    y: position.y,
                    z: position.z,
                    duration,
                    ease
                }, 0)
                .to(introCameraAimOffset, {
                    x: shot.aim[0],
                    y: shot.aim[1],
                    z: shot.aim[2],
                    duration,
                    ease
                }, 0);
        }

        function snapToShot(shotKey, duration = cinematicCameraTransitionDuration, ease = cinematicCameraEase) {
            return tweenToShot(shotKey, Math.max(0.001, duration), ease);
        }

        function revertActiveSplitTextInstances() {
            if (!activeSplitTextInstances.length) {
                return;
            }

            for (const splitInstance of activeSplitTextInstances) {
                if (!splitInstance || typeof splitInstance.revert !== 'function') {
                    continue;
                }

                try {
                    splitInstance.revert();
                } catch (error) {
                    // Ignore split revert errors for already-restored nodes.
                }
            }

            activeSplitTextInstances.length = 0;
        }

        function createSplitTextForElement(element, type = 'chars') {
            if (!element) {
                return {
                    chars: [],
                    words: [],
                    revert: () => {}
                };
            }

            const splitTypeConstructor = (typeof window !== 'undefined' && typeof window.SplitType === 'function')
                ? window.SplitType
                : null;

            if (splitTypeConstructor) {
                try {
                    const splitInstance = new splitTypeConstructor(element, {
                        types: type === 'words' ? 'words' : 'chars'
                    });

                    const normalizedSplit = {
                        chars: Array.isArray(splitInstance.chars) ? splitInstance.chars : [],
                        words: Array.isArray(splitInstance.words) ? splitInstance.words : [],
                        revert: () => {
                            if (typeof splitInstance.revert === 'function') {
                                splitInstance.revert();
                                return;
                            }

                            if (typeof splitTypeConstructor.revert === 'function') {
                                splitTypeConstructor.revert(element);
                            }
                        }
                    };

                    activeSplitTextInstances.push(normalizedSplit);
                    return normalizedSplit;
                } catch (error) {
                    // Fallback to manual splitting if SplitType init fails.
                }
            }

            const originalText = element.textContent || '';
            const pieces = type === 'words'
                ? originalText.split(/\s+/).filter(Boolean)
                : Array.from(originalText);

            element.textContent = '';
            const nodes = [];

            pieces.forEach((piece, index) => {
                const span = document.createElement('span');
                span.className = type === 'words' ? 'split-word' : 'split-char';
                span.textContent = piece;
                element.appendChild(span);
                nodes.push(span);

                if (type === 'words' && index < pieces.length - 1) {
                    element.appendChild(document.createTextNode(' '));
                }
            });

            const manualSplit = {
                chars: type === 'chars' ? nodes : [],
                words: type === 'words' ? nodes : [],
                revert: () => {
                    element.textContent = originalText;
                }
            };

            activeSplitTextInstances.push(manualSplit);
            return manualSplit;
        }

        function showCinematicText(title, spec = '', holdDuration = 2) {
            const container = document.getElementById('cinematic-text');
            if (!container) {
                return gsap.timeline();
            }

            if (cinematicTextTimeline) {
                cinematicTextTimeline.kill();
                cinematicTextTimeline = null;
            }

            revertActiveSplitTextInstances();

            container.style.opacity = '1';
            container.classList.add('active');
            container.innerHTML = '';

            const timeline = gsap.timeline({
                onComplete: () => {
                    revertActiveSplitTextInstances();
                    if (cinematicTextTimeline === timeline) {
                        cinematicTextTimeline = null;
                    }
                    container.innerHTML = '';
                    container.style.opacity = '1';
                    container.classList.remove('active');
                }
            });
            cinematicTextTimeline = timeline;

            const titleLine = document.createElement('span');
            titleLine.className = 'cinematic-line title';
            titleLine.textContent = title;
            titleLine.style.opacity = '1';
            titleLine.style.transform = 'none';
            container.appendChild(titleLine);

            const titleSplit = createSplitTextForElement(titleLine, 'chars');
            const titleCharsRaw = Array.isArray(titleSplit.chars)
                ? titleSplit.chars
                : [];
            const titleChars = titleCharsRaw.length ? titleCharsRaw : [titleLine];

            timeline.fromTo(titleChars, {
                opacity: 0,
                y: 74,
                rotateX: -90,
                filter: 'blur(12px)'
            }, {
                opacity: 1,
                y: 0,
                rotateX: 0,
                filter: 'blur(0px)',
                duration: 0.95,
                ease: 'back.out(1.6)',
                stagger: {
                    each: 0.018,
                    from: 'center'
                }
            }, 0);

            if (spec) {
                const specLine = document.createElement('span');
                specLine.className = 'cinematic-line spec';
                specLine.textContent = spec;
                specLine.style.opacity = '1';
                specLine.style.transform = 'none';
                container.appendChild(specLine);

                const specSplit = createSplitTextForElement(specLine, 'words');
                const specWords = (Array.isArray(specSplit.words) && specSplit.words.length)
                    ? specSplit.words
                    : ((Array.isArray(specSplit.chars) && specSplit.chars.length) ? specSplit.chars : [specLine]);

                timeline
                    .fromTo(specWords, {
                        opacity: 0,
                        y: 16,
                        filter: 'blur(6px)'
                    }, {
                        opacity: 1,
                        y: 0,
                        filter: 'blur(0px)',
                        duration: 0.55,
                        ease: 'power2.out'
                    }, 0.16);
            }

            timeline.to(titleChars, {
                opacity: 0,
                y: -26,
                duration: 0.32,
                ease: 'power1.in',
                stagger: {
                    each: 0.01,
                    from: 'end'
                }
            }, `+=${holdDuration}`);

            timeline.to(container, {
                opacity: 0,
                duration: 0.22,
                ease: 'power1.in'
            }, '<');

            return timeline;
        }

        function flickerNeonOn() {
            const timeline = gsap.timeline();

            neonFlickerLights.forEach(({ light, baseIntensity }, index) => {
                light.intensity = 0;
                const delay = 0.05 + index * 0.08;

                for (let flickerIndex = 0; flickerIndex < 5; flickerIndex += 1) {
                    const flickerDelay = delay + flickerIndex * 0.07 + Math.random() * 0.04;
                    const flickerValue = flickerIndex % 2 === 0 ? baseIntensity * 0.6 : 0;
                    timeline.to(light, {
                        intensity: flickerValue,
                        duration: 0.04
                    }, flickerDelay);
                }

                timeline.to(light, {
                    intensity: baseIntensity,
                    duration: 0.25,
                    ease: 'power2.out'
                }, delay + 0.45);
            });

            return timeline;
        }

        function openIntroLetterbox() {
            const topBar = document.getElementById('letterbox-top');
            const bottomBar = document.getElementById('letterbox-bottom');
            if (topBar) {
                topBar.classList.add('open');
            }
            if (bottomBar) {
                bottomBar.classList.add('open');
            }
        }

        function closeIntroLetterbox() {
            const topBar = document.getElementById('letterbox-top');
            const bottomBar = document.getElementById('letterbox-bottom');
            if (topBar) {
                topBar.classList.remove('open');
            }
            if (bottomBar) {
                bottomBar.classList.remove('open');
            }
        }

        function fadeOutIntroMusic(duration = 0.8) {
            if (!introMusicNode || !introMusicNode.gain) {
                introMusicNode = null;
                return;
            }

            const activeMusicNode = introMusicNode;
            gsap.to(activeMusicNode.gain.gain, {
                value: 0,
                duration,
                onComplete: () => {
                    try {
                        activeMusicNode.source.stop();
                        activeMusicNode.source.disconnect();
                        activeMusicNode.gain.disconnect();
                    } catch (error) {
                        // Ignore already-stopped node cleanup errors.
                    }
                }
            });
            introMusicNode = null;
        }

        async function onStartExperienceClicked() {
            if (introSequenceHasStarted) {
                return;
            }

            introSequenceHasStarted = true;
            introActive = true;

            await preloadIntroAudio();

            const audioContext = getOrCreateSharedAudioContext();
            if (audioContext && audioContext.state === 'suspended') {
                try {
                    await audioContext.resume();
                } catch (error) {
                    // Resume can fail without gesture in some browsers.
                }
            }

            const overlay = document.getElementById('intro-overlay');
            if (overlay) {
                overlay.classList.remove('visible');
                window.setTimeout(() => {
                    if (overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                }, 700);
            }

            if (controls) {
                controls.enabled = false;
            }
            lenis.stop();

            await revealIntroLightsOneByOne();

            const skipButton = document.getElementById('skip-intro');
            if (skipButton) {
                skipButton.style.display = 'block';
                gsap.fromTo(skipButton, { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 0.2 });
            }

            openIntroLetterbox();
            runDirectorsCutIntro();
        }

        function runDirectorsCutIntro() {
            if (!camera || !controls) {
                return;
            }

            if (introTimeline) {
                introTimeline.kill();
                introTimeline = null;
            }

            steerLeftPressed = false;
            steerRightPressed = false;
            steeringTargetAngle = 0;
            introCameraOverrideActive = true;

            introTimeline = gsap.timeline({
                defaults: { ease: 'power2.inOut' },
                onComplete: endIntro
            });

            const timeline = introTimeline;

            timeline.add(snapToShot('wide', 2), 0);

            timeline.add(flickerNeonOn(), 0);
            timeline.add(() => {
                void startEngineAudioPlayback();
            }, 0.2);

            timeline.add(() => {
                showCinematicText('Porsche 911 GT3 RS', '', 1.6);
            }, 1.2);
            timeline.add(() => {
                introMusicNode = playPreloadedIntroAudio('cinematicDrone', 0, true);
                if (introMusicNode && introMusicNode.gain) {
                    gsap.to(introMusicNode.gain.gain, { value: 0.32, duration: 2 });
                }
            }, 1);

            timeline.add(snapToShot('lowWheel', 2), 3.5);
            timeline.add(() => {
                showCinematicText('9,000 RPM Redline', 'Motorsport-Derived Engine', 1.8);
            }, 3.7);
            timeline.add(() => {
                wheelAutoSpin = true;
                wheelSpinSpeed = 6;
            }, 3.8);

            timeline.add(snapToShot('rearWing', 2), 5.8);
            timeline.add(() => {
                showCinematicText('4.0L Naturally Aspirated Flat-Six', '510 HP - 9,000 RPM', 2);
            }, 6.0);

            timeline.add(snapToShot('sidePull', 2), 8.0);
            timeline.add(() => {
                setDoorOpenState(true);
                playPreloadedIntroAudio('doorOpen', 0.9);
            }, 8.0);
            timeline.add(() => {
                showCinematicText('Full Carbon Fibre Interior', 'Track-Ready from the Factory', 2);
            }, 8.5);
            timeline.add(() => {
                neonFlickerLights.forEach(({ light, baseIntensity }) => {
                    gsap.to(light, {
                        intensity: baseIntensity * 2.2,
                        duration: 0.15,
                        yoyo: true,
                        repeat: 1
                    });
                });
            }, 8.3);

            timeline.add(() => {
                setDoorOpenState(false);
                playPreloadedIntroAudio('doorClose', 0.84);
            }, 10.9);

            timeline.add(() => {
                introCameraOverrideActive = false;
                enterInteriorCameraMode(true);
            }, 11.0);
            timeline.add(() => {
                showCinematicText("Driver's Seat Experience", '', 1.6);
            }, 11.4);

            timeline.add(() => {
                resetInteriorCameraMode(false, false);
                introCameraOverrideActive = true;
            }, 13.2);
            timeline.add(snapToShot('heroShot', 2), 13.2);
            timeline.add(() => {
                showCinematicText('527 HP. No Compromises.', '', 2.5);
            }, 14.0);
            const heroSteeringProxy = { angle: 0 };
            timeline.add(() => {
                playPreloadedIntroAudio('heroRev', 1);
                wheelAutoSpin = true;
                wheelSpinSpeed = 12;
                neonFlickerLights.forEach(({ light, baseIntensity }) => {
                    gsap.to(light, {
                        intensity: baseIntensity * 1.8,
                        duration: 0.1,
                        yoyo: true,
                        repeat: 3,
                        ease: 'none'
                    });
                });
            }, 14.2);
            timeline.to(heroSteeringProxy, {
                angle: maxSteeringAngle,
                duration: 0.9,
                ease: 'power2.out',
                onUpdate: () => {
                    steeringTargetAngle = heroSteeringProxy.angle;
                }
            }, 14.2);

            timeline.add(() => {
                fadeOutIntroMusic(1.8);
            }, 15.8);
        }

        function activateUserControl() {
            const overlay = document.getElementById('intro-overlay');
            if (overlay) {
                overlay.classList.remove('visible');
                window.setTimeout(() => {
                    if (overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                }, 700);
            }

            introActive = false;
            introCameraOverrideActive = false;
            resetVehicleStateForTakeControl();
            if (controls) {
                controls.enabled = true;
            }
            lenis.start();

            const chips = document.querySelectorAll('.hint-chip');
            if (chips.length) {
                gsap.to(chips, {
                    opacity: 1,
                    y: 0,
                    duration: 0.5,
                    stagger: 0.12,
                    ease: 'power2.out',
                    delay: 0.3,
                    onComplete: () => {
                        gsap.to(chips, {
                            opacity: 0,
                            duration: 0.8,
                            delay: 5
                        });
                    }
                });
            }
        }

        function endIntro() {
            if (!introSequenceHasStarted) {
                return;
            }

            introTimeline = null;
            introCameraOverrideActive = false;
            steeringTargetAngle = 0;
            closeIntroLetterbox();

            const skipButton = document.getElementById('skip-intro');
            if (skipButton) {
                gsap.to(skipButton, {
                    opacity: 0,
                    duration: 0.3,
                    onComplete: () => {
                        skipButton.style.display = 'none';
                    }
                });
            }

            const textContainer = document.getElementById('cinematic-text');
            if (textContainer) {
                gsap.to(textContainer, {
                    opacity: 0,
                    duration: 0.3,
                    onComplete: () => {
                        textContainer.innerHTML = '';
                        textContainer.style.opacity = '1';
                    }
                });
            }

            fadeOutIntroMusic(0.9);

            const existingOverlay = document.getElementById('intro-overlay');
            if (existingOverlay) {
                existingOverlay.remove();
            }

            const overlay = document.createElement('div');
            overlay.id = 'intro-overlay';
            overlay.innerHTML = `
                <p class="intro-overlay-subtitle">The stage is yours</p>
                <button class="intro-btn" id="take-control-btn">Take Control</button>
                <p class="intro-overlay-secondary">
                    <span id="replay-intro">Replay Intro</span>
                </p>
            `;
            document.body.appendChild(overlay);
            window.setTimeout(() => {
                overlay.classList.add('visible');
            }, 30);

            const takeControlButton = document.getElementById('take-control-btn');
            if (takeControlButton) {
                takeControlButton.addEventListener('click', activateUserControl, { once: true });
            }

            const replayButton = document.getElementById('replay-intro');
            if (replayButton) {
                replayButton.addEventListener('click', () => {
                    overlay.classList.remove('visible');
                    window.setTimeout(() => {
                        if (overlay.parentNode) {
                            overlay.parentNode.removeChild(overlay);
                        }
                        replayIntro();
                    }, 450);
                }, { once: true });
            }
        }

        function skipIntro() {
            if (!introActive) {
                return;
            }

            if (introTimeline) {
                introTimeline.kill();
                introTimeline = null;
            }

            wheelAutoSpin = true;
            wheelSpinSpeed = 3;
            setDoorOpenState(false);
            if (interiorCameraActive) {
                resetInteriorCameraMode(false);
            }

            steerLeftPressed = false;
            steerRightPressed = false;
            steeringTargetAngle = 0;
            introCameraOverrideActive = true;
            applyShotImmediate('heroShot');
            fadeOutIntroMusic(0.6);
            void startEngineAudioPlayback();

            const textContainer = document.getElementById('cinematic-text');
            if (textContainer) {
                textContainer.innerHTML = '';
            }

            endIntro();
        }

        function replayIntro() {
            if (introTimeline) {
                introTimeline.kill();
                introTimeline = null;
            }

            introActive = true;
            introSequenceHasStarted = true;
            wheelAutoSpin = false;
            wheelSpinSpeed = 0;
            setDoorOpenState(false);
            if (interiorCameraActive) {
                resetInteriorCameraMode(false);
            }

            steerLeftPressed = false;
            steerRightPressed = false;
            steeringTargetAngle = 0;
            stopEngineAudioPlayback({ playDampedStopEffect: false });
            fadeOutIntroMusic(0.2);

            buildIntroDOM(false);

            const skipButton = document.getElementById('skip-intro');
            if (skipButton) {
                skipButton.style.display = 'block';
                skipButton.style.opacity = '1';
            }

            const textContainer = document.getElementById('cinematic-text');
            if (textContainer) {
                textContainer.innerHTML = '';
                textContainer.style.opacity = '1';
            }

            openIntroLetterbox();

            if (controls) {
                controls.enabled = false;
            }
            lenis.stop();

            introCameraOverrideActive = true;
            applyShotImmediate('wide');
            runDirectorsCutIntro();
        }

        function initCameraDebugStudio() {
            return;
            if (cameraDebugStudioReady || !camera || !controls) {
                return;
            }

            cameraDebugStudioReady = true;
            let isScrubbingIntroTimeline = false;

            const panel = document.createElement('div');
            panel.id = 'cam-debug';
            panel.innerHTML = `
                <div id="cam-debug-header">
                    <span>INTRO CAM DEBUG</span>
                    <button id="cam-debug-toggle" type="button">-</button>
                </div>
                <div id="cam-debug-body">
                    <div class="dbg-section">
                        <div class="dbg-label">Live Camera</div>
                        <div class="dbg-coords">
                            <span class="dbg-axis">X</span><span class="dbg-val" id="dbg-px">0</span>
                            <span class="dbg-axis">Y</span><span class="dbg-val" id="dbg-py">0</span>
                            <span class="dbg-axis">Z</span><span class="dbg-val" id="dbg-pz">0</span>
                        </div>
                        <div class="dbg-label" style="margin-top:8px">Target</div>
                        <div class="dbg-coords">
                            <span class="dbg-axis">X</span><span class="dbg-val aim" id="dbg-tx">0</span>
                            <span class="dbg-axis">Y</span><span class="dbg-val aim" id="dbg-ty">0</span>
                            <span class="dbg-axis">Z</span><span class="dbg-val aim" id="dbg-tz">0</span>
                        </div>
                    </div>
                    <div class="dbg-section">
                        <div class="dbg-label">Start Camera Animation</div>
                        <div class="dbg-nudge-row">
                            <button class="dbg-btn" id="dbg-intro-run" type="button">Run Intro</button>
                            <button class="dbg-btn" id="dbg-intro-playpause" type="button">Play</button>
                            <button class="dbg-btn" id="dbg-intro-replay" type="button">Replay</button>
                            <button class="dbg-btn" id="dbg-intro-skip" type="button">Skip</button>
                        </div>
                        <div class="dbg-nudge-row" style="margin-top:8px;">
                            <input class="dbg-range" id="dbg-intro-scrub" type="range" min="0" max="20" step="0.01" value="0">
                        </div>
                        <div class="dbg-label" id="dbg-intro-status" style="margin-top:6px; color:#7dd3fc;">t=0.00s · idle</div>
                        <div class="dbg-label" style="margin-top:6px">Beat Jump</div>
                        <div class="dbg-nudge-row" id="dbg-intro-beats"></div>
                    </div>
                    <div class="dbg-section">
                        <div class="dbg-label">Live Shot Editor</div>
                        <div class="dbg-nudge-row">
                            <select id="dbg-shot-select" class="dbg-select"></select>
                            <button class="dbg-btn" id="dbg-shot-load" type="button">Load</button>
                            <button class="dbg-btn" id="dbg-shot-preview" type="button">Preview</button>
                        </div>
                        <div class="dbg-grid-inputs">
                            <span class="dbg-axis">r</span><input id="dbg-shot-r" class="dbg-input" type="number" step="0.01">
                            <span class="dbg-axis">h</span><input id="dbg-shot-h" class="dbg-input" type="number" step="0.01">
                            <span class="dbg-axis">deg</span><input id="dbg-shot-deg" class="dbg-input" type="number" step="0.01">
                            <span class="dbg-axis">ax</span><input id="dbg-shot-ax" class="dbg-input" type="number" step="0.01">
                            <span class="dbg-axis">ay</span><input id="dbg-shot-ay" class="dbg-input" type="number" step="0.01">
                            <span class="dbg-axis">az</span><input id="dbg-shot-az" class="dbg-input" type="number" step="0.01">
                        </div>
                        <div class="dbg-nudge-row">
                            <button class="dbg-btn" id="dbg-shot-apply" type="button">Apply Live</button>
                            <button class="dbg-btn" id="dbg-shot-current" type="button">Use Current</button>
                        </div>
                        <div class="dbg-label" id="dbg-shot-status" style="margin-top:6px; color:#7dd3fc;">Preset: none</div>
                    </div>
                    <div class="dbg-section">
                        <div class="dbg-label">Export Values</div>
                        <div class="dbg-nudge-row">
                            <button class="dbg-btn" id="dbg-capture-current" type="button">Capture Current</button>
                            <button class="dbg-btn" id="dbg-export-beats" type="button">Export Beats</button>
                            <button class="dbg-btn" id="dbg-copy-output" type="button">Copy</button>
                        </div>
                        <textarea id="dbg-output" class="dbg-output" readonly placeholder="Timeline camera values will appear here..."></textarea>
                    </div>
                </div>
            `;
            document.body.appendChild(panel);

            const introRunButton = panel.querySelector('#dbg-intro-run');
            const introPlayPauseButton = panel.querySelector('#dbg-intro-playpause');
            const introReplayButton = panel.querySelector('#dbg-intro-replay');
            const introSkipButton = panel.querySelector('#dbg-intro-skip');
            const introScrubInput = panel.querySelector('#dbg-intro-scrub');
            const introStatusLabel = panel.querySelector('#dbg-intro-status');
            const introBeatButtons = panel.querySelector('#dbg-intro-beats');
            const captureCurrentButton = panel.querySelector('#dbg-capture-current');
            const exportBeatsButton = panel.querySelector('#dbg-export-beats');
            const copyOutputButton = panel.querySelector('#dbg-copy-output');
            const debugOutput = panel.querySelector('#dbg-output');
            const shotPresetSelect = panel.querySelector('#dbg-shot-select');
            const shotLoadButton = panel.querySelector('#dbg-shot-load');
            const shotPreviewButton = panel.querySelector('#dbg-shot-preview');
            const shotApplyButton = panel.querySelector('#dbg-shot-apply');
            const shotUseCurrentButton = panel.querySelector('#dbg-shot-current');
            const shotStatusLabel = panel.querySelector('#dbg-shot-status');
            const shotRadiusInput = panel.querySelector('#dbg-shot-r');
            const shotHeightInput = panel.querySelector('#dbg-shot-h');
            const shotAngleInput = panel.querySelector('#dbg-shot-deg');
            const shotAimXInput = panel.querySelector('#dbg-shot-ax');
            const shotAimYInput = panel.querySelector('#dbg-shot-ay');
            const shotAimZInput = panel.querySelector('#dbg-shot-az');
            const shotEditorInputs = [
                shotRadiusInput,
                shotHeightInput,
                shotAngleInput,
                shotAimXInput,
                shotAimYInput,
                shotAimZInput
            ].filter(Boolean);

            const toRounded = (value, digits = 4) => Number(value.toFixed(digits));

            let isLoadingShotInputs = false;

            const setShotStatus = (message) => {
                if (shotStatusLabel) {
                    shotStatusLabel.textContent = message;
                }
            };

            const getActiveShotKey = () => {
                if (!shotPresetSelect || !shotPresetSelect.value) {
                    return null;
                }

                return shotPresetSelect.value;
            };

            const populateShotPresetSelect = () => {
                if (!shotPresetSelect) {
                    return;
                }

                const shotKeys = Object.keys(introShotPresets);
                shotPresetSelect.innerHTML = '';

                shotKeys.forEach((shotKey) => {
                    const option = document.createElement('option');
                    option.value = shotKey;
                    option.textContent = shotKey;
                    shotPresetSelect.appendChild(option);
                });

                if (shotKeys.length) {
                    shotPresetSelect.value = shotKeys[0];
                }
            };

            const loadShotPresetToInputs = (shotKey = getActiveShotKey()) => {
                if (!shotKey || !Object.prototype.hasOwnProperty.call(introShotPresets, shotKey)) {
                    setShotStatus('Preset: unavailable');
                    return false;
                }

                const shot = introShotPresets[shotKey];
                isLoadingShotInputs = true;

                if (shotRadiusInput) {
                    shotRadiusInput.value = shot.pos[0].toFixed(4);
                }
                if (shotHeightInput) {
                    shotHeightInput.value = shot.pos[1].toFixed(4);
                }
                if (shotAngleInput) {
                    shotAngleInput.value = shot.pos[2].toFixed(4);
                }
                if (shotAimXInput) {
                    shotAimXInput.value = shot.aim[0].toFixed(4);
                }
                if (shotAimYInput) {
                    shotAimYInput.value = shot.aim[1].toFixed(4);
                }
                if (shotAimZInput) {
                    shotAimZInput.value = shot.aim[2].toFixed(4);
                }

                isLoadingShotInputs = false;
                setShotStatus(`Preset: ${shotKey}`);
                return true;
            };

            const readShotInputs = () => {
                const values = [
                    shotRadiusInput,
                    shotHeightInput,
                    shotAngleInput,
                    shotAimXInput,
                    shotAimYInput,
                    shotAimZInput
                ].map((input) => (input ? Number.parseFloat(input.value) : Number.NaN));

                if (values.some((value) => !Number.isFinite(value))) {
                    return null;
                }

                return {
                    radius: values[0],
                    height: values[1],
                    angle: values[2],
                    aimX: values[3],
                    aimY: values[4],
                    aimZ: values[5]
                };
            };

            const applyShotInputsToPreset = ({ preview = true, source = 'manual' } = {}) => {
                const shotKey = getActiveShotKey();
                if (!shotKey || !Object.prototype.hasOwnProperty.call(introShotPresets, shotKey)) {
                    return false;
                }

                const inputValues = readShotInputs();
                if (!inputValues) {
                    setShotStatus(`Preset: ${shotKey} (invalid input)`);
                    return false;
                }

                const shot = introShotPresets[shotKey];
                shot.pos[0] = inputValues.radius;
                shot.pos[1] = inputValues.height;
                shot.pos[2] = inputValues.angle;
                shot.aim[0] = inputValues.aimX;
                shot.aim[1] = inputValues.aimY;
                shot.aim[2] = inputValues.aimZ;

                if (preview) {
                    if (introTimeline && !introTimeline.paused()) {
                        introTimeline.pause();
                    }

                    introCameraOverrideActive = true;
                    applyShotImmediate(shotKey);
                }

                setShotStatus(`Preset: ${shotKey} (${source})`);
                return true;
            };

            const captureCurrentIntoShotInputs = () => {
                const shotKey = getActiveShotKey();
                if (!shotKey) {
                    return false;
                }

                if (modelPivot) {
                    modelPivot.getWorldPosition(pivotWorldPosition);
                }

                const dx = camera.position.x - pivotWorldPosition.x;
                const dz = camera.position.z - pivotWorldPosition.z;
                const radiusXZ = Math.sqrt((dx * dx) + (dz * dz));
                const angleDeg = THREE.MathUtils.radToDeg(Math.atan2(dz, dx));

                isLoadingShotInputs = true;
                if (shotRadiusInput) {
                    shotRadiusInput.value = radiusXZ.toFixed(4);
                }
                if (shotHeightInput) {
                    shotHeightInput.value = (camera.position.y - pivotWorldPosition.y).toFixed(4);
                }
                if (shotAngleInput) {
                    shotAngleInput.value = angleDeg.toFixed(4);
                }
                if (shotAimXInput) {
                    shotAimXInput.value = (controls.target.x - pivotWorldPosition.x).toFixed(4);
                }
                if (shotAimYInput) {
                    shotAimYInput.value = (controls.target.y - pivotWorldPosition.y).toFixed(4);
                }
                if (shotAimZInput) {
                    shotAimZInput.value = (controls.target.z - pivotWorldPosition.z).toFixed(4);
                }
                isLoadingShotInputs = false;

                return applyShotInputsToPreset({ preview: false, source: 'captured' });
            };

            const getCameraSnapshot = (label = 'manual') => {
                if (modelPivot) {
                    modelPivot.getWorldPosition(pivotWorldPosition);
                }

                const dx = camera.position.x - pivotWorldPosition.x;
                const dz = camera.position.z - pivotWorldPosition.z;
                const radiusXZ = Math.sqrt((dx * dx) + (dz * dz));
                const angleDeg = THREE.MathUtils.radToDeg(Math.atan2(dz, dx));

                return {
                    label,
                    time: toRounded(introTimeline ? introTimeline.time() : 0, 2),
                    camera: [
                        toRounded(camera.position.x),
                        toRounded(camera.position.y),
                        toRounded(camera.position.z)
                    ],
                    target: [
                        toRounded(controls.target.x),
                        toRounded(controls.target.y),
                        toRounded(controls.target.z)
                    ],
                    pivot: [
                        toRounded(pivotWorldPosition.x),
                        toRounded(pivotWorldPosition.y),
                        toRounded(pivotWorldPosition.z)
                    ],
                    shotPos: [
                        toRounded(radiusXZ),
                        toRounded(camera.position.y - pivotWorldPosition.y),
                        toRounded(angleDeg, 2)
                    ],
                    aimOffset: [
                        toRounded(controls.target.x - pivotWorldPosition.x),
                        toRounded(controls.target.y - pivotWorldPosition.y),
                        toRounded(controls.target.z - pivotWorldPosition.z)
                    ],
                    interiorCameraActive: Boolean(interiorCameraActive)
                };
            };

            const setOutputPayload = (payload) => {
                if (!debugOutput) {
                    return;
                }

                debugOutput.value = JSON.stringify(payload, null, 2);
            };

            const waitForIntroTimeline = (timeoutMs = 3000) => new Promise((resolve) => {
                const startedAt = performance.now();

                const pollTimeline = () => {
                    if (introTimeline) {
                        resolve(true);
                        return;
                    }

                    if ((performance.now() - startedAt) >= timeoutMs) {
                        resolve(false);
                        return;
                    }

                    window.setTimeout(pollTimeline, 50);
                };

                pollTimeline();
            });

            const runIntroForDebug = () => {
                if (!introSequenceHasStarted) {
                    void onStartExperienceClicked();
                    return;
                }

                replayIntro();
            };

            const seekIntroTimeline = (timeSeconds) => {
                if (!introTimeline) {
                    return false;
                }

                const timelineDuration = Number.isFinite(introTimeline.duration())
                    ? introTimeline.duration()
                    : 20;
                const clampedTime = THREE.MathUtils.clamp(timeSeconds, 0, timelineDuration);

                introTimeline.pause();
                introTimeline.seek(clampedTime, true);
                introCameraOverrideActive = clampedTime <= 10.95 || clampedTime >= 16;
                return true;
            };

            const exportBeatSnapshots = async () => {
                const timelineAvailable = await waitForIntroTimeline();
                if (!timelineAvailable || !introTimeline) {
                    setOutputPayload({
                        source: 'intro-camera-debugger',
                        message: 'Intro timeline is not ready. Click "Run Intro" and try again.'
                    });
                    return;
                }

                const timelineWasPaused = introTimeline.paused();
                const originalTime = introTimeline.time();

                introTimeline.pause();
                const snapshots = [];

                for (const beat of introCameraBeatMarkers) {
                    seekIntroTimeline(beat.time);
                    snapshots.push(getCameraSnapshot(beat.label));
                }

                seekIntroTimeline(originalTime);
                if (!timelineWasPaused) {
                    introTimeline.play();
                }

                setOutputPayload({
                    source: 'intro-camera-debugger',
                    generatedAt: new Date().toISOString(),
                    entries: snapshots
                });
            };

            if (introRunButton) {
                introRunButton.addEventListener('click', runIntroForDebug);
            }

            if (introReplayButton) {
                introReplayButton.addEventListener('click', () => {
                    replayIntro();
                });
            }

            if (introSkipButton) {
                introSkipButton.addEventListener('click', () => {
                    skipIntro();
                });
            }

            if (introPlayPauseButton) {
                introPlayPauseButton.addEventListener('click', () => {
                    if (!introTimeline) {
                        runIntroForDebug();
                        return;
                    }

                    if (introTimeline.paused()) {
                        introTimeline.play();
                    } else {
                        introTimeline.pause();
                    }
                });
            }

            if (introScrubInput) {
                introScrubInput.addEventListener('pointerdown', () => {
                    isScrubbingIntroTimeline = true;
                });

                introScrubInput.addEventListener('pointerup', () => {
                    isScrubbingIntroTimeline = false;
                });

                introScrubInput.addEventListener('input', () => {
                    const scrubTime = Number.parseFloat(introScrubInput.value);
                    if (Number.isFinite(scrubTime)) {
                        seekIntroTimeline(scrubTime);
                    }
                });

                introScrubInput.addEventListener('change', () => {
                    isScrubbingIntroTimeline = false;
                });
            }

            if (introBeatButtons) {
                introCameraBeatMarkers.forEach((beat) => {
                    const beatButton = document.createElement('button');
                    beatButton.className = 'dbg-btn';
                    beatButton.type = 'button';
                    beatButton.textContent = beat.label;
                    beatButton.addEventListener('click', () => {
                        if (!introTimeline) {
                            runIntroForDebug();
                            window.setTimeout(() => {
                                seekIntroTimeline(beat.time);
                            }, 150);
                            return;
                        }

                        seekIntroTimeline(beat.time);
                    });
                    introBeatButtons.appendChild(beatButton);
                });
            }

            populateShotPresetSelect();
            loadShotPresetToInputs();

            if (shotPresetSelect) {
                shotPresetSelect.addEventListener('change', () => {
                    const shotKey = getActiveShotKey();
                    loadShotPresetToInputs(shotKey);
                });
            }

            if (shotLoadButton) {
                shotLoadButton.addEventListener('click', () => {
                    loadShotPresetToInputs();
                });
            }

            if (shotPreviewButton) {
                shotPreviewButton.addEventListener('click', () => {
                    const shotKey = getActiveShotKey();
                    if (!shotKey) {
                        return;
                    }

                    if (introTimeline && !introTimeline.paused()) {
                        introTimeline.pause();
                    }

                    introCameraOverrideActive = true;
                    applyShotImmediate(shotKey);
                    setShotStatus(`Preset: ${shotKey} (preview)`);
                });
            }

            if (shotApplyButton) {
                shotApplyButton.addEventListener('click', () => {
                    applyShotInputsToPreset({ preview: true, source: 'applied' });
                });
            }

            if (shotUseCurrentButton) {
                shotUseCurrentButton.addEventListener('click', () => {
                    const applied = captureCurrentIntoShotInputs();
                    if (applied) {
                        const shotKey = getActiveShotKey();
                        setShotStatus(`Preset: ${shotKey} (captured current)`);
                    }
                });
            }

            shotEditorInputs.forEach((input) => {
                input.addEventListener('input', () => {
                    if (isLoadingShotInputs) {
                        return;
                    }

                    applyShotInputsToPreset({ preview: true, source: 'live' });
                });
            });

            if (captureCurrentButton) {
                captureCurrentButton.addEventListener('click', () => {
                    setOutputPayload({
                        source: 'intro-camera-debugger',
                        generatedAt: new Date().toISOString(),
                        entries: [getCameraSnapshot('current')]
                    });
                });
            }

            if (exportBeatsButton) {
                exportBeatsButton.addEventListener('click', () => {
                    void exportBeatSnapshots();
                });
            }

            if (copyOutputButton) {
                copyOutputButton.addEventListener('click', () => {
                    if (!debugOutput || !debugOutput.value.trim()) {
                        setOutputPayload({
                            source: 'intro-camera-debugger',
                            generatedAt: new Date().toISOString(),
                            entries: [getCameraSnapshot('current')]
                        });
                    }

                    if (!debugOutput || !debugOutput.value.trim()) {
                        return;
                    }

                    navigator.clipboard.writeText(debugOutput.value).then(() => {
                        copyOutputButton.textContent = 'Copied';
                        window.setTimeout(() => {
                            copyOutputButton.textContent = 'Copy';
                        }, 1400);
                    }).catch(() => {
                        // Ignore clipboard permission failures.
                    });
                });
            }

            const body = panel.querySelector('#cam-debug-body');
            const toggle = panel.querySelector('#cam-debug-toggle');
            if (toggle && body) {
                toggle.addEventListener('click', () => {
                    const closed = body.style.display === 'none';
                    body.style.display = closed ? 'block' : 'none';
                    toggle.textContent = closed ? '-' : '+';
                });
            }

            const updateReadout = () => {
                const px = panel.querySelector('#dbg-px');
                const py = panel.querySelector('#dbg-py');
                const pz = panel.querySelector('#dbg-pz');
                const tx = panel.querySelector('#dbg-tx');
                const ty = panel.querySelector('#dbg-ty');
                const tz = panel.querySelector('#dbg-tz');

                if (px) {
                    px.textContent = camera.position.x.toFixed(3);
                }
                if (py) {
                    py.textContent = camera.position.y.toFixed(3);
                }
                if (pz) {
                    pz.textContent = camera.position.z.toFixed(3);
                }
                if (tx) {
                    tx.textContent = controls.target.x.toFixed(3);
                }
                if (ty) {
                    ty.textContent = controls.target.y.toFixed(3);
                }
                if (tz) {
                    tz.textContent = controls.target.z.toFixed(3);
                }

                if (introTimeline) {
                    const timelineDuration = Number.isFinite(introTimeline.duration())
                        ? introTimeline.duration()
                        : 20;
                    const timelineTime = introTimeline.time();

                    if (introScrubInput) {
                        introScrubInput.max = timelineDuration.toFixed(2);
                        if (!isScrubbingIntroTimeline) {
                            introScrubInput.value = timelineTime.toFixed(2);
                        }
                    }

                    if (introStatusLabel) {
                        const timelineState = introTimeline.paused() ? 'paused' : 'playing';
                        introStatusLabel.textContent = `t=${timelineTime.toFixed(2)}s / ${timelineDuration.toFixed(2)}s · ${timelineState}`;
                    }

                    if (introPlayPauseButton) {
                        introPlayPauseButton.textContent = introTimeline.paused() ? 'Play' : 'Pause';
                    }
                } else {
                    if (introStatusLabel) {
                        introStatusLabel.textContent = introActive
                            ? 't=0.00s · preparing'
                            : 't=0.00s · idle';
                    }

                    if (introPlayPauseButton) {
                        introPlayPauseButton.textContent = 'Play';
                    }
                }

                window.requestAnimationFrame(updateReadout);
            };

            window.requestAnimationFrame(updateReadout);
        }

        function applyObject51BloomGlow(root) {
            if (!root) {
                return 0;
            }

            const targetKey = bloomGlowTargetMeshName.toLowerCase();
            let appliedCount = 0;

            const applyGlowToMaterial = (sourceMaterial) => {
                if (!sourceMaterial || typeof sourceMaterial.clone !== 'function') {
                    return sourceMaterial;
                }

                const glowMaterial = sourceMaterial.clone();
                if (!glowMaterial.emissive || typeof glowMaterial.emissive.setHex !== 'function') {
                    return glowMaterial;
                }

                glowMaterial.emissive.setHex(bloomGlowEmissiveColor);
                glowMaterial.emissiveIntensity = bloomGlowEmissiveIntensity;
                glowMaterial.needsUpdate = true;
                return glowMaterial;
            };

            root.traverse((node) => {
                if (!node || !node.isMesh || !node.name) {
                    return;
                }

                if (!node.name.toLowerCase().includes(targetKey)) {
                    return;
                }

                if (Array.isArray(node.material)) {
                    node.material = node.material.map((material) => applyGlowToMaterial(material));
                } else {
                    node.material = applyGlowToMaterial(node.material);
                }

                appliedCount += 1;
            });

            return appliedCount;
        }

        function cacheModelMaterialStates(root) {
            modelMaterialStates.length = 0;
            const seenMaterialIds = new Set();

            if (!root) {
                return;
            }

            root.traverse((node) => {
                if (!node || !node.isMesh || !node.material) {
                    return;
                }

                const materials = Array.isArray(node.material) ? node.material : [node.material];
                for (const material of materials) {
                    if (!material || seenMaterialIds.has(material.uuid)) {
                        continue;
                    }

                    seenMaterialIds.add(material.uuid);
                    modelMaterialStates.push({
                        material,
                        baseEnvMapIntensity: Number.isFinite(material.envMapIntensity) ? material.envMapIntensity : 1,
                        baseRoughness: Number.isFinite(material.roughness) ? material.roughness : null
                    });
                }
            });
        }

        function applyEnvironmentPreset() {
            if (!scene || !neutralEnvironmentTexture) {
                return;
            }

            if (scene.environment !== neutralEnvironmentTexture) {
                scene.environment = neutralEnvironmentTexture;
            }
        }

        function applyMaterialSurfaceLook(environmentIntensityScale, minimumRoughness, force = false) {
            const clampedEnvironmentIntensityScale = Math.max(0, environmentIntensityScale);
            const clampedMinimumRoughness = THREE.MathUtils.clamp(minimumRoughness, 0, 1);

            const shouldApply = force
                || Math.abs(clampedEnvironmentIntensityScale - lastAppliedEnvironmentIntensityScale) > 0.0005
                || Math.abs(clampedMinimumRoughness - lastAppliedMinimumRoughness) > 0.0005;

            if (!shouldApply) {
                return;
            }

            lastAppliedEnvironmentIntensityScale = clampedEnvironmentIntensityScale;
            lastAppliedMinimumRoughness = clampedMinimumRoughness;

            for (const entry of modelMaterialStates) {
                const material = entry.material;
                if (!material) {
                    continue;
                }

                if (Number.isFinite(material.envMapIntensity)) {
                    material.envMapIntensity = entry.baseEnvMapIntensity * clampedEnvironmentIntensityScale;
                }

                if (entry.baseRoughness !== null && Number.isFinite(material.roughness)) {
                    material.roughness = Math.max(entry.baseRoughness, clampedMinimumRoughness);
                }

                material.needsUpdate = true;
            }
        }

        // Hardcoded model keyframes per section.
        // Format: [posX, posY, posZ, rotX, rotY, rotZ]
        const modelKeyframes = [
            [-10.63, 0, -8.66, 0, 0, 0]
        ];

        // Per-section pivot offsets.
        // Format: [offsetX, offsetY, offsetZ]
        // Edit these values manually per section.
        const pivotKeyframes = [
            [0, -0.7, 0]
        ];

        // Per-section light positions.
        // Format: [lightX, lightY, lightZ]
        // Edit these values manually per section.
        const lightKeyframes = [
            [20, 20, -30]
        ];

        function updateDragPointer(event) {
            const rect = renderer.domElement.getBoundingClientRect();
            dragPointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            dragPointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        }

        function getCurrentSectionIndex() {
            if (!sections.length) {
                return 0;
            }

            if (sections.length === 1) {
                return 0;
            }

            const scrollTop = scrollContainer.scrollTop || 0;
            const viewportHeight = scrollContainer.clientHeight || window.innerHeight || 1;
            const viewportCenter = scrollTop + viewportHeight * 0.5;

            let bestIndex = 0;
            let bestDistance = Number.POSITIVE_INFINITY;

            for (let i = 0; i < sections.length; i += 1) {
                const section = sections[i];
                const sectionCenter = section.offsetTop + section.offsetHeight * 0.5;
                const distance = Math.abs(sectionCenter - viewportCenter);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestIndex = i;
                }
            }

            return bestIndex;
        }

        function applyRigPositionToKeyframe(index) {
            if (!modelRig || !modelKeyframes[index]) {
                return;
            }

            const pos = modelRig.position;
            modelKeyframes[index][0] = pos.x;
            modelKeyframes[index][1] = pos.y;
            modelKeyframes[index][2] = pos.z;
        }

        function applyRigRotationToKeyframe(index) {
            if (!modelPivot || !modelKeyframes[index]) {
                return;
            }

            const rot = modelPivot.rotation;
            modelKeyframes[index][3] = rot.x;
            modelKeyframes[index][4] = rot.y;
            modelKeyframes[index][5] = rot.z;
        }

        function applyRigTransformToKeyframe(index) {
            applyRigPositionToKeyframe(index);
            applyRigRotationToKeyframe(index);
            updateKeyframeEditorInputs();
        }

        function syncActiveDragTransform() {
            applyRigPositionToKeyframe(activeSectionIndex);
            applyRigRotationToKeyframe(activeSectionIndex);
            updateShadowCatchersPlacement();
            updateKeyframeEditorInputs();
        }

        function updateShadowCatchersPlacement() {
            if (!modelRig || !shadowCatcher) {
                return;
            }

            shadowCatcher.position.x = shadowBaseCenter.x - pivotOffset.x;
            shadowCatcher.position.z = shadowBaseCenter.z - pivotOffset.z;
            shadowCatcher.position.y = shadowGroundBaseY - pivotOffset.y + fixedShadowSettings.groundOffset;

            if (contactShadowCatcher) {
                contactShadowCatcher.position.x = shadowCatcher.position.x;
                contactShadowCatcher.position.z = shadowCatcher.position.z;
                contactShadowCatcher.position.y = shadowCatcher.position.y + 0.002;
            }
        }

        function alignGarageToCar() {
            if (!garageModel || !model) {
                return;
            }

            model.updateMatrixWorld(true);
            garageModel.updateMatrixWorld(true);

            const carBounds = new THREE.Box3().setFromObject(model);
            const garageBounds = new THREE.Box3().setFromObject(garageModel);
            if (!Number.isFinite(carBounds.min.x) || !Number.isFinite(garageBounds.min.x)) {
                return;
            }

            const carCenter = carBounds.getCenter(new THREE.Vector3());
            const garageCenter = garageBounds.getCenter(new THREE.Vector3());
            const carBottomY = carBounds.min.y;
            const garageFloorY = garageBounds.min.y;

            garageModel.position.x += (carCenter.x - garageCenter.x) + garagePlacementOffset.x;
            garageModel.position.y += (carBottomY - garageFloorY) + garagePlacementOffset.y;
            garageModel.position.z += (carCenter.z - garageCenter.z) + garagePlacementOffset.z;
            garageModel.updateMatrixWorld(true);

            const updatedGarageBounds = new THREE.Box3().setFromObject(garageModel);
            if (Number.isFinite(updatedGarageBounds.min.y)) {
                garageFloorWorldY = updatedGarageBounds.min.y;
            }

            // Use the real garage floor for contact instead of helper shadow catchers.
            if (shadowCatcher) {
                shadowCatcher.visible = false;
            }
            if (contactShadowCatcher) {
                contactShadowCatcher.visible = false;
            }

            requestShadowUpdate();
        }

        function enforceCameraAboveGarageGround() {
            if (!controls || !camera || !Number.isFinite(garageFloorWorldY)) {
                return;
            }

            const minimumCameraY = garageFloorWorldY + minimumCameraHeightAboveGarage;
            if (camera.position.y >= minimumCameraY) {
                return;
            }

            orbitOffset.subVectors(camera.position, controls.target);
            const radius = orbitOffset.length();
            if (radius <= 0.0001) {
                camera.position.y = minimumCameraY;
                return;
            }

            const minimumOffsetY = minimumCameraY - controls.target.y;
            if (Math.abs(minimumOffsetY) >= radius) {
                camera.position.y = minimumCameraY;
                return;
            }

            orbitHorizontal.set(orbitOffset.x, 0, orbitOffset.z);
            if (orbitHorizontal.lengthSq() < 0.000001) {
                orbitHorizontal.set(1, 0, 0);
            } else {
                orbitHorizontal.normalize();
            }

            const horizontalDistance = Math.sqrt(Math.max(0, radius * radius - minimumOffsetY * minimumOffsetY));
            camera.position.copy(controls.target).addScaledVector(orbitHorizontal, horizontalDistance);
            camera.position.y = minimumCameraY;
        }

        function enforceModelAboveGarageGround() {
            if (!modelRig || !model || !Number.isFinite(garageFloorWorldY)) {
                return;
            }

            model.updateMatrixWorld(true);
            const modelBounds = new THREE.Box3().setFromObject(model);
            if (!Number.isFinite(modelBounds.min.y)) {
                return;
            }

            const penetration = garageFloorWorldY - modelBounds.min.y;
            if (penetration > 0) {
                modelRig.position.y += penetration;
                model.updateMatrixWorld(true);
            }
        }

        function applyNeonPointTubeRotation(neonTube, config) {
            if (!neonTube || !config) {
                return;
            }

            neonTube.rotation.set(0, 0, 0);
            if (config.orientation === 'x') {
                neonTube.rotation.z = Math.PI / 2;
            } else if (config.orientation === 'z') {
                neonTube.rotation.x = Math.PI / 2;
            }

            neonTube.rotation.x += Number(config.rotationX) || 0;
            neonTube.rotation.y += Number(config.rotationY) || 0;
            neonTube.rotation.z += Number(config.rotationZ) || 0;
        }

        function setupCyberpunkNeonRig(anchorRoot) {
            if (cyberpunkNeonSetupDone || !anchorRoot) {
                return;
            }

            cyberpunkNeonSetupDone = true;
            neonPointEntries.length = 0;
            tubeFixtureEntries.length = 0;
            neonFlickerLights.length = 0;
            neonRigGroup = new THREE.Group();
            anchorRoot.add(neonRigGroup);

            const tubeGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4, 16);
            const tubeFixtureGeometry = new THREE.CylinderGeometry(0.075, 0.075, 5.8, 20);

            const addNeonPoint = (options) => {
                const pointLight = new THREE.PointLight(options.color, options.intensity, options.distance, options.decay);
                pointLight.position.copy(options.position);
                pointLight.castShadow = true;
                pointLight.shadow.mapSize.set(1024, 1024);
                pointLight.shadow.bias = -0.0002;
                pointLight.shadow.normalBias = 0.01;
                registerIntroLight(pointLight, options.intensity, 'neon');
                neonRigGroup.add(pointLight);

                const tubeMaterial = new THREE.MeshStandardMaterial({
                    color: 0x040404,
                    emissive: options.color,
                    emissiveIntensity: options.emissiveIntensity
                });
                const neonTube = new THREE.Mesh(tubeGeometry, tubeMaterial);
                neonTube.position.copy(options.position);
                applyNeonPointTubeRotation(neonTube, options);
                neonRigGroup.add(neonTube);

                const flickerState = {
                    light: pointLight,
                    baseIntensity: options.intensity,
                    amplitude: options.flickerAmplitude,
                    speed: options.flickerSpeed,
                    phase: options.flickerPhase
                };
                neonFlickerLights.push(flickerState);

                const entryId = options.id || `P${neonPointEntries.length + 1}`;
                neonPointEntries.push({
                    id: entryId,
                    type: 'point',
                    config: options,
                    pointLight,
                    neonTube,
                    flickerState
                });
            };

            const addTubeFixture = (options) => {
                const fixtureGroup = new THREE.Group();
                fixtureGroup.position.copy(options.position);
                fixtureGroup.rotation.set(
                    options.rotationX || 0,
                    options.rotationY || 0,
                    options.rotationZ || 0
                );
                neonRigGroup.add(fixtureGroup);

                const tubeFixtureMaterial = new THREE.MeshStandardMaterial({
                    color: 0x070707,
                    emissive: options.color,
                    emissiveIntensity: options.emissiveIntensity,
                    roughness: 0.28,
                    metalness: 0.18
                });
                const tubeFixture = new THREE.Mesh(tubeFixtureGeometry, tubeFixtureMaterial);
                tubeFixture.rotation.z = Math.PI / 2;
                fixtureGroup.add(tubeFixture);

                const fillPoint = new THREE.PointLight(options.color, options.intensity, options.distance, 2);
                fillPoint.position.set(0, 0, 0);
                fillPoint.castShadow = false;
                registerIntroLight(fillPoint, options.intensity, 'neon');
                fixtureGroup.add(fillPoint);

                const downSpot = new THREE.SpotLight(
                    options.color,
                    options.intensity * 0.48,
                    options.distance + 8,
                    Math.PI / 6,
                    0.45,
                    2
                );
                downSpot.position.set(0, 0.15, 0);
                downSpot.castShadow = false;
                registerIntroLight(downSpot, options.intensity * 0.48, 'neon');
                fixtureGroup.add(downSpot);

                const downTarget = new THREE.Object3D();
                downTarget.position.set(0, -4, 0);
                fixtureGroup.add(downTarget);
                downSpot.target = downTarget;

                const fillFlicker = {
                    light: fillPoint,
                    baseIntensity: options.intensity,
                    amplitude: options.flickerAmplitude,
                    speed: options.flickerSpeed,
                    phase: options.flickerPhase
                };
                const spotFlicker = {
                    light: downSpot,
                    baseIntensity: options.intensity * 0.48,
                    amplitude: options.flickerAmplitude * 0.42,
                    speed: options.flickerSpeed,
                    phase: options.flickerPhase + 0.7
                };
                neonFlickerLights.push(fillFlicker);
                neonFlickerLights.push(spotFlicker);

                const entryId = options.id || `T${tubeFixtureEntries.length + 1}`;
                tubeFixtureEntries.push({
                    id: entryId,
                    type: 'tube',
                    config: options,
                    fixtureGroup,
                    tubeFixture,
                    fillPoint,
                    downSpot,
                    fillFlicker,
                    spotFlicker
                });
            };

            for (const config of neonPointConfigs) {
                addNeonPoint(config);
            }

            for (const config of tubeFixtureConfigs) {
                addTubeFixture(config);
            }

            // Keep only the explicitly configured neon entries.

            if (neonDebuggerReady) {
                updateNeonDebuggerInputs();
            }
        }

        function updateCyberpunkNeonRig(elapsedTime) {
            if (!neonFlickerEnabled || !neonFlickerLights.length) {
                return;
            }

            for (const flicker of neonFlickerLights) {
                const modulation = Math.sin(elapsedTime * flicker.speed + flicker.phase) * flicker.amplitude;
                flicker.light.intensity = Math.max(0, flicker.baseIntensity + modulation);
            }
        }

        function getAllNeonEntries() {
            return [...neonPointEntries, ...tubeFixtureEntries];
        }

        function getNeonEntryById(entryId) {
            return getAllNeonEntries().find((entry) => entry.id === entryId) || null;
        }

        function applyNeonEntryState(entry) {
            if (!entry || !entry.config || !entry.config.position) {
                return;
            }

            const config = entry.config;
            const color = Number(config.color) || 0x00ffff;
            const intensity = Math.max(0, Number(config.intensity) || 0);
            const distance = Math.max(0, Number(config.distance) || 0);
            const emissiveIntensity = Math.max(0, Number(config.emissiveIntensity) || 0);
            const flickerAmplitude = Math.max(0, Number(config.flickerAmplitude) || 0);
            const flickerSpeed = Math.max(0, Number(config.flickerSpeed) || 0);
            const flickerPhase = Number(config.flickerPhase) || 0;
            const rotationX = Number(config.rotationX) || 0;
            const rotationY = Number(config.rotationY) || 0;
            const rotationZ = Number(config.rotationZ) || 0;

            if (entry.type === 'point') {
                if (entry.pointLight) {
                    entry.pointLight.color.setHex(color);
                    entry.pointLight.position.copy(config.position);
                    entry.pointLight.intensity = intensity;
                    entry.pointLight.distance = distance;
                    entry.pointLight.decay = Math.max(0, Number(config.decay) || 0);
                }

                if (entry.neonTube) {
                    entry.neonTube.position.copy(config.position);
                    applyNeonPointTubeRotation(entry.neonTube, config);

                    const tubeMaterial = entry.neonTube.material;
                    if (tubeMaterial && tubeMaterial.emissive) {
                        tubeMaterial.emissive.setHex(color);
                        tubeMaterial.emissiveIntensity = emissiveIntensity;
                        tubeMaterial.needsUpdate = true;
                    }
                }

                if (entry.flickerState) {
                    entry.flickerState.baseIntensity = intensity;
                    entry.flickerState.amplitude = flickerAmplitude;
                    entry.flickerState.speed = flickerSpeed;
                    entry.flickerState.phase = flickerPhase;
                }

                requestShadowUpdate();
                return;
            }

            if (entry.fixtureGroup) {
                entry.fixtureGroup.position.copy(config.position);
                entry.fixtureGroup.rotation.set(rotationX, rotationY, rotationZ);
            }

            if (entry.tubeFixture) {
                const fixtureMaterial = entry.tubeFixture.material;
                if (fixtureMaterial && fixtureMaterial.emissive) {
                    fixtureMaterial.emissive.setHex(color);
                    fixtureMaterial.emissiveIntensity = emissiveIntensity;
                    fixtureMaterial.needsUpdate = true;
                }
            }

            if (entry.fillPoint) {
                entry.fillPoint.color.setHex(color);
                entry.fillPoint.intensity = intensity;
                entry.fillPoint.distance = distance;
                entry.fillPoint.decay = 2;
            }

            if (entry.downSpot) {
                entry.downSpot.color.setHex(color);
                entry.downSpot.intensity = intensity * 0.48;
                entry.downSpot.distance = distance + 8;
                entry.downSpot.decay = 2;
            }

            if (entry.fillFlicker) {
                entry.fillFlicker.baseIntensity = intensity;
                entry.fillFlicker.amplitude = flickerAmplitude;
                entry.fillFlicker.speed = flickerSpeed;
                entry.fillFlicker.phase = flickerPhase;
            }

            if (entry.spotFlicker) {
                entry.spotFlicker.baseIntensity = intensity * 0.48;
                entry.spotFlicker.amplitude = flickerAmplitude * 0.42;
                entry.spotFlicker.speed = flickerSpeed;
                entry.spotFlicker.phase = flickerPhase + 0.7;
            }

            requestShadowUpdate();
        }

        function updateNeonDebuggerInputs() {
            return;
            const targetSelect = document.getElementById('neon-target');
            const inputX = document.getElementById('neon-x');
            const inputY = document.getElementById('neon-y');
            const inputZ = document.getElementById('neon-z');
            const inputIntensity = document.getElementById('neon-intensity');
            const inputDistance = document.getElementById('neon-distance');
            const inputEmissive = document.getElementById('neon-emissive');
            const inputAmp = document.getElementById('neon-amp');
            const inputSpeed = document.getElementById('neon-speed');
            const inputPhase = document.getElementById('neon-phase');
            const inputRotationX = document.getElementById('neon-rx');
            const inputRotationY = document.getElementById('neon-ry');
            const inputRotationZ = document.getElementById('neon-rz');

            if (
                !targetSelect
                || !inputX || !inputY || !inputZ
                || !inputIntensity || !inputDistance || !inputEmissive
                || !inputAmp || !inputSpeed || !inputPhase
                || !inputRotationX || !inputRotationY || !inputRotationZ
            ) {
                return;
            }

            const entries = getAllNeonEntries();
            if (!entries.length) {
                targetSelect.innerHTML = '';
                return;
            }

            const needsOptionRefresh = targetSelect.options.length !== entries.length
                || entries.some((entry, index) => {
                    const option = targetSelect.options[index];
                    return !option || option.value !== entry.id;
                });

            if (needsOptionRefresh) {
                targetSelect.innerHTML = '';
                for (const entry of entries) {
                    const option = document.createElement('option');
                    option.value = entry.id;
                    option.textContent = entry.id;
                    targetSelect.appendChild(option);
                }
            }

            if (!entries.some((entry) => entry.id === activeNeonTargetId)) {
                activeNeonTargetId = entries[0].id;
            }

            if (targetSelect.value !== activeNeonTargetId) {
                targetSelect.value = activeNeonTargetId;
            }

            const activeEntry = getNeonEntryById(activeNeonTargetId);
            if (!activeEntry || !activeEntry.config || !activeEntry.config.position) {
                return;
            }

            const setIfIdle = (input, value, digits = 2) => {
                if (document.activeElement === input) {
                    return;
                }
                input.value = Number(value).toFixed(digits);
            };

            setIfIdle(inputX, activeEntry.config.position.x, 2);
            setIfIdle(inputY, activeEntry.config.position.y, 2);
            setIfIdle(inputZ, activeEntry.config.position.z, 2);
            setIfIdle(inputIntensity, activeEntry.config.intensity, 2);
            setIfIdle(inputDistance, activeEntry.config.distance, 2);
            setIfIdle(inputEmissive, activeEntry.config.emissiveIntensity, 2);
            setIfIdle(inputAmp, activeEntry.config.flickerAmplitude, 2);
            setIfIdle(inputSpeed, activeEntry.config.flickerSpeed, 2);
            setIfIdle(inputPhase, activeEntry.config.flickerPhase, 2);
            setIfIdle(inputRotationX, activeEntry.config.rotationX || 0, 2);
            setIfIdle(inputRotationY, activeEntry.config.rotationY || 0, 2);
            setIfIdle(inputRotationZ, activeEntry.config.rotationZ || 0, 2);
        }

        function setupNeonDebuggerControls() {
            return;
            if (neonDebuggerReady) {
                return;
            }

            const targetSelect = document.getElementById('neon-target');
            const inputX = document.getElementById('neon-x');
            const inputY = document.getElementById('neon-y');
            const inputZ = document.getElementById('neon-z');
            const inputIntensity = document.getElementById('neon-intensity');
            const inputDistance = document.getElementById('neon-distance');
            const inputEmissive = document.getElementById('neon-emissive');
            const inputAmp = document.getElementById('neon-amp');
            const inputSpeed = document.getElementById('neon-speed');
            const inputPhase = document.getElementById('neon-phase');
            const inputRotationX = document.getElementById('neon-rx');
            const inputRotationY = document.getElementById('neon-ry');
            const inputRotationZ = document.getElementById('neon-rz');

            if (
                !targetSelect
                || !inputX || !inputY || !inputZ
                || !inputIntensity || !inputDistance || !inputEmissive
                || !inputAmp || !inputSpeed || !inputPhase
                || !inputRotationX || !inputRotationY || !inputRotationZ
            ) {
                return;
            }

            neonDebuggerReady = true;

            const applyInputsToActiveEntry = () => {
                const activeEntry = getNeonEntryById(activeNeonTargetId);
                if (!activeEntry || !activeEntry.config || !activeEntry.config.position) {
                    return;
                }

                const parseOrCurrent = (input, currentValue, clampMin = null) => {
                    const parsed = parseFloat(input.value);
                    if (!Number.isFinite(parsed)) {
                        return currentValue;
                    }

                    if (clampMin === null) {
                        return parsed;
                    }

                    return Math.max(clampMin, parsed);
                };

                activeEntry.config.position.set(
                    parseOrCurrent(inputX, activeEntry.config.position.x),
                    parseOrCurrent(inputY, activeEntry.config.position.y),
                    parseOrCurrent(inputZ, activeEntry.config.position.z)
                );
                activeEntry.config.intensity = parseOrCurrent(inputIntensity, activeEntry.config.intensity, 0);
                activeEntry.config.distance = parseOrCurrent(inputDistance, activeEntry.config.distance, 0);
                activeEntry.config.emissiveIntensity = parseOrCurrent(inputEmissive, activeEntry.config.emissiveIntensity, 0);
                activeEntry.config.flickerAmplitude = parseOrCurrent(inputAmp, activeEntry.config.flickerAmplitude, 0);
                activeEntry.config.flickerSpeed = parseOrCurrent(inputSpeed, activeEntry.config.flickerSpeed, 0);
                activeEntry.config.flickerPhase = parseOrCurrent(inputPhase, activeEntry.config.flickerPhase);
                activeEntry.config.rotationX = parseOrCurrent(inputRotationX, activeEntry.config.rotationX || 0);
                activeEntry.config.rotationY = parseOrCurrent(inputRotationY, activeEntry.config.rotationY || 0);
                activeEntry.config.rotationZ = parseOrCurrent(inputRotationZ, activeEntry.config.rotationZ || 0);

                applyNeonEntryState(activeEntry);
            };

            targetSelect.addEventListener('change', () => {
                activeNeonTargetId = targetSelect.value;
                updateNeonDebuggerInputs();
            });

            const bindLiveInput = (input) => {
                input.addEventListener('input', applyInputsToActiveEntry);
                input.addEventListener('change', applyInputsToActiveEntry);
            };

            bindLiveInput(inputX);
            bindLiveInput(inputY);
            bindLiveInput(inputZ);
            bindLiveInput(inputIntensity);
            bindLiveInput(inputDistance);
            bindLiveInput(inputEmissive);
            bindLiveInput(inputAmp);
            bindLiveInput(inputSpeed);
            bindLiveInput(inputPhase);
            bindLiveInput(inputRotationX);
            bindLiveInput(inputRotationY);
            bindLiveInput(inputRotationZ);

            updateNeonDebuggerInputs();
        }

        function getDetailHotspotById(hotspotId) {
            return detailHotspots.find((entry) => entry.id === hotspotId) || null;
        }

        function updateDetailHotspotDebuggerInputs() {
            return;
            const targetSelect = document.getElementById('point-target');
            const inputX = document.getElementById('point-x');
            const inputY = document.getElementById('point-y');
            const inputZ = document.getElementById('point-z');

            if (!targetSelect || !inputX || !inputY || !inputZ) {
                return;
            }

            if (!detailHotspots.length) {
                targetSelect.innerHTML = '';
                return;
            }

            const needsOptionRefresh = targetSelect.options.length !== detailHotspots.length
                || detailHotspots.some((entry, index) => {
                    const option = targetSelect.options[index];
                    return !option || option.value !== entry.id;
                });

            if (needsOptionRefresh) {
                targetSelect.innerHTML = '';
                for (const entry of detailHotspots) {
                    const option = document.createElement('option');
                    option.value = entry.id;
                    option.textContent = entry.id;
                    targetSelect.appendChild(option);
                }
            }

            if (!getDetailHotspotById(activeDetailHotspotTargetId)) {
                activeDetailHotspotTargetId = detailHotspots[0].id;
            }

            if (targetSelect.value !== activeDetailHotspotTargetId) {
                targetSelect.value = activeDetailHotspotTargetId;
            }

            const activeHotspot = getDetailHotspotById(activeDetailHotspotTargetId);
            if (!activeHotspot || !activeHotspot.mesh) {
                return;
            }

            const setIfIdle = (input, value, digits = 2) => {
                if (document.activeElement === input) {
                    return;
                }
                input.value = Number(value).toFixed(digits);
            };

            setIfIdle(inputX, activeHotspot.mesh.position.x, 2);
            setIfIdle(inputY, activeHotspot.mesh.position.y, 2);
            setIfIdle(inputZ, activeHotspot.mesh.position.z, 2);
        }

        function setupDetailHotspotDebuggerControls() {
            return;
            if (detailHotspotDebuggerReady) {
                return;
            }

            const targetSelect = document.getElementById('point-target');
            const inputX = document.getElementById('point-x');
            const inputY = document.getElementById('point-y');
            const inputZ = document.getElementById('point-z');

            if (!targetSelect || !inputX || !inputY || !inputZ) {
                return;
            }

            detailHotspotDebuggerReady = true;

            const applyInputsToActiveHotspot = () => {
                const activeHotspot = getDetailHotspotById(activeDetailHotspotTargetId);
                if (!activeHotspot || !activeHotspot.mesh) {
                    return;
                }

                const parseOrCurrent = (input, currentValue) => {
                    const parsed = parseFloat(input.value);
                    if (!Number.isFinite(parsed)) {
                        return currentValue;
                    }
                    return parsed;
                };

                activeHotspot.mesh.position.set(
                    parseOrCurrent(inputX, activeHotspot.mesh.position.x),
                    parseOrCurrent(inputY, activeHotspot.mesh.position.y),
                    parseOrCurrent(inputZ, activeHotspot.mesh.position.z)
                );

                requestShadowUpdate();
                updateActiveDetailHotspotOverlay();
            };

            targetSelect.addEventListener('change', () => {
                activeDetailHotspotTargetId = targetSelect.value;
                updateDetailHotspotDebuggerInputs();
            });

            const bindLiveInput = (input) => {
                input.addEventListener('input', applyInputsToActiveHotspot);
                input.addEventListener('change', applyInputsToActiveHotspot);
            };

            bindLiveInput(inputX);
            bindLiveInput(inputY);
            bindLiveInput(inputZ);

            updateDetailHotspotDebuggerInputs();
        }

        function applyAuthorCreditState(authorCreditEl) {
            if (!authorCreditEl) {
                return;
            }

            const setStyleIfDifferent = (propertyName, value) => {
                if (authorCreditEl.style[propertyName] !== value) {
                    authorCreditEl.style[propertyName] = value;
                }
            };

            if (authorCreditEl.id !== authorCreditId) {
                authorCreditEl.id = authorCreditId;
            }

            if (authorCreditEl.textContent !== authorCreditText) {
                authorCreditEl.textContent = authorCreditText;
            }

            setStyleIfDifferent('position', 'fixed');
            setStyleIfDifferent('right', '14px');
            setStyleIfDifferent('bottom', '14px');
            setStyleIfDifferent('zIndex', '1150');
            setStyleIfDifferent('padding', '6px 10px');
            setStyleIfDifferent('borderRadius', '999px');
            setStyleIfDifferent('background', 'rgba(0, 0, 0, 0.72)');
            setStyleIfDifferent('border', '1px solid rgba(255, 255, 255, 0.28)');
            setStyleIfDifferent('color', '#f4f8ff');
            setStyleIfDifferent('fontFamily', 'monospace');
            setStyleIfDifferent('fontSize', '12px');
            setStyleIfDifferent('letterSpacing', '0.03em');
            setStyleIfDifferent('pointerEvents', 'none');
            setStyleIfDifferent('userSelect', 'none');

            if (authorCreditEl.getAttribute('aria-label') !== authorCreditText) {
                authorCreditEl.setAttribute('aria-label', authorCreditText);
            }

            if (authorCreditEl.getAttribute('contenteditable') !== 'false') {
                authorCreditEl.setAttribute('contenteditable', 'false');
            }

            if (authorCreditEl.getAttribute('draggable') !== 'false') {
                authorCreditEl.setAttribute('draggable', 'false');
            }

            if (authorCreditEl.dataset.authorLock !== 'true') {
                authorCreditEl.dataset.authorLock = 'true';
            }
        }

        function ensureAuthorCreditElement() {
            let authorCreditEl = document.getElementById(authorCreditId);
            if (!authorCreditEl) {
                authorCreditEl = document.createElement('div');
                authorCreditEl.id = authorCreditId;
                document.body.appendChild(authorCreditEl);
            } else if (authorCreditEl.parentElement !== document.body) {
                document.body.appendChild(authorCreditEl);
            }

            applyAuthorCreditState(authorCreditEl);
            return authorCreditEl;
        }

        function setupAuthorCreditProtection() {
            const enforceAuthorCredit = () => {
                const authorCreditEl = ensureAuthorCreditElement();
                applyAuthorCreditState(authorCreditEl);
            };

            enforceAuthorCredit();

            if (!authorCreditObserver) {
                authorCreditObserver = new MutationObserver(() => {
                    enforceAuthorCredit();
                });
                authorCreditObserver.observe(document.body, {
                    childList: true
                });
            }

            const authorCreditEl = ensureAuthorCreditElement();
            if (authorCreditElementObserver) {
                authorCreditElementObserver.disconnect();
            }

            authorCreditElementObserver = new MutationObserver(() => {
                applyAuthorCreditState(authorCreditEl);
            });
            authorCreditElementObserver.observe(authorCreditEl, {
                attributes: true,
                characterData: true,
                childList: true,
                subtree: true
            });

            if (authorCreditIntegrityIntervalId === null) {
                authorCreditIntegrityIntervalId = window.setInterval(() => {
                    enforceAuthorCredit();
                }, 900);
            }

            const authorCreditSeal = Object.freeze({
                id: authorCreditId,
                author: authorCreditText
            });
            if (!Object.prototype.hasOwnProperty.call(window, '__AUTHOR_CREDIT_SEAL__')) {
                Object.defineProperty(window, '__AUTHOR_CREDIT_SEAL__', {
                    value: authorCreditSeal,
                    writable: false,
                    configurable: false,
                    enumerable: false
                });
            }
        }

        function setupDebugPanelToggle() {
            removeElementById('debug-info');
        }

        function isMobileDeviceExperience() {
            const coarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
            const userAgent = navigator.userAgent || '';
            const uaMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
            return coarsePointer || uaMobile;
        }

        function updateMobileOrientationState() {
            if (!document.body.classList.contains('mobile-device')) {
                return;
            }

            const isPortrait = window.innerHeight > window.innerWidth;
            document.body.classList.toggle('mobile-portrait', isPortrait);
        }

        async function requestMobileLandscapeLock() {
            if (typeof screen === 'undefined' || !screen.orientation || typeof screen.orientation.lock !== 'function') {
                return;
            }

            if (mobileLandscapeLockAttempted && screen.orientation.type && screen.orientation.type.startsWith('landscape')) {
                return;
            }

            mobileLandscapeLockAttempted = true;

            try {
                await screen.orientation.lock('landscape');
            } catch (error) {
                // Ignore platform/browser lock restrictions (common on iOS/Safari).
            }

            updateMobileOrientationState();
        }

        function dispatchMobileKeyToWindow(key, code, eventType = 'keydown') {
            if (!key) {
                return;
            }

            const eventInit = {
                key,
                bubbles: true,
                cancelable: true
            };

            if (code) {
                eventInit.code = code;
            }

            const keyboardEvent = new KeyboardEvent(eventType, eventInit);
            window.dispatchEvent(keyboardEvent);
        }

        function triggerMobileTapKey(key, code) {
            dispatchMobileKeyToWindow(key, code, 'keydown');
            dispatchMobileKeyToWindow(key, code, 'keyup');
        }

        function getMobileHoldKeyToken(key, code) {
            return `${key}::${code || ''}`;
        }

        function pressMobileHoldKey(key, code) {
            const token = getMobileHoldKeyToken(key, code);
            if (activeMobileHeldKeys.has(token)) {
                return;
            }

            activeMobileHeldKeys.add(token);
            dispatchMobileKeyToWindow(key, code, 'keydown');
        }

        function releaseMobileHoldKey(key, code) {
            const token = getMobileHoldKeyToken(key, code);
            if (!activeMobileHeldKeys.has(token)) {
                return;
            }

            activeMobileHeldKeys.delete(token);
            dispatchMobileKeyToWindow(key, code, 'keyup');
        }

        function releaseAllMobileHeldKeys() {
            const heldTokens = Array.from(activeMobileHeldKeys);
            for (const token of heldTokens) {
                const tokenSplitIndex = token.indexOf('::');
                const key = tokenSplitIndex >= 0 ? token.slice(0, tokenSplitIndex) : token;
                const code = tokenSplitIndex >= 0 ? token.slice(tokenSplitIndex + 2) : '';
                releaseMobileHoldKey(key, code || undefined);
            }
        }

        function setupMobileTouchControls() {
            const mobileControls = document.getElementById('mobile-controls');
            if (!mobileControls) {
                return;
            }

            const tapButtons = mobileControls.querySelectorAll('[data-mobile-key]');
            tapButtons.forEach((button) => {
                button.addEventListener('click', (event) => {
                    event.preventDefault();
                    if (document.body.classList.contains('mobile-portrait')) {
                        return;
                    }

                    const key = button.getAttribute('data-mobile-key');
                    const code = button.getAttribute('data-mobile-code');
                    triggerMobileTapKey(key, code || undefined);
                });
            });

            const holdButtons = mobileControls.querySelectorAll('[data-mobile-hold-key]');
            holdButtons.forEach((button) => {
                const key = button.getAttribute('data-mobile-hold-key');
                const code = button.getAttribute('data-mobile-hold-code');

                button.addEventListener('pointerdown', (event) => {
                    event.preventDefault();
                    if (document.body.classList.contains('mobile-portrait')) {
                        return;
                    }

                    pressMobileHoldKey(key, code || undefined);
                });

                const releaseHandler = (event) => {
                    event.preventDefault();
                    releaseMobileHoldKey(key, code || undefined);
                };

                button.addEventListener('pointerup', releaseHandler);
                button.addEventListener('pointercancel', releaseHandler);
                button.addEventListener('pointerleave', releaseHandler);
            });

            const orientationLockButton = document.getElementById('mobile-orientation-lock');
            if (orientationLockButton) {
                orientationLockButton.addEventListener('click', async (event) => {
                    event.preventDefault();
                    await requestMobileLandscapeLock();
                });
            }

            const firstInteractionHandler = async () => {
                await requestMobileLandscapeLock();
            };
            window.addEventListener('pointerdown', firstInteractionHandler, { once: true, passive: true });

            window.addEventListener('blur', () => {
                releaseAllMobileHeldKeys();
            });
        }

        function setupMobileExperience() {
            if (mobileExperienceReady || !isMobileDeviceExperience()) {
                return;
            }

            mobileExperienceReady = true;
            document.body.classList.add('mobile-device');

            updateMobileOrientationState();
            setupMobileTouchControls();

            window.addEventListener('resize', updateMobileOrientationState);
            window.addEventListener('orientationchange', async () => {
                updateMobileOrientationState();
                await requestMobileLandscapeLock();
            });

            requestMobileLandscapeLock();
        }

        function getSavedControlsVisibility() {
            try {
                const savedValue = window.localStorage.getItem(controlsVisibilityStorageKey);
                if (savedValue === 'hidden') {
                    return false;
                }

                if (savedValue === 'visible') {
                    return true;
                }
            } catch (error) {
                // Ignore localStorage errors (private mode/restrictions).
            }

            return true;
        }

        function applyControlsVisibility(isVisible) {
            controlsAreVisible = Boolean(isVisible);

            const controlsTooltip = document.getElementById('controls-tooltip');
            if (controlsTooltip) {
                controlsTooltip.style.display = controlsAreVisible ? '' : 'none';
            }

            const mobileControls = document.getElementById('mobile-controls');
            if (mobileControls) {
                mobileControls.style.display = controlsAreVisible ? '' : 'none';
            }

            const toggleButton = document.getElementById('controls-toggle-button');
            if (toggleButton) {
                toggleButton.textContent = controlsAreVisible ? 'Hide Controls' : 'Show Controls';
                toggleButton.setAttribute('aria-pressed', controlsAreVisible ? 'true' : 'false');
            }

            try {
                window.localStorage.setItem(controlsVisibilityStorageKey, controlsAreVisible ? 'visible' : 'hidden');
            } catch (error) {
                // Ignore localStorage errors (private mode/restrictions).
            }
        }

        function setupControlsToggleButton() {
            const toggleButton = document.getElementById('controls-toggle-button');
            if (!toggleButton) {
                return;
            }

            controlsAreVisible = getSavedControlsVisibility();
            applyControlsVisibility(controlsAreVisible);

            toggleButton.addEventListener('click', () => {
                applyControlsVisibility(!controlsAreVisible);
            });
        }

        function initializeInteriorCameraPresetFromModel() {
            if (interiorCameraPresetInitialized || !model) {
                return;
            }

            model.updateMatrixWorld(true);
            const modelBounds = new THREE.Box3().setFromObject(model);
            if (!Number.isFinite(modelBounds.min.x)) {
                return;
            }

            const modelSize = modelBounds.getSize(new THREE.Vector3());
            const modelCenter = modelBounds.getCenter(new THREE.Vector3());

            interiorCameraPosition.set(
                modelCenter.x + modelSize.x * 0.16,
                modelBounds.min.y + modelSize.y * 0.56,
                modelCenter.z - modelSize.z * 0.14
            );
            interiorCameraTarget.set(
                modelCenter.x + modelSize.x * 0.16,
                modelBounds.min.y + modelSize.y * 0.52,
                modelBounds.min.z + modelSize.z * 0.09
            );

            interiorCameraPresetInitialized = true;
        }

        function transitionCameraTo(targetPosition, targetLookAt, animate = true) {
            if (!camera || !controls) {
                return false;
            }

            if (cameraInteriorTransitionTween && typeof cameraInteriorTransitionTween.kill === 'function') {
                cameraInteriorTransitionTween.kill();
                cameraInteriorTransitionTween = null;
            }

            if (!animate || typeof gsap === 'undefined') {
                camera.position.copy(targetPosition);
                controls.target.copy(targetLookAt);
                controls.update();
                enforceCameraAboveGarageGround();
                return true;
            }

            const state = {
                px: camera.position.x,
                py: camera.position.y,
                pz: camera.position.z,
                tx: controls.target.x,
                ty: controls.target.y,
                tz: controls.target.z
            };

            cameraInteriorTransitionTween = gsap.to(state, {
                duration: interiorCameraTransitionDuration,
                ease: cinematicCameraEase,
                px: targetPosition.x,
                py: targetPosition.y,
                pz: targetPosition.z,
                tx: targetLookAt.x,
                ty: targetLookAt.y,
                tz: targetLookAt.z,
                onUpdate: () => {
                    camera.position.set(state.px, state.py, state.pz);
                    controls.target.set(state.tx, state.ty, state.tz);
                    controls.update();
                    enforceCameraAboveGarageGround();
                },
                onComplete: () => {
                    cameraInteriorTransitionTween = null;
                }
            });

            return true;
        }

        function shiftCameraInsideCar(animate = true) {
            return transitionCameraTo(interiorCameraPosition, interiorCameraTarget, animate);
        }

        function applyInteriorCameraDragLimits() {
            if (!controls) {
                return false;
            }

            if (!controlsOrbitStateBeforeInterior) {
                controlsOrbitStateBeforeInterior = {
                    minAzimuthAngle: controls.minAzimuthAngle,
                    maxAzimuthAngle: controls.maxAzimuthAngle,
                    minPolarAngle: controls.minPolarAngle,
                    maxPolarAngle: controls.maxPolarAngle,
                    minDistance: controls.minDistance,
                    maxDistance: controls.maxDistance,
                    rotateSpeed: controls.rotateSpeed
                };
            }

            interiorOrbitBaseOffset.copy(interiorCameraPosition).sub(interiorCameraTarget);
            if (interiorOrbitBaseOffset.lengthSq() < 0.000001) {
                interiorOrbitBaseOffset.set(0, 0, -1);
            }

            interiorOrbitSpherical.setFromVector3(interiorOrbitBaseOffset);
            const orbitRadius = Math.max(0.01, interiorOrbitSpherical.radius);
            const minPhi = 0.08;
            const maxPhi = Math.PI - 0.08;

            controls.minAzimuthAngle = interiorOrbitSpherical.theta - interiorOrbitAzimuthLimit;
            controls.maxAzimuthAngle = interiorOrbitSpherical.theta + interiorOrbitAzimuthLimit;
            controls.minPolarAngle = THREE.MathUtils.clamp(interiorOrbitSpherical.phi - interiorOrbitPolarLimit, minPhi, maxPhi);
            controls.maxPolarAngle = THREE.MathUtils.clamp(interiorOrbitSpherical.phi + interiorOrbitPolarLimit, minPhi, maxPhi);
            controls.minDistance = orbitRadius * (1 - interiorOrbitDistanceTolerance);
            controls.maxDistance = orbitRadius * (1 + interiorOrbitDistanceTolerance);
            controls.rotateSpeed = 0.38;
            controls.update();
            return true;
        }

        function clearInteriorCameraDragLimits() {
            if (!controls || !controlsOrbitStateBeforeInterior) {
                return false;
            }

            controls.minAzimuthAngle = controlsOrbitStateBeforeInterior.minAzimuthAngle;
            controls.maxAzimuthAngle = controlsOrbitStateBeforeInterior.maxAzimuthAngle;
            controls.minPolarAngle = controlsOrbitStateBeforeInterior.minPolarAngle;
            controls.maxPolarAngle = controlsOrbitStateBeforeInterior.maxPolarAngle;
            controls.minDistance = controlsOrbitStateBeforeInterior.minDistance;
            controls.maxDistance = controlsOrbitStateBeforeInterior.maxDistance;
            controls.rotateSpeed = controlsOrbitStateBeforeInterior.rotateSpeed;
            controlsOrbitStateBeforeInterior = null;
            controls.update();
            return true;
        }

        function enterInteriorCameraMode(animate = true) {
            if (!camera || !controls) {
                return false;
            }

            if (!interiorCameraActive) {
                interiorCameraReturnPosition.copy(camera.position);
                interiorCameraReturnTarget.copy(controls.target);
                interiorDoorTargetsBeforeEntry.length = 0;
                for (const door of doorRigs) {
                    interiorDoorTargetsBeforeEntry.push(door.targetRotationY);
                }

                interiorPivotKeyframesBeforeEntry.length = 0;
                const pivotSectionCount = Math.max(1, sections.length);
                for (let index = 0; index < pivotSectionCount; index += 1) {
                    const pivotFrame = getPivotKeyframe(index);
                    interiorPivotKeyframesBeforeEntry.push([
                        Number(pivotFrame[0]) || 0,
                        Number(pivotFrame[1]) || 0,
                        Number(pivotFrame[2]) || 0
                    ]);
                }

                interiorReturnSnapshotReady = true;
                interiorPivotSnapshotReady = true;
            }

            interiorCameraActive = true;
            applyInteriorCameraDragLimits();
            setActiveSectionPivotAxisValues(
                interiorAxisOffset.x,
                interiorAxisOffset.y,
                interiorAxisOffset.z
            );
            setDoorOpenState(false);
            return shiftCameraInsideCar(animate);
        }

        function resetInteriorCameraMode(animate = true, restoreReturnCamera = true) {
            if (!interiorCameraActive) {
                return false;
            }

            interiorCameraActive = false;
            clearInteriorCameraDragLimits();

            if (interiorReturnSnapshotReady && interiorDoorTargetsBeforeEntry.length === doorRigs.length) {
                for (let index = 0; index < doorRigs.length; index += 1) {
                    doorRigs[index].targetRotationY = interiorDoorTargetsBeforeEntry[index];
                }
            } else {
                setDoorOpenState(false);
            }

            if (interiorPivotSnapshotReady && interiorPivotKeyframesBeforeEntry.length) {
                for (let index = 0; index < interiorPivotKeyframesBeforeEntry.length; index += 1) {
                    const savedFrame = interiorPivotKeyframesBeforeEntry[index];
                    if (!Array.isArray(savedFrame) || savedFrame.length < 3) {
                        continue;
                    }

                    if (!Array.isArray(pivotKeyframes[index]) || pivotKeyframes[index].length < 3) {
                        pivotKeyframes[index] = [savedFrame[0], savedFrame[1], savedFrame[2]];
                        continue;
                    }

                    pivotKeyframes[index][0] = savedFrame[0];
                    pivotKeyframes[index][1] = savedFrame[1];
                    pivotKeyframes[index][2] = savedFrame[2];
                }

                activeSectionIndex = getCurrentSectionIndex();
                applyPivotOffsetFromKeyframe(activeSectionIndex);
                refreshModelTimeline();
            }

            const restored = (interiorReturnSnapshotReady && restoreReturnCamera)
                ? transitionCameraTo(interiorCameraReturnPosition, interiorCameraReturnTarget, animate)
                : false;

            interiorReturnSnapshotReady = false;
            interiorDoorTargetsBeforeEntry.length = 0;
            interiorPivotSnapshotReady = false;
            interiorPivotKeyframesBeforeEntry.length = 0;
            updateKeyframeEditorInputs();
            return restored || true;
        }

        function getMostOpenDoorState() {
            let activeDoor = null;
            let highestOpenRatio = 0;

            for (const door of doorRigs) {
                const rotationSpan = Math.abs(door.openRotationY - door.closedRotationY);
                if (rotationSpan < 0.000001) {
                    continue;
                }

                const openRatio = THREE.MathUtils.clamp(
                    Math.abs(door.currentRotationY - door.closedRotationY) / rotationSpan,
                    0,
                    1
                );

                if (openRatio > highestOpenRatio) {
                    highestOpenRatio = openRatio;
                    activeDoor = door;
                }
            }

            return {
                door: activeDoor,
                openRatio: highestOpenRatio
            };
        }

        function canShiftCameraInsideFromDoorState() {
            const openState = getMostOpenDoorState();
            if (!openState.door) {
                return false;
            }

            const doorIsTargetingOpen = Math.abs(openState.door.targetRotationY - openState.door.openRotationY) < 0.0005;
            return doorIsTargetingOpen || openState.openRatio >= doorEnterTooltipShowThreshold;
        }

        function hideDoorEnterTooltipOverlay() {
            if (!doorEnterTooltipOverlay) {
                return;
            }

            doorEnterTooltipOverlay.style.display = 'none';
            doorEnterTooltipOverlay.style.opacity = '0';
            doorEnterTooltipOverlay.style.transform = 'translate(-50%, -50%) scale(0.82)';
        }

        function setupDoorEnterTooltipOverlay() {
            if (doorEnterTooltipOverlay) {
                return;
            }

            const flickerStyleId = 'door-enter-flicker-style';
            if (!document.getElementById(flickerStyleId)) {
                const flickerStyle = document.createElement('style');
                flickerStyle.id = flickerStyleId;
                flickerStyle.textContent = `
@keyframes door-enter-flicker {
    0%, 12%, 19%, 25%, 53%, 58%, 100% { opacity: 1; filter: brightness(1); }
    14%, 56% { opacity: 0.22; filter: brightness(1.8); }
    16%, 27%, 60% { opacity: 0.82; filter: brightness(1.3); }
}`;
                document.head.appendChild(flickerStyle);
            }

            doorEnterTooltipOverlay = document.createElement('div');
            doorEnterTooltipOverlay.textContent = 'Enter';
            doorEnterTooltipOverlay.style.position = 'fixed';
            doorEnterTooltipOverlay.style.zIndex = '1060';
            doorEnterTooltipOverlay.style.padding = '7px 11px';
            doorEnterTooltipOverlay.style.borderRadius = '999px';
            doorEnterTooltipOverlay.style.border = '1px solid rgba(255, 255, 255, 0.6)';
            doorEnterTooltipOverlay.style.background = 'rgba(0, 0, 0, 0.82)';
            doorEnterTooltipOverlay.style.color = '#ffffff';
            doorEnterTooltipOverlay.style.fontFamily = 'monospace';
            doorEnterTooltipOverlay.style.fontSize = '12px';
            doorEnterTooltipOverlay.style.fontWeight = '700';
            doorEnterTooltipOverlay.style.letterSpacing = '0.07em';
            doorEnterTooltipOverlay.style.textTransform = 'uppercase';
            doorEnterTooltipOverlay.style.pointerEvents = 'none';
            doorEnterTooltipOverlay.style.boxShadow = '0 0 18px rgba(230, 240, 255, 0.45), inset 0 0 10px rgba(255, 255, 255, 0.24)';
            doorEnterTooltipOverlay.style.left = '0px';
            doorEnterTooltipOverlay.style.top = '0px';
            doorEnterTooltipOverlay.style.opacity = '0';
            doorEnterTooltipOverlay.style.transform = 'translate(-50%, -50%) scale(0.82)';
            doorEnterTooltipOverlay.style.transition = 'opacity 170ms ease, transform 170ms ease';
            doorEnterTooltipOverlay.style.animation = 'door-enter-flicker 0.85s steps(2, end) infinite';

            document.body.appendChild(doorEnterTooltipOverlay);
        }

        function updateDoorEnterTooltipOverlay() {
            if (!doorEnterTooltipOverlay || !camera) {
                hideDoorEnterTooltipOverlay();
                return;
            }

            if (interiorCameraActive) {
                doorEnterTooltipOverlay.textContent = 'Esc to escape';
                doorEnterTooltipOverlay.style.display = 'block';
                doorEnterTooltipOverlay.style.left = `${Math.round(window.innerWidth * 0.5)}px`;
                doorEnterTooltipOverlay.style.top = `${Math.round(window.innerHeight - 48)}px`;
                doorEnterTooltipOverlay.style.opacity = '1';
                doorEnterTooltipOverlay.style.transform = 'translate(-50%, -50%) scale(1)';
                return;
            }

            if (!doorRigs.length) {
                hideDoorEnterTooltipOverlay();
                return;
            }

            const openState = getMostOpenDoorState();
            const activeDoor = openState.door;
            const highestOpenRatio = openState.openRatio;
            const doorIsTargetingOpen = activeDoor
                ? Math.abs(activeDoor.targetRotationY - activeDoor.openRotationY) < 0.0005
                : false;

            if (
                !activeDoor
                || !activeDoor.pivot
                || !activeDoor.tooltipAnchorLocal
                || !doorIsTargetingOpen
                || highestOpenRatio < doorEnterTooltipShowThreshold
            ) {
                hideDoorEnterTooltipOverlay();
                return;
            }

            doorTooltipWorldPosition.copy(activeDoor.tooltipAnchorLocal);
            activeDoor.pivot.localToWorld(doorTooltipWorldPosition);

            const lateralOffset = Number.isFinite(activeDoor.tooltipOffsetDistance)
                ? activeDoor.tooltipOffsetDistance
                : 0.22;
            if (activeDoor.lateralAxis === 'z') {
                doorTooltipWorldPosition.z += activeDoor.side === 'left' ? lateralOffset : -lateralOffset;
            } else {
                doorTooltipWorldPosition.x += activeDoor.side === 'left' ? lateralOffset : -lateralOffset;
            }

            doorTooltipWorldPosition.y += Number.isFinite(activeDoor.tooltipVerticalOffset)
                ? activeDoor.tooltipVerticalOffset
                : 0.12;

            doorTooltipScreenPosition.copy(doorTooltipWorldPosition).project(camera);
            const isVisible = doorTooltipScreenPosition.z > -1 && doorTooltipScreenPosition.z < 1;
            if (!isVisible) {
                hideDoorEnterTooltipOverlay();
                return;
            }

            const screenX = (doorTooltipScreenPosition.x * 0.5 + 0.5) * window.innerWidth;
            const screenY = (-doorTooltipScreenPosition.y * 0.5 + 0.5) * window.innerHeight;
            const margin = 10;
            const clampedLeft = THREE.MathUtils.clamp(screenX, margin, window.innerWidth - margin);
            const clampedTop = THREE.MathUtils.clamp(screenY - 16, margin, window.innerHeight - margin);
            const scale = 0.82 + highestOpenRatio * 0.24;
            const opacity = THREE.MathUtils.clamp(0.32 + highestOpenRatio * 0.68, 0, 1);

            doorEnterTooltipOverlay.textContent = 'Enter';
            doorEnterTooltipOverlay.style.display = 'block';
            doorEnterTooltipOverlay.style.left = `${Math.round(clampedLeft)}px`;
            doorEnterTooltipOverlay.style.top = `${Math.round(clampedTop)}px`;
            doorEnterTooltipOverlay.style.opacity = opacity.toFixed(3);
            doorEnterTooltipOverlay.style.transform = `translate(-50%, -50%) scale(${scale.toFixed(3)})`;
        }

        function setupDetailHotspotOverlay() {
            if (detailHotspotOverlay) {
                return;
            }

            detailHotspotOverlay = document.createElement('div');
            detailHotspotOverlay.style.position = 'fixed';
            detailHotspotOverlay.style.zIndex = '1001';
            detailHotspotOverlay.style.minWidth = '190px';
            detailHotspotOverlay.style.maxWidth = '250px';
            detailHotspotOverlay.style.padding = '10px 12px';
            detailHotspotOverlay.style.borderRadius = '10px';
            detailHotspotOverlay.style.background = 'rgba(0, 0, 0, 0.82)';
            detailHotspotOverlay.style.border = '1px solid rgba(255, 255, 255, 0.45)';
            detailHotspotOverlay.style.color = '#ffffff';
            detailHotspotOverlay.style.fontFamily = 'monospace';
            detailHotspotOverlay.style.fontSize = '12px';
            detailHotspotOverlay.style.lineHeight = '1.35';
            detailHotspotOverlay.style.pointerEvents = 'none';
            detailHotspotOverlay.style.display = 'none';
            detailHotspotOverlay.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';

            detailHotspotTitleEl = document.createElement('div');
            detailHotspotTitleEl.style.fontSize = '13px';
            detailHotspotTitleEl.style.fontWeight = '700';
            detailHotspotTitleEl.style.marginBottom = '4px';
            detailHotspotTitleEl.style.letterSpacing = '0.02em';

            detailHotspotBodyEl = document.createElement('div');
            detailHotspotBodyEl.style.opacity = '0.92';

            detailHotspotOverlay.appendChild(detailHotspotTitleEl);
            detailHotspotOverlay.appendChild(detailHotspotBodyEl);
            document.body.appendChild(detailHotspotOverlay);
        }

        function showDetailHotspot(hotspot) {
            if (!hotspot || !detailHotspotOverlay || !detailHotspotTitleEl || !detailHotspotBodyEl) {
                return;
            }

            activeDetailHotspot = hotspot;
            activeDetailHotspotTargetId = hotspot.id;
            updateDetailHotspotDebuggerInputs();
            detailHotspotTitleEl.textContent = hotspot.title;
            detailHotspotBodyEl.textContent = hotspot.description;
            detailHotspotOverlay.style.display = 'block';
            updateActiveDetailHotspotOverlay();
        }

        function hideDetailHotspot() {
            activeDetailHotspot = null;
            if (detailHotspotOverlay) {
                detailHotspotOverlay.style.display = 'none';
            }
        }

        function updateActiveDetailHotspotOverlay() {
            if (!activeDetailHotspot || !activeDetailHotspot.mesh || !detailHotspotOverlay || !camera) {
                return;
            }

            activeDetailHotspot.mesh.getWorldPosition(detailHotspotWorldPosition);
            detailHotspotScreenPosition.copy(detailHotspotWorldPosition).project(camera);

            const isVisible = detailHotspotScreenPosition.z > -1 && detailHotspotScreenPosition.z < 1;
            if (!isVisible) {
                detailHotspotOverlay.style.display = 'none';
                return;
            }

            const screenX = (detailHotspotScreenPosition.x * 0.5 + 0.5) * window.innerWidth;
            const screenY = (-detailHotspotScreenPosition.y * 0.5 + 0.5) * window.innerHeight;
            const margin = 12;
            const maxLeft = Math.max(margin, window.innerWidth - 260);
            const maxTop = Math.max(margin, window.innerHeight - 140);
            const left = THREE.MathUtils.clamp(screenX + 16, margin, maxLeft);
            const top = THREE.MathUtils.clamp(screenY - 18, margin, maxTop);

            detailHotspotOverlay.style.left = `${Math.round(left)}px`;
            detailHotspotOverlay.style.top = `${Math.round(top)}px`;
            detailHotspotOverlay.style.display = 'block';
        }

        function setupDetailHotspotInteraction() {
            if (detailHotspotInteractionReady || !renderer) {
                return;
            }

            detailHotspotInteractionReady = true;

            renderer.domElement.addEventListener('pointermove', (event) => {
                if (!detailHotspots.length || !camera || isTranslateDrag || isRotateDrag || event.buttons !== 0) {
                    return;
                }

                const rect = renderer.domElement.getBoundingClientRect();
                detailHotspotPointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                detailHotspotPointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
                detailHotspotRaycaster.setFromCamera(detailHotspotPointer, camera);

                const markerMeshes = detailHotspots.flatMap((entry) => [
                    entry.mesh,
                    entry.glowMesh,
                    entry.outerGlowMesh
                ].filter(Boolean));
                const intersections = detailHotspotRaycaster.intersectObjects(markerMeshes, false);
                renderer.domElement.style.cursor = intersections.length ? 'pointer' : 'grab';
            });

            renderer.domElement.addEventListener('click', (event) => {
                if (!detailHotspots.length || !camera || isTranslateDrag || isRotateDrag || event.shiftKey || event.altKey) {
                    return;
                }

                const rect = renderer.domElement.getBoundingClientRect();
                detailHotspotPointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                detailHotspotPointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
                detailHotspotRaycaster.setFromCamera(detailHotspotPointer, camera);

                const markerMeshes = detailHotspots.flatMap((entry) => [
                    entry.mesh,
                    entry.glowMesh,
                    entry.outerGlowMesh
                ].filter(Boolean));
                const intersections = detailHotspotRaycaster.intersectObjects(markerMeshes, false);
                if (!intersections.length) {
                    hideDetailHotspot();
                    return;
                }

                const hitMesh = intersections[0].object;
                const hitHotspot = detailHotspots.find((entry) =>
                    entry.mesh === hitMesh
                    || entry.glowMesh === hitMesh
                    || entry.outerGlowMesh === hitMesh
                ) || null;
                if (!hitHotspot) {
                    hideDetailHotspot();
                    return;
                }

                if (activeDetailHotspot && activeDetailHotspot.id === hitHotspot.id) {
                    hideDetailHotspot();
                    return;
                }

                showDetailHotspot(hitHotspot);
            });

            window.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    hideDetailHotspot();
                }
            });
        }

        function setupCarDetailHotspots(carRoot) {
            if (detailHotspotsReady || !carRoot) {
                return;
            }

            carRoot.updateMatrixWorld(true);
            const carBounds = new THREE.Box3().setFromObject(carRoot);
            if (!Number.isFinite(carBounds.min.x)) {
                return;
            }

            setupDetailHotspotOverlay();
            setupDetailHotspotInteraction();

            const carSize = carBounds.getSize(new THREE.Vector3());

            const hotspotSpecs = [
                {
                    id: 'wheel',
                    title: 'Wheel',
                    description: 'Center-lock wheels straight from Formula 1, a single bolt holds each wheel, making every pit stop feel dangerously, gloriously fast.',
                    localPosition: [-16.81, 1.4, -14.09]
                },
                {
                    id: 'bonnet',
                    title: 'Bonnet',
                    description: 'Made from aerospace-grade magnesium, the GT3 RS hood is so light it makes carbon fibre look lazy by comparison.',
                    localPosition: [-12.15, 4.12, -15.0]
                },
                {
                    id: 'spoiler',
                    title: 'Spoiler',
                    description: 'Its swan-neck rear wing generates 409 kg of downforce, enough theoretical grip to literally drive upside down on a ceiling.',
                    localPosition: [-12.39, 4.56, -0.42]
                },
                {
                    id: 'door',
                    title: 'Door',
                    description: 'The doors hide louvred air intakes that channel cool air into the wheel arches, keeping brakes from overheating during hard cornering.',
                    localPosition: [-8.28, 2.54, -9.22]
                }
            ];

            const markerRadius = Math.max(0.01, Math.min(carSize.x, carSize.z) * 0.0026);
            const markerGeometry = new THREE.SphereGeometry(markerRadius, 16, 12);
            const glowGeometry = new THREE.SphereGeometry(markerRadius * 3.1, 20, 16);
            const outerGlowGeometry = new THREE.SphereGeometry(markerRadius * 4.8, 24, 18);

            for (let index = 0; index < hotspotSpecs.length; index += 1) {
                const spec = hotspotSpecs[index];
                const markerMaterial = new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.96
                });
                const marker = new THREE.Mesh(markerGeometry, markerMaterial);
                marker.position.set(spec.localPosition[0], spec.localPosition[1], spec.localPosition[2]);
                marker.renderOrder = 9000;
                carRoot.add(marker);

                const glowMaterial = new THREE.MeshBasicMaterial({
                    color: 0x8ffcff,
                    transparent: true,
                    opacity: 0.4,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                });
                const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
                glowMesh.renderOrder = 8999;
                glowMesh.scale.setScalar(1);
                marker.add(glowMesh);

                const outerGlowMaterial = new THREE.MeshBasicMaterial({
                    color: 0xc8ffff,
                    transparent: true,
                    opacity: 0.16,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                });
                const outerGlowMesh = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
                outerGlowMesh.renderOrder = 8998;
                outerGlowMesh.scale.setScalar(1);
                marker.add(outerGlowMesh);

                const flickerState = {
                    coreOpacity: 0.96,
                    glowOpacity: 0.4,
                    outerGlowOpacity: 0.16,
                    markerScale: 1,
                    glowScale: 1,
                    outerGlowScale: 1
                };

                const applyFlickerState = () => {
                    markerMaterial.opacity = flickerState.coreOpacity;
                    marker.scale.setScalar(flickerState.markerScale);
                    glowMaterial.opacity = flickerState.glowOpacity;
                    glowMesh.scale.setScalar(flickerState.glowScale);
                    outerGlowMaterial.opacity = flickerState.outerGlowOpacity;
                    outerGlowMesh.scale.setScalar(flickerState.outerGlowScale);
                };

                gsap.timeline({ repeat: -1, delay: index * 0.14 })
                    .to(flickerState, {
                        duration: 0.78,
                        coreOpacity: 1.0,
                        glowOpacity: 0.62,
                        outerGlowOpacity: 0.28,
                        markerScale: 1.08,
                        glowScale: 1.42,
                        outerGlowScale: 1.72,
                        ease: 'sine.inOut',
                        onUpdate: applyFlickerState
                    })
                    .to(flickerState, {
                        duration: 0.64,
                        coreOpacity: 0.78,
                        glowOpacity: 0.24,
                        outerGlowOpacity: 0.1,
                        markerScale: 0.92,
                        glowScale: 0.9,
                        outerGlowScale: 0.82,
                        ease: 'sine.inOut',
                        onUpdate: applyFlickerState
                    })
                    .to(flickerState, {
                        duration: 0.07,
                        coreOpacity: 0.6,
                        glowOpacity: 0.15,
                        outerGlowOpacity: 0.06,
                        markerScale: 0.84,
                        glowScale: 0.74,
                        outerGlowScale: 0.68,
                        ease: 'power2.out',
                        onUpdate: applyFlickerState
                    })
                    .to(flickerState, {
                        duration: 0.1,
                        coreOpacity: 0.98,
                        glowOpacity: 0.68,
                        outerGlowOpacity: 0.32,
                        markerScale: 1.04,
                        glowScale: 1.52,
                        outerGlowScale: 1.84,
                        ease: 'power2.in',
                        onUpdate: applyFlickerState
                    })
                    .to(flickerState, {
                        duration: 0.32,
                        coreOpacity: 0.96,
                        glowOpacity: 0.4,
                        outerGlowOpacity: 0.16,
                        markerScale: 1,
                        glowScale: 1,
                        outerGlowScale: 1,
                        ease: 'sine.out',
                        onUpdate: applyFlickerState
                    });

                applyFlickerState();

                detailHotspots.push({
                    id: spec.id,
                    title: spec.title,
                    description: spec.description,
                    mesh: marker,
                    glowMesh,
                    outerGlowMesh
                });
            }

            detailHotspotsReady = true;
            updateDetailHotspotDebuggerInputs();
        }

        function applyPivotOffset() {
            if (!model) {
                return;
            }

            model.position.copy(modelBasePosition).sub(pivotOffset);
            updateShadowCatchersPlacement();
            requestShadowUpdate();
        }

        function getPivotKeyframe(index) {
            const keyframe = pivotKeyframes[index];

            if (Array.isArray(keyframe) && keyframe.length >= 3) {
                return keyframe;
            }

            return [
                defaultPivotOffset.x,
                defaultPivotOffset.y,
                defaultPivotOffset.z
            ];
        }

        function applyPivotOffsetFromKeyframe(index) {
            const keyframe = getPivotKeyframe(index);
            pivotOffset.set(keyframe[0], keyframe[1], keyframe[2]);
            applyPivotOffset();
        }

        function getLightKeyframe(index) {
            const keyframe = lightKeyframes[index];

            if (Array.isArray(keyframe) && keyframe.length >= 3) {
                return keyframe;
            }

            return [defaultLightPoint[0], defaultLightPoint[1], defaultLightPoint[2]];
        }

        function applyLightFromKeyframe(index) {
            const [lightX, lightY, lightZ] = getLightKeyframe(index);

            if (keyLight) {
                keyLight.position.set(lightX, lightY, lightZ);
                keyLight.intensity = fixedShadowSettings.intensity;
                keyLight.color.setRGB(
                    defaultMoonLightColor[0],
                    defaultMoonLightColor[1],
                    defaultMoonLightColor[2]
                );
                keyLight.shadow.radius = defaultShadowRadius;
                keyLight.shadow.needsUpdate = true;
            }

            if (rimLight) {
                rimLight.position.set(
                    defaultRimLightPoint[0],
                    defaultRimLightPoint[1],
                    defaultRimLightPoint[2]
                );
                rimLight.intensity = defaultRimLightIntensity;
                rimLight.color.setRGB(
                    defaultRimLightColor[0],
                    defaultRimLightColor[1],
                    defaultRimLightColor[2]
                );
            }

            if (ambientLight) {
                ambientLight.color.setRGB(
                    defaultAmbientLightColor[0],
                    defaultAmbientLightColor[1],
                    defaultAmbientLightColor[2]
                );
                ambientLight.intensity = defaultAmbientLightIntensity;
            }

            if (fillLight) {
                fillLight.color.setRGB(
                    defaultFillLightColor[0],
                    defaultFillLightColor[1],
                    defaultFillLightColor[2]
                );
                fillLight.groundColor.setRGB(
                    defaultFillGroundColor[0],
                    defaultFillGroundColor[1],
                    defaultFillGroundColor[2]
                );
                fillLight.intensity = defaultFillLightIntensity;
            }

            if (shadowMaterial) {
                shadowMaterial.color.setRGB(
                    defaultShadowColor[0],
                    defaultShadowColor[1],
                    defaultShadowColor[2]
                );
                shadowMaterial.opacity = defaultShadowOpacity;
                shadowMaterial.needsUpdate = true;
            }

            if (contactShadowMaterial) {
                contactShadowMaterial.color.setRGB(
                    defaultShadowColor[0],
                    defaultShadowColor[1],
                    defaultShadowColor[2]
                );
                contactShadowMaterial.opacity = defaultContactShadowOpacity;
                contactShadowMaterial.needsUpdate = true;
            }

            if (scene) {
                if (!(scene.fog && scene.fog.isFogExp2)) {
                    scene.fog = new THREE.FogExp2(0x02020a, defaultFogDensity);
                }

                scene.fog.color.setRGB(
                    defaultFogColor[0],
                    defaultFogColor[1],
                    defaultFogColor[2]
                );
                scene.fog.density = defaultFogDensity;
            }

            if (bloomPass) {
                bloomPass.strength = defaultBloomStrength;
                bloomPass.threshold = defaultBloomThreshold;
                bloomPass.radius = defaultBloomRadius;
            }

            applyEnvironmentPreset();
            if (introLightRevealCompleted) {
                applyMaterialSurfaceLook(defaultEnvironmentIntensityScale, defaultMinimumRoughness, true);
            } else {
                turnOffAllIntroLights();
            }
            requestShadowUpdate();
        }

        function applyLightToKeyframe(index, lightX, lightY, lightZ) {
            if (!lightKeyframes[index]) {
                lightKeyframes[index] = [defaultLightPoint[0], defaultLightPoint[1], defaultLightPoint[2]];
            }

            lightKeyframes[index][0] = parseFloat(lightX.toFixed(2));
            lightKeyframes[index][1] = parseFloat(lightY.toFixed(2));
            lightKeyframes[index][2] = parseFloat(lightZ.toFixed(2));
        }

        function getNodeHierarchyLabel(node, maxDepth = 6) {
            const labels = [];
            let current = node;
            let depth = 0;

            while (current && depth < maxDepth) {
                if (current.name) {
                    labels.push(current.name);
                }

                current = current.parent;
                depth += 1;
            }

            return labels.join(' ').toLowerCase();
        }

        function getNodeDepth(node) {
            let depth = 0;
            let current = node;

            while (current && current.parent) {
                depth += 1;
                current = current.parent;
            }

            return depth;
        }

        function isAncestorNode(ancestorNode, targetNode) {
            if (!ancestorNode || !targetNode) {
                return false;
            }

            let current = targetNode.parent;
            while (current) {
                if (current === ancestorNode) {
                    return true;
                }

                current = current.parent;
            }

            return false;
        }

        function analyzePorscheModel(root, gltf) {
            if (!root) {
                return;
            }

            let nodeCount = 0;
            let meshCount = 0;
            let skinnedMeshCount = 0;
            let boneCount = 0;
            let triangleCount = 0;
            const materialIds = new Set();
            const meshRows = [];
            const namedRows = [];

            root.updateMatrixWorld(true);
            root.traverse((node) => {
                nodeCount += 1;

                if (node.isBone) {
                    boneCount += 1;
                }

                if (node.name) {
                    namedRows.push({
                        name: node.name,
                        type: node.type,
                        childCount: node.children ? node.children.length : 0
                    });
                }

                if (!node.isMesh || !node.geometry) {
                    return;
                }

                meshCount += 1;
                if (node.isSkinnedMesh) {
                    skinnedMeshCount += 1;
                }

                const geometry = node.geometry;
                const triangleEstimate = geometry.index
                    ? geometry.index.count / 3
                    : (geometry.attributes.position ? geometry.attributes.position.count / 3 : 0);
                triangleCount += triangleEstimate;

                const materials = Array.isArray(node.material) ? node.material : [node.material];
                for (const material of materials) {
                    if (material && material.uuid) {
                        materialIds.add(material.uuid);
                    }
                }

                const bounds = new THREE.Box3().setFromObject(node);
                const size = bounds.getSize(new THREE.Vector3());
                meshRows.push({
                    name: node.name || '(unnamed)',
                    type: node.type,
                    triangles: Math.round(triangleEstimate),
                    sizeX: Number(size.x.toFixed(2)),
                    sizeY: Number(size.y.toFixed(2)),
                    sizeZ: Number(size.z.toFixed(2)),
                    skinned: node.isSkinnedMesh ? 'yes' : 'no'
                });
            });

            meshRows.sort((a, b) => b.triangles - a.triangles);
        }

        function analyzeAndRigDoors(root) {
            doorRigs.length = 0;
            doorAnalysisRows.length = 0;
            doorOpenDirectionMultiplier = 1;

            if (!root) {
                updateDoorDebugInfo();
                return;
            }

            root.updateMatrixWorld(true);

            const modelBounds = new THREE.Box3().setFromObject(root);
            if (!Number.isFinite(modelBounds.min.x)) {
                updateDoorDebugInfo();
                return;
            }

            const modelCenter = modelBounds.getCenter(new THREE.Vector3());
            const modelSize = modelBounds.getSize(new THREE.Vector3());
            const modelScale = Math.max(modelSize.x, modelSize.y, modelSize.z);
            const lateralAxis = modelSize.x <= modelSize.z ? 'x' : 'z';
            const longitudinalAxis = lateralAxis === 'x' ? 'z' : 'x';
            const frontDirectionSign = -1;
            const minDoorWidth = modelScale * 0.06;
            const minDoorHeight = modelScale * 0.06;
            const candidates = [];
            const consumedManualNodes = new Set();
            const nodeLookupByName = new Map();
            const pivotMarkerRadius = Math.max(0.025, modelScale * 0.0065);
            const pivotMarkerGeometry = new THREE.SphereGeometry(pivotMarkerRadius, 16, 12);

            root.traverse((node) => {
                if (!node || !node.name) {
                    return;
                }

                const key = node.name.toLowerCase();
                if (!nodeLookupByName.has(key)) {
                    nodeLookupByName.set(key, []);
                }

                nodeLookupByName.get(key).push(node);
            });

            const createDoorPivotMarker = (markerColor) => {
                const markerMaterial = new THREE.MeshBasicMaterial({
                    color: markerColor,
                    transparent: true,
                    opacity: 0.95,
                    depthTest: false,
                    depthWrite: false
                });
                const marker = new THREE.Mesh(pivotMarkerGeometry, markerMaterial);
                marker.visible = doorPivotMarkersVisible;
                marker.renderOrder = 10000;
                return marker;
            };

            const getUniqueTopLevelNodes = (nodes) => {
                const uniqueNodes = [];
                const seenIds = new Set();

                for (const node of nodes) {
                    if (!node || seenIds.has(node.uuid)) {
                        continue;
                    }

                    seenIds.add(node.uuid);
                    uniqueNodes.push(node);
                }

                return uniqueNodes.filter((node) =>
                    !uniqueNodes.some((otherNode) => otherNode !== node && isAncestorNode(otherNode, node))
                );
            };

            const classifyDoorSideAndSegment = (bounds, label = '') => {
                const center = bounds.getCenter(new THREE.Vector3());
                const sideValue = center[lateralAxis] - modelCenter[lateralAxis];
                let side = sideValue >= 0 ? 'left' : 'right';
                if (doorSideRightPattern.test(label)) {
                    side = 'right';
                } else if (doorSideLeftPattern.test(label)) {
                    side = 'left';
                }

                const longitudinalValue = center[longitudinalAxis] - modelCenter[longitudinalAxis];
                let segment = longitudinalValue <= 0 ? 'front' : 'rear';
                if (doorFrontPattern.test(label)) {
                    segment = 'front';
                } else if (doorRearPattern.test(label)) {
                    segment = 'rear';
                }

                return { side, segment, center };
            };

            const createDoorRigFromNodes = (nodes, source, nameLabel = '', options = {}) => {
                const attachNodes = getUniqueTopLevelNodes(nodes);
                if (!attachNodes.length) {
                    return null;
                }

                const combinedBounds = new THREE.Box3();
                let hasBounds = false;
                for (const node of attachNodes) {
                    const nodeBounds = new THREE.Box3().setFromObject(node);
                    if (!Number.isFinite(nodeBounds.min.x)) {
                        continue;
                    }

                    if (!hasBounds) {
                        combinedBounds.copy(nodeBounds);
                        hasBounds = true;
                    } else {
                        combinedBounds.union(nodeBounds);
                    }
                }

                if (!hasBounds) {
                    return null;
                }

                const size = combinedBounds.getSize(new THREE.Vector3());
                if (size.y < minDoorHeight || (size.x < minDoorWidth && size.z < minDoorWidth)) {
                    return null;
                }

                const combinedLabel = attachNodes.map((node) => node.name || '').join(' ').toLowerCase();
                const { side, segment, center } = classifyDoorSideAndSegment(combinedBounds, combinedLabel);

                const lateralSize = lateralAxis === 'x' ? size.x : size.z;
                const longSize = longitudinalAxis === 'x' ? size.x : size.z;
                const hingeWorld = center.clone();
                const hardcodedPivotWorld = Array.isArray(options.pivotWorld)
                    ? options.pivotWorld
                    : null;
                if (hardcodedPivotWorld && hardcodedPivotWorld.length >= 3) {
                    hingeWorld.set(
                        Number(hardcodedPivotWorld[0]) || center.x,
                        Number(hardcodedPivotWorld[1]) || center.y,
                        Number(hardcodedPivotWorld[2]) || center.z
                    );
                } else if (lateralAxis === 'x') {
                    hingeWorld.x = center.x + (side === 'left' ? lateralSize * 0.5 : -lateralSize * 0.5);
                    hingeWorld.z = center.z + frontDirectionSign * longSize * 0.45;
                } else {
                    hingeWorld.z = center.z + (side === 'left' ? lateralSize * 0.5 : -lateralSize * 0.5);
                    hingeWorld.x = center.x + frontDirectionSign * longSize * 0.45;
                }

                const hingeLocal = root.worldToLocal(hingeWorld.clone());
                const doorPivot = new THREE.Group();
                doorPivot.position.copy(hingeLocal);
                root.add(doorPivot);

                for (const node of attachNodes) {
                    doorPivot.attach(node);
                    node.traverse((childNode) => {
                        consumedManualNodes.add(childNode.uuid);
                    });
                }

                const closedRotationY = doorPivot.rotation.y;
                const openingDirection = (side === 'left' ? 1 : -1) * doorOpenDirectionMultiplier;
                const openRotationY = closedRotationY + openingDirection * doorOpenAngle;
                const name = nameLabel || attachNodes.map((node) => node.name || '(unnamed)').join('+');
                const markerColor = typeof options.markerColor === 'number'
                    ? options.markerColor
                    : doorPivotMarkerColors[doorRigs.length % doorPivotMarkerColors.length];
                const pivotMarker = createDoorPivotMarker(markerColor);
                doorPivot.add(pivotMarker);

                const doorRig = {
                    node: attachNodes[0],
                    attachedNodes: attachNodes,
                    pivot: doorPivot,
                    pivotMarker,
                    markerColor,
                    name,
                    side,
                    segment,
                    source,
                    lateralAxis,
                    openingDirection,
                    closedRotationY,
                    openRotationY,
                    manualDoorGroupIndex: Number.isInteger(options.manualDoorGroupIndex)
                        ? options.manualDoorGroupIndex
                        : null,
                    currentRotationY: closedRotationY,
                    targetRotationY: closedRotationY,
                    tooltipAnchorLocal: null,
                    tooltipOffsetDistance: 0.22,
                    tooltipVerticalOffset: 0.12
                };

                doorRigs.push(doorRig);
                refreshDoorRigTooltipAnchor(doorRig);
                if (enableDoorAnalysisLogs) {
                    doorAnalysisRows.push({
                        name,
                        side,
                        segment,
                        source,
                        score: 999,
                        sizeX: Number(size.x.toFixed(2)),
                        sizeY: Number(size.y.toFixed(2)),
                        sizeZ: Number(size.z.toFixed(2))
                    });
                }

                return doorRig;
            };

            let manualGroupRiggedCount = 0;
            for (let groupIndex = 0; groupIndex < manualDoorGroupNodeNames.length; groupIndex += 1) {
                const groupNames = manualDoorGroupNodeNames[groupIndex];
                if (!Array.isArray(groupNames) || !groupNames.length) {
                    continue;
                }

                const resolvedNodes = [];
                for (const rawName of groupNames) {
                    const targetName = String(rawName || '').trim();
                    if (!targetName) {
                        continue;
                    }

                    const targetKey = targetName.toLowerCase();
                    const exactNodes = nodeLookupByName.get(targetKey) || [];
                    if (exactNodes.length) {
                        resolvedNodes.push(exactNodes.find((node) => node.isMesh) || exactNodes[0]);
                        continue;
                    }

                    let fuzzyNodes = [];
                    for (const [lookupKey, lookupNodes] of nodeLookupByName.entries()) {
                        if (
                            lookupKey === targetKey
                            || lookupKey.startsWith(`${targetKey}_`)
                            || lookupKey.includes(targetKey)
                        ) {
                            fuzzyNodes = fuzzyNodes.concat(lookupNodes);
                        }
                    }

                    if (fuzzyNodes.length) {
                        resolvedNodes.push(fuzzyNodes.find((node) => node.isMesh) || fuzzyNodes[0]);
                    }
                }

                const manualDoorRig = createDoorRigFromNodes(
                    resolvedNodes,
                    'manual',
                    `manual-door-${groupIndex + 1}`,
                    {
                        pivotWorld: manualDoorGroupPivotWorldPoints[groupIndex] || null,
                        markerColor: doorPivotMarkerColors[groupIndex % doorPivotMarkerColors.length],
                        manualDoorGroupIndex: groupIndex
                    }
                );
                if (manualDoorRig) {
                    manualGroupRiggedCount += 1;
                }
            }

            const addCandidate = (node, source, baseScore) => {
                const bounds = new THREE.Box3().setFromObject(node);
                if (!Number.isFinite(bounds.min.x)) {
                    return;
                }

                const size = bounds.getSize(new THREE.Vector3());
                if (size.y < minDoorHeight || (size.x < minDoorWidth && size.z < minDoorWidth)) {
                    return;
                }

                const center = bounds.getCenter(new THREE.Vector3());
                const label = getNodeHierarchyLabel(node);
                const sideValue = center[lateralAxis] - modelCenter[lateralAxis];
                let side = sideValue >= 0 ? 'left' : 'right';
                if (doorSideRightPattern.test(label)) {
                    side = 'right';
                } else if (doorSideLeftPattern.test(label)) {
                    side = 'left';
                }

                const longitudinalValue = center[longitudinalAxis] - modelCenter[longitudinalAxis];
                let segment = longitudinalValue <= 0 ? 'front' : 'rear';
                if (doorFrontPattern.test(label)) {
                    segment = 'front';
                } else if (doorRearPattern.test(label)) {
                    segment = 'rear';
                }

                let score = baseScore;
                if (doorSideLeftPattern.test(label) || doorSideRightPattern.test(label)) {
                    score += 2;
                }

                if (doorFrontPattern.test(label) || doorRearPattern.test(label)) {
                    score += 1;
                }

                if (node.isBone) {
                    score += 3;
                }

                if (!node.isMesh) {
                    score += 1;
                }

                if (doorIgnorePattern.test(label)) {
                    score -= 2;
                }

                const lateralSize = lateralAxis === 'x' ? size.x : size.z;
                const longSize = longitudinalAxis === 'x' ? size.x : size.z;
                const sideDistance = Math.abs(sideValue);
                score += Math.min(2.5, sideDistance / Math.max(0.001, (lateralAxis === 'x' ? modelSize.x : modelSize.z) * 0.4));
                score += Math.min(2, (Math.max(lateralSize, longSize) / Math.max(0.001, modelScale * 0.2)));

                candidates.push({
                    node,
                    name: node.name || '(unnamed)',
                    side,
                    segment,
                    score,
                    size,
                    center,
                    source,
                    depth: getNodeDepth(node)
                });
            };

            root.traverse((node) => {
                if (!node || node === root || !node.name) {
                    return;
                }

                if (consumedManualNodes.has(node.uuid)) {
                    return;
                }

                const label = getNodeHierarchyLabel(node);
                if (!doorNamePattern.test(label)) {
                    return;
                }
                addCandidate(node, 'named', 10);
            });

            if (!candidates.length) {
                root.traverse((node) => {
                    if (!node || !node.isMesh || !node.geometry) {
                        return;
                    }

                    if (consumedManualNodes.has(node.uuid)) {
                        return;
                    }

                    const bounds = new THREE.Box3().setFromObject(node);
                    if (!Number.isFinite(bounds.min.x)) {
                        return;
                    }

                    const size = bounds.getSize(new THREE.Vector3());
                    const center = bounds.getCenter(new THREE.Vector3());
                    const lateralSize = lateralAxis === 'x' ? size.x : size.z;
                    const longSize = longitudinalAxis === 'x' ? size.x : size.z;
                    const lateralDistance = Math.abs(center[lateralAxis] - modelCenter[lateralAxis]);
                    const minLateralDistance = (lateralAxis === 'x' ? modelSize.x : modelSize.z) * 0.18;

                    if (lateralDistance < minLateralDistance) {
                        return;
                    }

                    if (size.y < modelScale * 0.05 || size.y > modelScale * 0.8) {
                        return;
                    }

                    if (Math.max(lateralSize, longSize) < modelScale * 0.05) {
                        return;
                    }

                    if (center.y < modelBounds.min.y + modelSize.y * 0.15 || center.y > modelBounds.min.y + modelSize.y * 0.92) {
                        return;
                    }

                    addCandidate(node, 'geometric', 5);
                });
            }

            candidates.sort((a, b) => {
                if (Math.abs(b.score - a.score) > 0.0001) {
                    return b.score - a.score;
                }

                if (a.depth !== b.depth) {
                    return a.depth - b.depth;
                }

                const volumeA = a.size.x * a.size.y * a.size.z;
                const volumeB = b.size.x * b.size.y * b.size.z;
                return volumeB - volumeA;
            });

            const selected = [];
            const maxAutoDoors = Math.max(0, 4 - doorRigs.length);
            const selectedSlots = new Set(doorRigs.map((door) => `${door.side}-${door.segment}`));
            for (const candidate of candidates) {
                if (selected.length >= maxAutoDoors) {
                    break;
                }

                const slotId = `${candidate.side}-${candidate.segment}`;
                if (selectedSlots.has(slotId)) {
                    continue;
                }

                const conflicts = selected.some((entry) =>
                    isAncestorNode(entry.node, candidate.node)
                    || isAncestorNode(candidate.node, entry.node)
                );
                if (conflicts) {
                    continue;
                }

                selectedSlots.add(slotId);
                selected.push(candidate);
            }

            if (!selected.length) {
                const selectedSides = new Set();
                for (const candidate of candidates) {
                    if (selected.length >= Math.max(1, maxAutoDoors)) {
                        break;
                    }

                    if (selectedSides.has(candidate.side)) {
                        continue;
                    }

                    const conflicts = selected.some((entry) =>
                        isAncestorNode(entry.node, candidate.node)
                        || isAncestorNode(candidate.node, entry.node)
                    );
                    if (conflicts) {
                        continue;
                    }

                    selectedSides.add(candidate.side);
                    selected.push(candidate);
                }
            }

            for (const candidate of selected) {
                const targetNode = candidate.node;
                const parentNode = targetNode.parent;
                if (!parentNode) {
                    continue;
                }

                const bounds = new THREE.Box3().setFromObject(targetNode);
                if (!Number.isFinite(bounds.min.x)) {
                    continue;
                }

                const center = bounds.getCenter(new THREE.Vector3());
                const size = bounds.getSize(new THREE.Vector3());
                const lateralSize = lateralAxis === 'x' ? size.x : size.z;
                const longSize = longitudinalAxis === 'x' ? size.x : size.z;
                const hingeWorld = center.clone();

                if (lateralAxis === 'x') {
                    hingeWorld.x = center.x + (candidate.side === 'left' ? lateralSize * 0.5 : -lateralSize * 0.5);
                    hingeWorld.z = center.z + frontDirectionSign * longSize * 0.45;
                } else {
                    hingeWorld.z = center.z + (candidate.side === 'left' ? lateralSize * 0.5 : -lateralSize * 0.5);
                    hingeWorld.x = center.x + frontDirectionSign * longSize * 0.45;
                }

                const hingeLocal = parentNode.worldToLocal(hingeWorld.clone());
                const doorPivot = new THREE.Group();
                doorPivot.position.copy(hingeLocal);
                parentNode.add(doorPivot);
                doorPivot.attach(targetNode);

                const markerColor = doorPivotMarkerColors[doorRigs.length % doorPivotMarkerColors.length];
                const pivotMarker = createDoorPivotMarker(markerColor);
                doorPivot.add(pivotMarker);

                const closedRotationY = doorPivot.rotation.y;
                const openingDirection = (candidate.side === 'left' ? 1 : -1) * doorOpenDirectionMultiplier;
                const openRotationY = closedRotationY + openingDirection * doorOpenAngle;

                const autoDoorRig = {
                    node: targetNode,
                    attachedNodes: [targetNode],
                    pivot: doorPivot,
                    pivotMarker,
                    markerColor,
                    name: candidate.name,
                    side: candidate.side,
                    segment: candidate.segment,
                    source: candidate.source,
                    lateralAxis,
                    openingDirection,
                    closedRotationY,
                    openRotationY,
                    currentRotationY: closedRotationY,
                    targetRotationY: closedRotationY,
                    tooltipAnchorLocal: null,
                    tooltipOffsetDistance: 0.22,
                    tooltipVerticalOffset: 0.12
                };
                doorRigs.push(autoDoorRig);
                refreshDoorRigTooltipAnchor(autoDoorRig);
            }

            if (enableDoorAnalysisLogs) {
                for (const candidate of candidates.slice(0, 30)) {
                    doorAnalysisRows.push({
                        name: candidate.name,
                        side: candidate.side,
                        segment: candidate.segment,
                        source: candidate.source,
                        score: Number(candidate.score.toFixed(2)),
                        sizeX: Number(candidate.size.x.toFixed(2)),
                        sizeY: Number(candidate.size.y.toFixed(2)),
                        sizeZ: Number(candidate.size.z.toFixed(2))
                    });
                }
            }

            setDoorPivotMarkerVisibility(doorPivotMarkersVisible);
            updateDoorDebugInfo();
        }

        function refreshDoorRigTooltipAnchor(doorRig) {
            if (!doorRig || !doorRig.pivot) {
                return false;
            }

            const sourceNodes = Array.isArray(doorRig.attachedNodes) && doorRig.attachedNodes.length
                ? doorRig.attachedNodes
                : (doorRig.node ? [doorRig.node] : []);
            if (!sourceNodes.length) {
                return false;
            }

            const doorBounds = new THREE.Box3();
            let hasBounds = false;
            for (const node of sourceNodes) {
                const nodeBounds = new THREE.Box3().setFromObject(node);
                if (!Number.isFinite(nodeBounds.min.x)) {
                    continue;
                }

                if (!hasBounds) {
                    doorBounds.copy(nodeBounds);
                    hasBounds = true;
                } else {
                    doorBounds.union(nodeBounds);
                }
            }

            if (!hasBounds) {
                return false;
            }

            const doorSize = doorBounds.getSize(new THREE.Vector3());
            const doorCenter = doorBounds.getCenter(new THREE.Vector3());
            doorCenter.y = doorBounds.min.y + doorSize.y * 0.62;

            doorRig.tooltipAnchorLocal = doorRig.pivot.worldToLocal(doorCenter.clone());
            const lateralSize = doorRig.lateralAxis === 'z' ? doorSize.z : doorSize.x;
            doorRig.tooltipOffsetDistance = Math.max(0.18, Math.min(0.72, lateralSize * 0.36));
            doorRig.tooltipVerticalOffset = Math.max(0.08, Math.min(0.34, doorSize.y * 0.12));
            return true;
        }

        function setDoorPivotMarkerVisibility(visible) {
            doorPivotMarkersVisible = Boolean(visible);

            for (const door of doorRigs) {
                if (door && door.pivotMarker) {
                    door.pivotMarker.visible = doorPivotMarkersVisible;
                }
            }
        }

        function setDoorRigPivotLocalPositionPreserveWorld(doorRig, targetLocalPosition) {
            if (!doorRig || !doorRig.pivot || !doorRig.pivot.parent || !targetLocalPosition) {
                return false;
            }

            const pivot = doorRig.pivot;
            const pivotParent = pivot.parent;
            const preservedChildren = pivot.children.filter((child) => child !== doorRig.pivotMarker);

            for (const child of preservedChildren) {
                pivotParent.attach(child);
            }

            pivot.position.copy(targetLocalPosition);

            for (const child of preservedChildren) {
                pivot.attach(child);
            }

            refreshDoorRigTooltipAnchor(doorRig);
            return true;
        }

        function applyHardcodedManualDoorPivotWorldPoints() {
            if (!doorRigs.length || !manualDoorGroupPivotWorldPoints.length) {
                return;
            }

            for (let groupIndex = 0; groupIndex < manualDoorGroupPivotWorldPoints.length; groupIndex += 1) {
                const pivotPoint = manualDoorGroupPivotWorldPoints[groupIndex];
                if (!Array.isArray(pivotPoint) || pivotPoint.length < 3) {
                    continue;
                }

                const doorRig = doorRigs.find((door) =>
                    door
                    && door.source === 'manual'
                    && door.manualDoorGroupIndex === groupIndex
                );
                if (!doorRig || !doorRig.pivot || !doorRig.pivot.parent) {
                    continue;
                }

                const targetWorld = new THREE.Vector3(
                    Number(pivotPoint[0]) || 0,
                    Number(pivotPoint[1]) || 0,
                    Number(pivotPoint[2]) || 0
                );
                const targetLocal = doorRig.pivot.parent.worldToLocal(targetWorld);
                setDoorRigPivotLocalPositionPreserveWorld(doorRig, targetLocal);
            }
        }

        function updateDoorDebugInfo() {
            return;
            const doorDebugEl = document.getElementById('door-debug');
            if (!doorDebugEl) {
                return;
            }

            if (!doorRigs.length) {
                doorDebugEl.textContent = 'Doors: no doors rigged';
                return;
            }

            const names = doorRigs
                .map((door) => `${door.side[0].toUpperCase()}${door.segment[0].toUpperCase()}:${door.name}`)
                .join(' | ');
            const sourceModes = Array.from(new Set(doorRigs.map((door) => door.source))).join('/');
            const direction = doorOpenDirectionMultiplier > 0 ? 'normal' : 'flipped';
            doorDebugEl.textContent = `Doors: ${doorRigs.length} rigged (${sourceModes}, ${direction}) | ${names}`;
        }

        function ensureDoorActionAudioInitialized() {
            if (doorAudioReady) {
                return;
            }

            doorOpenAudioElement = new Audio(doorOpenAudioPath);
            doorOpenAudioElement.preload = 'auto';
            doorOpenAudioElement.loop = false;
            doorOpenAudioElement.volume = doorOpenAudioVolume;

            doorCloseAudioElement = new Audio(doorCloseAudioPath);
            doorCloseAudioElement.preload = 'auto';
            doorCloseAudioElement.loop = false;
            doorCloseAudioElement.volume = doorCloseAudioVolume;

            doorAudioReady = true;
        }

        function playDoorActionSound(actionType) {
            ensureDoorActionAudioInitialized();

            const audioElement = actionType === 'close'
                ? doorCloseAudioElement
                : doorOpenAudioElement;
            if (!audioElement) {
                return;
            }

            try {
                audioElement.pause();
                audioElement.currentTime = 0;
                const playPromise = audioElement.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch(() => {
                        // Ignore blocked-play errors; this is user-gesture driven and can be retried.
                    });
                }
            } catch (error) {
                // Ignore play errors.
            }
        }

        function setDoorOpenState(shouldOpen, side = null) {
            let hasTargetDoor = false;
            for (const door of doorRigs) {
                if (side && door.side !== side) {
                    continue;
                }

                hasTargetDoor = true;
                door.targetRotationY = shouldOpen ? door.openRotationY : door.closedRotationY;
            }

            return hasTargetDoor;
        }

        function toggleDoorSide(side) {
            const sideDoors = doorRigs.filter((door) => door.side === side);
            if (!sideDoors.length) {
                return false;
            }

            const anyClosed = sideDoors.some((door) =>
                Math.abs(door.targetRotationY - door.openRotationY) > 0.0005
            );

            for (const door of sideDoors) {
                door.targetRotationY = anyClosed ? door.openRotationY : door.closedRotationY;
            }

            return true;
        }

        function toggleAllDoors() {
            if (!doorRigs.length) {
                return false;
            }

            const anyClosed = doorRigs.some((door) =>
                Math.abs(door.targetRotationY - door.openRotationY) > 0.0005
            );

            for (const door of doorRigs) {
                door.targetRotationY = anyClosed ? door.openRotationY : door.closedRotationY;
            }

            return true;
        }

        function togglePrimaryManualDoor() {
            if (!doorRigs.length) {
                return false;
            }

            const manualDoor = doorRigs.find((door) => door.source === 'manual') || doorRigs[0];
            if (!manualDoor) {
                return false;
            }

            const isOpen = Math.abs(manualDoor.targetRotationY - manualDoor.openRotationY) < 0.0005;
            manualDoor.targetRotationY = isOpen ? manualDoor.closedRotationY : manualDoor.openRotationY;
            return true;
        }

        function flipDoorOpeningDirection() {
            if (!doorRigs.length) {
                return false;
            }

            doorOpenDirectionMultiplier *= -1;
            for (const door of doorRigs) {
                const wasOpen = Math.abs(door.targetRotationY - door.openRotationY) < 0.0005;
                const openOffset = door.openRotationY - door.closedRotationY;
                door.openingDirection *= -1;
                door.openRotationY = door.closedRotationY - openOffset;
                if (wasOpen) {
                    door.targetRotationY = door.openRotationY;
                }
            }

            return true;
        }

        function setupDoorControls() {
            if (doorControlsReady) {
                return;
            }

            doorControlsReady = true;

            window.addEventListener('keydown', (event) => {
                const targetTag = event.target && event.target.tagName;
                if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT') {
                    return;
                }

                if (introActive) {
                    return;
                }

                const key = String(event.key || '').toLowerCase();
                if (interiorCameraActive && (key === 'k' || key === 'l' || key === 'j' || key === '5')) {
                    event.preventDefault();
                    return;
                }

                let handled = false;
                let doorSoundAction = null;
                if (key === 'k') {
                    const sideDoors = doorRigs.filter((door) => door.side === 'left');
                    if (sideDoors.length) {
                        const anyClosed = sideDoors.some((door) =>
                            Math.abs(door.targetRotationY - door.openRotationY) > 0.0005
                        );
                        handled = toggleDoorSide('left');
                        doorSoundAction = anyClosed ? 'open' : 'close';
                    }
                } else if (key === 'l') {
                    const sideDoors = doorRigs.filter((door) => door.side === 'right');
                    if (sideDoors.length) {
                        const anyClosed = sideDoors.some((door) =>
                            Math.abs(door.targetRotationY - door.openRotationY) > 0.0005
                        );
                        handled = toggleDoorSide('right');
                        doorSoundAction = anyClosed ? 'open' : 'close';
                    }
                } else if (key === 'j') {
                    if (doorRigs.length) {
                        const anyClosed = doorRigs.some((door) =>
                            Math.abs(door.targetRotationY - door.openRotationY) > 0.0005
                        );
                        handled = toggleAllDoors();
                        doorSoundAction = anyClosed ? 'open' : 'close';
                    }
                } else if (key === '0') {
                    const anyOpen = doorRigs.some((door) =>
                        Math.abs(door.targetRotationY - door.closedRotationY) > 0.0005
                    );
                    handled = setDoorOpenState(false);
                    if (handled && anyOpen) {
                        doorSoundAction = 'close';
                    }
                } else if (key === '4') {
                    handled = flipDoorOpeningDirection();
                } else if (key === '5') {
                    const manualDoor = doorRigs.find((door) => door.source === 'manual') || doorRigs[0];
                    if (manualDoor) {
                        const isOpen = Math.abs(manualDoor.targetRotationY - manualDoor.openRotationY) < 0.0005;
                        handled = togglePrimaryManualDoor();
                        doorSoundAction = isOpen ? 'close' : 'open';
                    }
                } else if (key === 'enter') {
                    const anyOpen = doorRigs.some((door) =>
                        Math.abs(door.targetRotationY - door.closedRotationY) > 0.0005
                    );
                    handled = enterInteriorCameraMode(true);
                    if (handled && anyOpen) {
                        doorSoundAction = 'close';
                    }
                } else if (key === 'escape') {
                    handled = resetInteriorCameraMode(true);
                }

                if (!handled) {
                    return;
                }

                event.preventDefault();
                if (doorSoundAction) {
                    playDoorActionSound(doorSoundAction);
                }
                updateDoorDebugInfo();
            });

            window.addEventListener('blur', () => {
                if (!doorRigs.length) {
                    return;
                }

                setDoorOpenState(false);
            });
        }

        function updateDoorAnimation(deltaTime) {
            if (!doorRigs.length) {
                return false;
            }

            if (interiorCameraActive) {
                setDoorOpenState(false);
            }

            const safeDuration = Math.max(0.001, doorAnimationDuration);
            const blend = 1 - Math.exp(-deltaTime / safeDuration);
            let hasRotationChange = false;

            for (const door of doorRigs) {
                const previousRotationY = door.currentRotationY;
                door.currentRotationY = THREE.MathUtils.lerp(door.currentRotationY, door.targetRotationY, blend);
                if (Math.abs(door.targetRotationY - door.currentRotationY) < doorSnapEpsilon) {
                    door.currentRotationY = door.targetRotationY;
                }

                const rotationTarget = door.pivot || door.node;
                if (Math.abs(door.currentRotationY - previousRotationY) > 0.000001) {
                    rotationTarget.rotation.y = door.currentRotationY;
                    hasRotationChange = true;
                }
            }

            return hasRotationChange;
        }

        function createWheelRigs(root) {
            const allMeshes = [];
            root.traverse((node) => {
                if (node && node.isMesh) {
                    allMeshes.push(node);
                }
            });

            if (!allMeshes.length) {
                return [];
            }

            const getNodeLabel = (node) => {
                const labels = [];
                let current = node;
                let depth = 0;

                while (current && depth < 6) {
                    if (current.name) {
                        labels.push(current.name);
                    }
                    current = current.parent;
                    depth += 1;
                }

                return labels.join(' ');
            };

            const isManuallyExcludedWheelPart = (node) => {
                const nodeName = (node && node.name ? node.name : '').toLowerCase();
                if (manualWheelExcludeNames.has(nodeName)) {
                    return true;
                }

                const label = getNodeLabel(node).toLowerCase();
                return manualWheelExcludeLabels.some((token) => label.includes(token));
            };

            const staticMeshIds = new Set();
            root.traverse((node) => {
                if (!node || !node.isObject3D) {
                    return;
                }

                if (!wheelStaticPartPattern.test(getNodeLabel(node)) && !isManuallyExcludedWheelPart(node)) {
                    return;
                }

                node.traverse((child) => {
                    if (child && child.isMesh) {
                        staticMeshIds.add(child.uuid);
                    }
                });
            });

            const isStaticWheelPart = (node) =>
                staticMeshIds.has(node.uuid) ||
                wheelStaticPartPattern.test(getNodeLabel(node)) ||
                isManuallyExcludedWheelPart(node);

            const seedMeshMap = new Map();
            root.traverse((node) => {
                if (!node || !node.isObject3D) {
                    return;
                }

                const label = getNodeLabel(node);
                if (!wheelNamePattern.test(label)) {
                    return;
                }

                if (node.isMesh && !isStaticWheelPart(node)) {
                    seedMeshMap.set(node.uuid, node);
                }

                node.traverse((child) => {
                    if (child && child.isMesh && !isStaticWheelPart(child)) {
                        seedMeshMap.set(child.uuid, child);
                    }
                });
            });

            const seedMeshes = Array.from(seedMeshMap.values());
            if (!seedMeshes.length) {
                return [];
            }

            const getMeshCenter = (mesh) => new THREE.Box3().setFromObject(mesh).getCenter(new THREE.Vector3());
            const getMeshSize = (mesh) => new THREE.Box3().setFromObject(mesh).getSize(new THREE.Vector3());

            const modelBox = new THREE.Box3().setFromObject(root);
            const modelCenter = modelBox.getCenter(new THREE.Vector3());
            const modelSize = modelBox.getSize(new THREE.Vector3());
            const modelScale = Math.max(modelSize.x, modelSize.y, modelSize.z);
            const clusterDistance = Math.max(0.05, modelScale * 0.08);
            const captureDistance = clusterDistance * 1.35;
            const maxPartSize = modelScale * 0.35;

            const clusters = [];
            for (const mesh of seedMeshes) {
                const center = getMeshCenter(mesh);
                let bestCluster = null;
                let bestDistance = Number.POSITIVE_INFINITY;

                for (const cluster of clusters) {
                    const distance = center.distanceTo(cluster.center);
                    if (distance < bestDistance) {
                        bestDistance = distance;
                        bestCluster = cluster;
                    }
                }

                if (!bestCluster || bestDistance > clusterDistance) {
                    clusters.push({ center, seeds: [mesh] });
                    continue;
                }

                const nextCount = bestCluster.seeds.length + 1;
                bestCluster.center.multiplyScalar(bestCluster.seeds.length).add(center).multiplyScalar(1 / nextCount);
                bestCluster.seeds.push(mesh);
            }

            const mergedClusters = [];
            for (const cluster of clusters.sort((a, b) => b.seeds.length - a.seeds.length)) {
                let targetCluster = null;

                for (const existing of mergedClusters) {
                    if (cluster.center.distanceTo(existing.center) <= clusterDistance * 1.5) {
                        targetCluster = existing;
                        break;
                    }
                }

                if (!targetCluster) {
                    mergedClusters.push({
                        center: cluster.center.clone(),
                        seeds: [...cluster.seeds]
                    });
                    continue;
                }

                const totalCount = targetCluster.seeds.length + cluster.seeds.length;
                targetCluster.center
                    .multiplyScalar(targetCluster.seeds.length)
                    .add(cluster.center.clone().multiplyScalar(cluster.seeds.length))
                    .multiplyScalar(1 / totalCount);
                targetCluster.seeds.push(...cluster.seeds);
            }

            const selectedClusters = mergedClusters
                .sort((a, b) => {
                    const scoreA = a.seeds.length * 10 + a.center.distanceTo(modelCenter);
                    const scoreB = b.seeds.length * 10 + b.center.distanceTo(modelCenter);
                    return scoreB - scoreA;
                })
                .slice(0, 4);

            const assignedMeshes = new Set();
            const rigs = [];

            for (const cluster of selectedClusters) {
                const members = [];
                for (const mesh of allMeshes) {
                    if (assignedMeshes.has(mesh.uuid)) {
                        continue;
                    }

                    if (isStaticWheelPart(mesh)) {
                        continue;
                    }

                    const size = getMeshSize(mesh);
                    if (Math.max(size.x, size.y, size.z) > maxPartSize) {
                        continue;
                    }

                    const center = getMeshCenter(mesh);
                    if (center.distanceTo(cluster.center) <= captureDistance) {
                        members.push(mesh);
                    }
                }

                if (!members.length) {
                    continue;
                }

                const pivotCenter = new THREE.Vector3();
                for (const mesh of members) {
                    pivotCenter.add(getMeshCenter(mesh));
                }
                pivotCenter.multiplyScalar(1 / members.length);

                const axis = new THREE.Vector3(1, 0, 0);

                const pivot = new THREE.Group();
                pivot.position.copy(pivotCenter);
                const steerGroup = new THREE.Group();
                pivot.add(steerGroup);
                const rollGroup = new THREE.Group();
                steerGroup.add(rollGroup);
                const spinGroup = new THREE.Group();
                rollGroup.add(spinGroup);

                root.add(pivot);

                const memberLabels = [];
                for (const mesh of members) {
                    const meshName = mesh.name || mesh.uuid;
                    const parentName = mesh.parent && mesh.parent.name ? mesh.parent.name : '';
                    memberLabels.push(parentName ? `${meshName} ${parentName}` : meshName);
                }

                for (const mesh of members) {
                    assignedMeshes.add(mesh.uuid);
                    spinGroup.attach(mesh);
                }

                rigs.push({
                    pivot,
                    steerGroup,
                    rollGroup,
                    spinGroup,
                    axis,
                    baseCenter: pivotCenter.clone(),
                    axisOffset: new THREE.Vector3(),
                    memberLabels
                });
            }

            return rigs;
        }

        function rotateWheels(deltaRotation) {
            if (!wheelRigs.length || Math.abs(deltaRotation) < 0.000001) {
                return false;
            }

            const reversedRotation = -deltaRotation;
            for (const wheel of wheelRigs) {
                const rollTarget = wheel.rollGroup || wheel.pivot;
                rollTarget.rotateOnAxis(wheel.axis, reversedRotation);
            }

            return true;
        }

        function resetVehicleStateForTakeControl() {
            wheelAutoSpin = false;
            wheelSpinSpeed = 0;
            pendingWheelGestureRotation = 0;
            smoothedScrollWheelDelta = 0;

            for (const wheel of wheelRigs) {
                const rollTarget = wheel.rollGroup || wheel.pivot;
                if (rollTarget) {
                    rollTarget.rotation.set(0, 0, 0);
                }
            }

            steerLeftPressed = false;
            steerRightPressed = false;
            steeringTargetAngle = 0;
            steeringAngle = 0;
            applyFrontWheelSteering(0);

            setDoorOpenState(false);
            for (const door of doorRigs) {
                door.targetRotationY = door.closedRotationY;
                door.currentRotationY = door.closedRotationY;
                const rotationTarget = door.pivot || door.node;
                if (rotationTarget) {
                    rotationTarget.rotation.y = door.closedRotationY;
                }
            }

            requestShadowUpdate();
        }

        function updateScrollDrivenWheelRotation(deltaTime) {
            const currentScrollTop = scrollContainer.scrollTop || 0;
            const rawScrollDelta = currentScrollTop - lastScrollTop;
            lastScrollTop = currentScrollTop;

            if (!engineRunning) {
                pendingWheelGestureRotation = 0;
                smoothedScrollWheelDelta = 0;
                return false;
            }

            const hasWheels = wheelRigs.length > 0;
            const hasScrollData = Number.isFinite(rawScrollDelta);
            let targetRotationDelta = 0;

            if (hasWheels && hasScrollData && rawScrollDelta !== 0 && scrollWheelSpinIntensity !== 0) {
                const clampedScrollDelta = THREE.MathUtils.clamp(rawScrollDelta, -maxScrollDeltaPerFrame, maxScrollDeltaPerFrame);
                targetRotationDelta = clampedScrollDelta * scrollWheelSpinIntensity;
            }

            // Fallback for short/no-scroll layouts: keep wheel rotation reactive to scroll gestures.
            const gestureRotationDelta = pendingWheelGestureRotation;
            pendingWheelGestureRotation = 0;
            if (targetRotationDelta === 0 && gestureRotationDelta !== 0) {
                targetRotationDelta = gestureRotationDelta;
            }

            const safeDeltaTime = Math.max(1 / 240, deltaTime || 0);
            const safeDuration = Math.max(0.001, scrollWheelSmoothDuration);
            const blend = 1 - Math.exp(-safeDeltaTime / safeDuration);
            smoothedScrollWheelDelta = THREE.MathUtils.lerp(smoothedScrollWheelDelta, targetRotationDelta, blend);

            if (Math.abs(smoothedScrollWheelDelta) < 0.000001 && Math.abs(targetRotationDelta) < 0.000001) {
                smoothedScrollWheelDelta = 0;
                return false;
            }

            if (!hasWheels) {
                return false;
            }

            return rotateWheels(smoothedScrollWheelDelta);
        }

        function applyWheelAxisPoint(wheel) {
            if (!wheel || !wheel.baseCenter || !wheel.axisOffset) {
                return;
            }

            wheel.pivot.position.copy(wheel.baseCenter).add(wheel.axisOffset);
            if (wheel.spinGroup) {
                wheel.spinGroup.position.set(
                    -wheel.axisOffset.x,
                    -wheel.axisOffset.y,
                    -wheel.axisOffset.z
                );
            }
        }

        function getWheelAxisPoint(wheel) {
            if (!wheel || !wheel.baseCenter || !wheel.axisOffset) {
                return new THREE.Vector3();
            }

            return wheel.baseCenter.clone().add(wheel.axisOffset);
        }

        function applyHardcodedWheelAxisPoints() {
            if (!wheelRigs.length) {
                return;
            }

            for (let i = 0; i < wheelRigs.length; i += 1) {
                const wheel = wheelRigs[i];
                if (!wheel || !wheel.baseCenter || !wheel.axisOffset) {
                    continue;
                }

                const hardcodedPoint = hardcodedWheelAxisPoints[i];
                if (!hardcodedPoint) {
                    wheel.axisOffset.set(0, 0, 0);
                    applyWheelAxisPoint(wheel);
                    continue;
                }

                wheel.axisOffset.copy(hardcodedPoint).sub(wheel.baseCenter);
                applyWheelAxisPoint(wheel);
            }
        }

        function attachMappedCalipersToWheelSteering(root) {
            if (!root || !wheelRigs.length) {
                return;
            }

            caliperDebugStatus.length = 0;

            const meshesByName = new Map();
            root.traverse((node) => {
                if (!node || !node.isMesh || !node.name) {
                    return;
                }

                const key = node.name.toLowerCase();
                if (!meshesByName.has(key)) {
                    meshesByName.set(key, []);
                }

                meshesByName.get(key).push(node);
            });

            const chooseNearestSteeringWheelIndex = (mesh) => {
                const candidateIndices = frontWheelIndices.length
                    ? frontWheelIndices
                    : wheelRigs.map((_, index) => index);

                let nearestIndex = candidateIndices[0] ?? 0;
                let nearestDistance = Number.POSITIVE_INFINITY;
                const meshCenter = new THREE.Box3().setFromObject(mesh).getCenter(new THREE.Vector3());

                for (const wheelIndex of candidateIndices) {
                    const wheel = wheelRigs[wheelIndex];
                    if (!wheel) {
                        continue;
                    }

                    const axisPoint = getWheelAxisPoint(wheel);
                    const distance = meshCenter.distanceTo(axisPoint);
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestIndex = wheelIndex;
                    }
                }

                return nearestIndex;
            };

            for (let i = 0; i < manualCaliperMeshByWheelIndex.length; i += 1) {
                const wheel = wheelRigs[i];
                const targetName = manualCaliperMeshByWheelIndex[i];
                if (!wheel || !wheel.steerGroup || !targetName) {
                    continue;
                }

                const targetMeshes = meshesByName.get(targetName) || [];
                for (const mesh of targetMeshes) {
                    wheel.steerGroup.attach(mesh);
                }

                const statusText = targetMeshes.length > 0
                    ? `W${i + 1} ${targetName} x${targetMeshes.length}`
                    : `W${i + 1} ${targetName} missing`;
                caliperDebugStatus.push(statusText);
            }

            for (const extraName of manualExtraCaliperMeshNames) {
                const targetMeshes = meshesByName.get(extraName) || [];
                if (!targetMeshes.length) {
                    caliperDebugStatus.push(`Extra ${extraName} missing`);
                    continue;
                }

                const attachedByWheel = new Map();
                for (const mesh of targetMeshes) {
                    const wheelIndex = chooseNearestSteeringWheelIndex(mesh);
                    const wheel = wheelRigs[wheelIndex];
                    if (!wheel || !wheel.steerGroup) {
                        continue;
                    }

                    wheel.steerGroup.attach(mesh);
                    attachedByWheel.set(wheelIndex, (attachedByWheel.get(wheelIndex) || 0) + 1);
                }

                if (!attachedByWheel.size) {
                    caliperDebugStatus.push(`Extra ${extraName} missing`);
                    continue;
                }

                const attachSummary = Array.from(attachedByWheel.entries())
                    .map(([wheelIndex, count]) => `W${wheelIndex + 1} x${count}`)
                    .join(', ');
                caliperDebugStatus.push(`Extra ${extraName} -> ${attachSummary}`);
            }

            updateCaliperDebugInfo();
        }

        function updateCaliperDebugInfo() {
            return;
            const caliperDebugEl = document.getElementById('caliper-debug');
            if (!caliperDebugEl) {
                return;
            }

            if (!caliperDebugStatus.length) {
                const mainCalipers = manualCaliperMeshByWheelIndex
                    .map((name, index) => `W${index + 1} ${name}`);
                const extraCalipers = manualExtraCaliperMeshNames
                    .map((name) => `Extra ${name}`);
                caliperDebugEl.textContent = [...mainCalipers, ...extraCalipers].join(' | ');
                return;
            }

            caliperDebugEl.textContent = caliperDebugStatus.join(' | ');
        }

        function updateFrontWheelIndices() {
            frontWheelIndices.length = 0;

            if (!wheelRigs.length) {
                return;
            }

            if (wheelRigs.length <= 2) {
                for (let i = 0; i < wheelRigs.length; i += 1) {
                    frontWheelIndices.push(i);
                }
                return;
            }

            const indexedPoints = wheelRigs.map((wheel, index) => ({
                index,
                point: getWheelAxisPoint(wheel)
            }));

            const xValues = indexedPoints.map((item) => item.point.x);
            const zValues = indexedPoints.map((item) => item.point.z);
            const xRange = Math.max(...xValues) - Math.min(...xValues);
            const zRange = Math.max(...zValues) - Math.min(...zValues);
            const longitudinalAxis = zRange >= xRange ? 'z' : 'x';

            indexedPoints.sort((a, b) => a.point[longitudinalAxis] - b.point[longitudinalAxis]);
            const frontCount = Math.min(2, indexedPoints.length);
            for (let i = 0; i < frontCount; i += 1) {
                frontWheelIndices.push(indexedPoints[i].index);
            }
        }

        function applyFrontWheelSteering(targetAngle) {
            const clampedAngle = THREE.MathUtils.clamp(targetAngle, -maxSteeringAngle, maxSteeringAngle);
            const frontSet = new Set(frontWheelIndices);

            for (let i = 0; i < wheelRigs.length; i += 1) {
                const wheel = wheelRigs[i];
                if (!wheel || !wheel.steerGroup) {
                    continue;
                }

                wheel.steerGroup.rotation.y = frontSet.has(i) ? clampedAngle : 0;
            }
        }

        function syncSteeringFromInput() {
            if (steerLeftPressed && !steerRightPressed) {
                steeringTargetAngle = maxSteeringAngle;
                return;
            }

            if (steerRightPressed && !steerLeftPressed) {
                steeringTargetAngle = -maxSteeringAngle;
                return;
            }

            steeringTargetAngle = 0;
        }

        function updateSteeringAnimation(deltaTime) {
            const clampedTarget = THREE.MathUtils.clamp(steeringTargetAngle, -maxSteeringAngle, maxSteeringAngle);
            const safeDuration = Math.max(0.001, steeringAnimationDuration);
            const blend = 1 - Math.exp(-deltaTime / safeDuration);
            const previousSteeringAngle = steeringAngle;

            steeringAngle = THREE.MathUtils.lerp(steeringAngle, clampedTarget, blend);
            if (Math.abs(clampedTarget - steeringAngle) < steeringSnapEpsilon) {
                steeringAngle = clampedTarget;
            }

            if (Math.abs(steeringAngle - previousSteeringAngle) < 0.000001) {
                return false;
            }

            applyFrontWheelSteering(steeringAngle);
            return true;
        }

        async function ensureEngineAudioInitialized() {
            if (engineAudioReady) {
                return true;
            }

            if (engineAudioLoadingPromise) {
                await engineAudioLoadingPromise;
                return engineAudioReady;
            }

            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                console.warn('Web Audio API is not available; engine audio cannot start.');
                return false;
            }

            engineAudioLoadingPromise = (async () => {
                if (!engineAudioContext) {
                    engineAudioContext = new AudioContextClass();
                    engineMasterGainNode = engineAudioContext.createGain();
                    engineMasterGainNode.gain.value = 1;
                    engineMasterGainNode.connect(engineAudioContext.destination);
                }

                let preloadedBuffers = engineAudioPreloadedBuffers;
                if (!preloadedBuffers && engineAudioPreloadPromise) {
                    await engineAudioPreloadPromise;
                    preloadedBuffers = engineAudioPreloadedBuffers;
                }

                const decodeEngineAudioBuffers = async (bufferSet) => {
                    if (!bufferSet) {
                        throw new Error('Missing engine audio buffers.');
                    }

                    const startArrayBuffer = bufferSet.startArrayBuffer;
                    const loopArrayBuffer = bufferSet.loopArrayBuffer;
                    const revArrayBuffer = bufferSet.revArrayBuffer;

                    if (
                        !(startArrayBuffer instanceof ArrayBuffer)
                        || !(loopArrayBuffer instanceof ArrayBuffer)
                        || !(revArrayBuffer instanceof ArrayBuffer)
                        || startArrayBuffer.byteLength === 0
                        || loopArrayBuffer.byteLength === 0
                        || revArrayBuffer.byteLength === 0
                    ) {
                        throw new Error('Engine audio buffers are empty or invalid.');
                    }

                    const [decodedStartBuffer, decodedLoopBuffer, decodedRevBuffer] = await Promise.all([
                        engineAudioContext.decodeAudioData(startArrayBuffer.slice(0)),
                        engineAudioContext.decodeAudioData(loopArrayBuffer.slice(0)),
                        engineAudioContext.decodeAudioData(revArrayBuffer.slice(0))
                    ]);

                    return {
                        decodedStartBuffer,
                        decodedLoopBuffer,
                        decodedRevBuffer
                    };
                };

                if (!preloadedBuffers) {
                    preloadedBuffers = await fetchEngineAudioArrayBuffers({ cache: 'force-cache' });
                }

                let decodedBuffers;
                try {
                    decodedBuffers = await decodeEngineAudioBuffers(preloadedBuffers);
                } catch (error) {
                    console.warn('Engine audio decode failed from warmup/cached buffers. Retrying with fresh fetch.', error);

                    engineAudioPreloadedBuffers = null;
                    await clearEngineAudioPersistentCache();
                    const freshBuffers = await fetchEngineAudioArrayBuffers({ cache: 'no-store' });
                    decodedBuffers = await decodeEngineAudioBuffers(freshBuffers);
                }

                engineStartBuffer = decodedBuffers.decodedStartBuffer;
                engineLoopBuffer = decodedBuffers.decodedLoopBuffer;
                engineRevBuffer = decodedBuffers.decodedRevBuffer;
                engineAudioReady = true;
                engineAudioPreloadedBuffers = null;
            })();

            try {
                await engineAudioLoadingPromise;
            } catch (error) {
                engineAudioReady = false;
                console.warn('Engine audio initialization failed:', error);
            } finally {
                engineAudioLoadingPromise = null;
            }

            return engineAudioReady;
        }

        function hideEngineStartRequiredPopup() {
            if (engineStartRequiredPopupHideTimer !== null) {
                window.clearTimeout(engineStartRequiredPopupHideTimer);
                engineStartRequiredPopupHideTimer = null;
            }

            if (!engineStartRequiredPopupEl) {
                return;
            }

            engineStartRequiredPopupEl.style.opacity = '0';
            engineStartRequiredPopupEl.style.transform = 'translateX(-50%) translateY(10px)';
        }

        function showEngineStartRequiredPopup(message = engineStartRequiredMessage) {
            const nowMs = performance.now();
            if (nowMs - engineStartRequiredPopupLastShownAt < engineStartRequiredPopupCooldownMs) {
                return;
            }

            engineStartRequiredPopupLastShownAt = nowMs;

            if (!engineStartRequiredPopupEl) {
                const popup = document.createElement('div');
                popup.style.position = 'fixed';
                popup.style.left = '50%';
                popup.style.bottom = '28px';
                popup.style.transform = 'translateX(-50%) translateY(10px)';
                popup.style.padding = '10px 14px';
                popup.style.borderRadius = '10px';
                popup.style.background = 'rgba(0, 0, 0, 0.86)';
                popup.style.border = '1px solid rgba(255, 255, 255, 0.35)';
                popup.style.color = '#ffffff';
                popup.style.fontFamily = 'monospace';
                popup.style.fontSize = '12px';
                popup.style.letterSpacing = '0.02em';
                popup.style.pointerEvents = 'none';
                popup.style.zIndex = '1200';
                popup.style.opacity = '0';
                popup.style.transition = 'opacity 140ms ease, transform 140ms ease';
                document.body.appendChild(popup);
                engineStartRequiredPopupEl = popup;
            }

            engineStartRequiredPopupEl.textContent = message;
            engineStartRequiredPopupEl.style.opacity = '1';
            engineStartRequiredPopupEl.style.transform = 'translateX(-50%) translateY(0)';

            if (engineStartRequiredPopupHideTimer !== null) {
                window.clearTimeout(engineStartRequiredPopupHideTimer);
                engineStartRequiredPopupHideTimer = null;
            }

            engineStartRequiredPopupHideTimer = window.setTimeout(() => {
                engineStartRequiredPopupHideTimer = null;
                hideEngineStartRequiredPopup();
            }, engineStartRequiredPopupDurationMs);
        }

        function triggerRevFromUserInput(revInputStrength = wheelGestureDeltaClamp) {
            if (!engineRunning) {
                showEngineStartRequiredPopup();
                return;
            }

            const scrollStrength = Math.abs(revInputStrength);
            if (scrollStrength < engineRevScrollDeltaThreshold) {
                return;
            }

            const strengthNormalized = THREE.MathUtils.clamp(
                scrollStrength / Math.max(1, wheelGestureDeltaClamp),
                0,
                1
            );
            const pulseTarget = THREE.MathUtils.clamp(
                engineRevPulseStrengthMin + (strengthNormalized * engineRevPulseStrengthRange),
                0,
                1
            );

            engineRevPulseStrengthNormalized = Math.max(
                engineRevPulseStrengthNormalized * 0.72,
                pulseTarget
            );
            engineRevPulseActiveUntilMs = performance.now() + engineRevPulseHoldMs;
        }

        function startEngineRevHold() {
            if (!engineRunning) {
                showEngineStartRequiredPopup();
                return false;
            }

            if (!engineRevHoldActive) {
                engineRevHoldStrengthNormalized = THREE.MathUtils.clamp(
                    engineRevHoldStrengthMin + (Math.random() * engineRevHoldStrengthRange),
                    0,
                    1
                );
            }

            engineRevHoldActive = true;
            return true;
        }

        function stopEngineRevHold() {
            if (!engineRevHoldActive) {
                return;
            }

            engineRevHoldActive = false;
            engineRevPulseStrengthNormalized = Math.max(
                engineRevPulseStrengthNormalized,
                engineRevHoldStrengthNormalized * 0.9
            );
            engineRevPulseActiveUntilMs = Math.max(
                engineRevPulseActiveUntilMs,
                performance.now() + engineRevPulseHoldMs
            );
        }

        function resetEngineRevDynamicsState() {
            engineRevCurrentNormalized = 0;
            engineRevTargetNormalized = 0;
            engineRevHoldActive = false;
            engineRevHoldStrengthNormalized = 0;
            engineRevPulseStrengthNormalized = 0;
            engineRevPulseActiveUntilMs = 0;
        }

        function getEngineLoopPlaybackRateFromNormalizedRev(revNormalized) {
            const clampedRev = THREE.MathUtils.clamp(revNormalized, 0, 1);
            return THREE.MathUtils.lerp(engineLoopPlaybackRateIdle, engineLoopPlaybackRateMax, clampedRev);
        }

        function updateEngineRevDynamics(deltaTime) {
            if (!engineRunning || !engineLoopSourceNode || !engineAudioContext) {
                if (!engineRunning) {
                    resetEngineRevDynamicsState();
                }
                return;
            }

            const nowMs = performance.now();
            let nextRevTarget = 0;

            if (engineRevHoldActive) {
                nextRevTarget = Math.max(nextRevTarget, engineRevHoldStrengthNormalized);
            }

            if (nowMs < engineRevPulseActiveUntilMs) {
                nextRevTarget = Math.max(nextRevTarget, engineRevPulseStrengthNormalized);
            } else {
                engineRevPulseStrengthNormalized = 0;
            }

            engineRevTargetNormalized = nextRevTarget;

            const rising = engineRevTargetNormalized > engineRevCurrentNormalized;
            const timeConstant = rising ? engineRevRiseTimeConstant : engineRevFallTimeConstant;
            const safeTime = Math.max(0.001, Number(deltaTime) || 0);
            const blend = 1 - Math.exp(-safeTime / Math.max(0.001, timeConstant));
            engineRevCurrentNormalized = THREE.MathUtils.lerp(engineRevCurrentNormalized, engineRevTargetNormalized, blend);

            if (Math.abs(engineRevTargetNormalized - engineRevCurrentNormalized) < 0.0005) {
                engineRevCurrentNormalized = engineRevTargetNormalized;
            }

            const playbackRate = getEngineLoopPlaybackRateFromNormalizedRev(engineRevCurrentNormalized);
            const now = engineAudioContext.currentTime;
            engineLoopSourceNode.playbackRate.setTargetAtTime(playbackRate, now, timeConstant);
        }

        function stopAndDisconnectSourceNode(sourceNode) {
            if (!sourceNode) {
                return;
            }

            try {
                sourceNode.onended = null;
                sourceNode.stop(0);
            } catch (error) {
                // Ignore stop errors when node already ended.
            }

            try {
                sourceNode.disconnect();
            } catch (error) {
                // Ignore disconnect errors.
            }
        }

        function stopEngineRevSource() {
            stopAndDisconnectSourceNode(engineRevSourceNode);
            engineRevSourceNode = null;
        }

        function stopEngineStopTailSource() {
            stopAndDisconnectSourceNode(engineStopTailSourceNode);
            engineStopTailSourceNode = null;
        }

        function startEngineRevPlayback(strengthNormalized) {
            if (!engineAudioContext || !engineMasterGainNode || !engineRevBuffer) {
                return;
            }

            const clampedStrength = THREE.MathUtils.clamp(strengthNormalized, 0, 1);
            const now = engineAudioContext.currentTime;
            const revGain = THREE.MathUtils.lerp(
                engineRunning ? engineRevAudioVolumeWhileRunning : engineRevAudioVolumeWhenStopped,
                engineRevAudioVolumeWhenStopped,
                clampedStrength
            );
            const playbackRate = THREE.MathUtils.lerp(engineRevPlaybackRateMin, engineRevPlaybackRateMax, clampedStrength);
            const revDuration = Math.max(0.12, engineRevBuffer.duration / Math.max(0.01, playbackRate));

            const revSource = engineAudioContext.createBufferSource();
            revSource.buffer = engineRevBuffer;
            revSource.playbackRate.setValueAtTime(playbackRate, now);

            const revFilter = engineAudioContext.createBiquadFilter();
            revFilter.type = 'bandpass';
            revFilter.frequency.setValueAtTime(THREE.MathUtils.lerp(720, 1450, clampedStrength), now);
            revFilter.Q.setValueAtTime(0.8, now);

            const revGainNode = engineAudioContext.createGain();
            revGainNode.gain.setValueAtTime(0.0001, now);
            revGainNode.gain.exponentialRampToValueAtTime(Math.max(0.001, revGain), now + 0.025);
            revGainNode.gain.setValueAtTime(Math.max(0.001, revGain), now + Math.max(0.05, revDuration - 0.09));
            revGainNode.gain.exponentialRampToValueAtTime(0.001, now + revDuration);

            revSource.connect(revFilter);
            revFilter.connect(revGainNode);
            revGainNode.connect(engineMasterGainNode);

            revSource.onended = () => {
                try {
                    revSource.disconnect();
                    revFilter.disconnect();
                    revGainNode.disconnect();
                } catch (error) {
                    // Ignore disconnect errors.
                }

                if (engineRevSourceNode === revSource) {
                    engineRevSourceNode = null;
                }
            };

            engineRevSourceNode = revSource;
            revSource.start(now, 0);
        }

        async function triggerEngineRevFromScroll(scrollDelta) {
            if (!engineRunning) {
                return;
            }

            const scrollStrength = Math.abs(scrollDelta);
            if (scrollStrength < engineRevScrollDeltaThreshold) {
                return;
            }

            const initialized = await ensureEngineAudioInitialized();
            if (!initialized || !engineAudioContext || !engineMasterGainNode || !engineRevBuffer) {
                return;
            }

            if (engineAudioContext.state === 'suspended') {
                try {
                    await engineAudioContext.resume();
                } catch (error) {
                    return;
                }
            }

            const strengthNormalized = THREE.MathUtils.clamp(scrollStrength / Math.max(1, wheelGestureDeltaClamp), 0, 1);

            if (engineRevSourceNode) {
                return;
            }

            startEngineRevPlayback(strengthNormalized);
        }

        async function playEngineStopDampedEffect() {
            if (!engineAudioContext || !engineMasterGainNode || !engineLoopBuffer) {
                return;
            }

            if (engineAudioContext.state === 'suspended') {
                try {
                    await engineAudioContext.resume();
                } catch (error) {
                    return;
                }
            }

            stopEngineStopTailSource();

            const now = engineAudioContext.currentTime;
            const loopDuration = Math.max(0.05, engineLoopBuffer.duration);
            const maxStartOffset = Math.max(0, loopDuration - 0.12);
            const startOffset = THREE.MathUtils.clamp(engineLoopTrimStart, 0, maxStartOffset);
            const availableDuration = Math.max(0.12, loopDuration - startOffset - Math.max(0, engineLoopTrimEnd));
            const tailDuration = Math.min(engineStopTailDurationSeconds, availableDuration);

            const tailSource = engineAudioContext.createBufferSource();
            tailSource.buffer = engineLoopBuffer;
            tailSource.playbackRate.setValueAtTime(engineStopTailPlaybackRateStart, now);
            tailSource.playbackRate.exponentialRampToValueAtTime(
                engineStopTailPlaybackRateEnd,
                now + tailDuration + 0.08
            );

            const tailFilter = engineAudioContext.createBiquadFilter();
            tailFilter.type = 'lowpass';
            tailFilter.frequency.setValueAtTime(engineStopTailLowpassStartHz, now);
            tailFilter.frequency.exponentialRampToValueAtTime(
                engineStopTailLowpassEndHz,
                now + tailDuration + 0.08
            );

            const tailGainNode = engineAudioContext.createGain();
            tailGainNode.gain.setValueAtTime(Math.max(0.001, engineStopTailVolume), now);
            tailGainNode.gain.exponentialRampToValueAtTime(0.001, now + tailDuration + 0.12);

            tailSource.connect(tailFilter);
            tailFilter.connect(tailGainNode);
            tailGainNode.connect(engineMasterGainNode);

            tailSource.onended = () => {
                try {
                    tailSource.disconnect();
                    tailFilter.disconnect();
                    tailGainNode.disconnect();
                } catch (error) {
                    // Ignore disconnect errors.
                }

                if (engineStopTailSourceNode === tailSource) {
                    engineStopTailSourceNode = null;
                }
            };

            engineStopTailSourceNode = tailSource;

            try {
                tailSource.start(now, startOffset, tailDuration);
                tailSource.stop(now + tailDuration + 0.04);
            } catch (error) {
                stopEngineStopTailSource();
            }
        }

        function stopEngineSources() {
            stopAndDisconnectSourceNode(engineStartSourceNode);
            stopAndDisconnectSourceNode(engineLoopSourceNode);
            engineStartSourceNode = null;
            engineLoopSourceNode = null;
        }

        function stopEngineAudioPlayback(options = {}) {
            const playDampedStopEffect = options.playDampedStopEffect !== false;
            const wasRunning = engineRunning;

            engineRunning = false;
            engineStartSequenceId += 1;
            resetEngineRevDynamicsState();

            stopEngineRevSource();
            stopEngineSources();

            if (playDampedStopEffect && wasRunning) {
                void playEngineStopDampedEffect();
                return;
            }

            stopEngineStopTailSource();
        }

        async function startEngineAudioPlayback() {
            if (engineRunning) {
                return;
            }

            hideEngineStartRequiredPopup();
            stopEngineStopTailSource();
            engineRunning = true;
            const sequenceId = ++engineStartSequenceId;
            const initialized = await ensureEngineAudioInitialized();

            if (!initialized || !engineAudioContext || !engineMasterGainNode || !engineStartBuffer || !engineLoopBuffer) {
                if (sequenceId === engineStartSequenceId) {
                    engineRunning = false;
                }

                showEngineStartRequiredPopup(engineAudioLoadingMessage);
                return;
            }

            if (sequenceId !== engineStartSequenceId || !engineRunning) {
                return;
            }

            if (engineAudioContext.state === 'suspended') {
                try {
                    await engineAudioContext.resume();
                } catch (error) {
                    if (sequenceId === engineStartSequenceId) {
                        engineRunning = false;
                    }
                    console.warn('Engine audio context resume failed:', error);
                    return;
                }
            }

            if (sequenceId !== engineStartSequenceId || !engineRunning) {
                return;
            }

            stopEngineSources();
            resetEngineRevDynamicsState();

            const now = engineAudioContext.currentTime + 0.01;
            const startSource = engineAudioContext.createBufferSource();
            startSource.buffer = engineStartBuffer;

            const startGainNode = engineAudioContext.createGain();
            startGainNode.gain.setValueAtTime(engineStartAudioVolume, now);
            startSource.connect(startGainNode);
            startGainNode.connect(engineMasterGainNode);

            const loopSource = engineAudioContext.createBufferSource();
            loopSource.buffer = engineLoopBuffer;
            loopSource.loop = true;
            loopSource.playbackRate.setValueAtTime(getEngineLoopPlaybackRateFromNormalizedRev(0), now);

            const loopDuration = Math.max(0.05, engineLoopBuffer.duration);
            const trimStart = Math.min(engineLoopTrimStart, loopDuration * 0.2);
            const trimEnd = Math.min(engineLoopTrimEnd, loopDuration * 0.2);
            const loopStart = trimStart;
            const loopEnd = Math.max(loopStart + 0.05, loopDuration - trimEnd);
            loopSource.loopStart = loopStart;
            loopSource.loopEnd = loopEnd;

            const loopGainNode = engineAudioContext.createGain();
            loopGainNode.gain.setValueAtTime(engineLoopAudioVolume, now);
            loopSource.connect(loopGainNode);
            loopGainNode.connect(engineMasterGainNode);

            startSource.onended = () => {
                try {
                    startSource.disconnect();
                    startGainNode.disconnect();
                } catch (error) {
                    // Ignore disconnect errors.
                }

                if (engineStartSourceNode === startSource) {
                    engineStartSourceNode = null;
                }

                if (sequenceId !== engineStartSequenceId || !engineRunning || !engineLoopSourceNode) {
                    return;
                }

                try {
                    loopSource.start(engineAudioContext.currentTime + 0.005, loopStart);
                } catch (error) {
                    if (sequenceId === engineStartSequenceId) {
                        engineRunning = false;
                    }
                    stopEngineSources();
                }
            };

            loopSource.onended = () => {
                try {
                    loopSource.disconnect();
                    loopGainNode.disconnect();
                } catch (error) {
                    // Ignore disconnect errors.
                }

                if (engineLoopSourceNode === loopSource) {
                    engineLoopSourceNode = null;
                }
            };

            engineStartSourceNode = startSource;
            engineLoopSourceNode = loopSource;

            try {
                startSource.start(now);
            } catch (error) {
                if (sequenceId === engineStartSequenceId) {
                    engineRunning = false;
                }

                stopEngineSources();
                console.warn('Engine audio playback failed:', error);
            }
        }

        function toggleEngineAudioPlayback() {
            if (engineRunning) {
                stopEngineAudioPlayback();
                return;
            }

            startEngineAudioPlayback();
        }

        function setupEngineAudioControls() {
            if (engineControlsReady) {
                return;
            }

            engineControlsReady = true;

            window.addEventListener('keydown', (event) => {
                const targetTag = event.target && event.target.tagName;
                if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT') {
                    return;
                }

                if (introActive) {
                    return;
                }

                if (event.key !== 's' && event.key !== 'S') {
                    return;
                }

                event.preventDefault();
                toggleEngineAudioPlayback();
            });

            window.addEventListener('blur', () => {
                if (!engineRunning) {
                    return;
                }

                stopEngineAudioPlayback({ playDampedStopEffect: false });
            });
        }

        function setupWheelControls() {
            if (wheelControlsReady) {
                return;
            }

            wheelControlsReady = true;

            scrollContainer.addEventListener('wheel', (event) => {
                if (introActive) {
                    return;
                }

                const clampedGestureDelta = THREE.MathUtils.clamp(
                    event.deltaY,
                    -wheelGestureDeltaClamp,
                    wheelGestureDeltaClamp
                );

                triggerRevFromUserInput(clampedGestureDelta);

                if (!engineRunning) {
                    return;
                }

                if (!wheelRigs.length) {
                    return;
                }

                pendingWheelGestureRotation += clampedGestureDelta * wheelGestureSpinIntensity;
            }, { passive: true });

            window.addEventListener('keydown', (event) => {
                const targetTag = event.target && event.target.tagName;
                if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT') {
                    return;
                }

                if (introActive) {
                    return;
                }

                if (event.code === 'Space' || event.key === 'm' || event.key === 'M') {
                    event.preventDefault();
                    if (!event.repeat) {
                        startEngineRevHold();
                    }
                    return;
                }

                let handled = false;
                if (event.key === 't' || event.key === 'T') {
                    wheelAutoSpin = !wheelAutoSpin;
                    handled = true;
                } else if (event.key === 'r' || event.key === 'R') {
                    wheelSpinSpeed = Math.min(40, wheelSpinSpeed + 1);
                    handled = true;
                } else if (event.key === 'f' || event.key === 'F') {
                    wheelSpinSpeed = Math.max(-40, wheelSpinSpeed - 1);
                    handled = true;
                } else if (event.key === 'g' || event.key === 'G') {
                    wheelAutoSpin = false;
                    wheelSpinSpeed = 0;
                    handled = true;
                }

                if (!handled) {
                    return;
                }

                event.preventDefault();
            });

            window.addEventListener('keyup', (event) => {
                if (introActive) {
                    return;
                }

                if (event.code === 'Space' || event.key === 'm' || event.key === 'M') {
                    stopEngineRevHold();
                }
            });
        }

        function setupWheelSteeringControls() {
            if (steeringControlsReady) {
                return;
            }

            steeringControlsReady = true;

            window.addEventListener('keydown', (event) => {
                const targetTag = event.target && event.target.tagName;
                if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT') {
                    return;
                }

                if (introActive) {
                    return;
                }

                let handled = false;
                if (event.key === 'ArrowLeft') {
                    steerLeftPressed = true;
                    handled = true;
                } else if (event.key === 'ArrowRight') {
                    steerRightPressed = true;
                    handled = true;
                }

                if (!handled) {
                    return;
                }

                event.preventDefault();
                syncSteeringFromInput();
            });

            window.addEventListener('keyup', (event) => {
                let handled = false;
                if (event.key === 'ArrowLeft') {
                    steerLeftPressed = false;
                    handled = true;
                } else if (event.key === 'ArrowRight') {
                    steerRightPressed = false;
                    handled = true;
                }

                if (!handled) {
                    return;
                }

                syncSteeringFromInput();
            });

            window.addEventListener('blur', () => {
                steerLeftPressed = false;
                steerRightPressed = false;
                syncSteeringFromInput();
            });
        }

        function setInputValue(inputId, value) {
            const input = document.getElementById(inputId);
            if (!input) {
                return;
            }

            const isFocusedInput = document.activeElement === input;
            if (isFocusedInput && !isTranslateDrag && !isRotateDrag) {
                return;
            }

            const liveDecimals = isTranslateDrag || isRotateDrag ? 3 : 2;
            input.value = Number(value).toFixed(liveDecimals);
        }

        function getCamInNudgeStep() {
            const stepInput = document.getElementById('cam-step');
            const fallbackStep = 0.02;

            if (!stepInput) {
                return fallbackStep;
            }

            const parsed = parseFloat(stepInput.value);
            if (!Number.isFinite(parsed) || parsed <= 0) {
                stepInput.value = fallbackStep.toFixed(3);
                return fallbackStep;
            }

            return parsed;
        }

        function nudgeInteriorCameraPosition(dx, dy, dz) {
            interiorCameraPosition.x += dx;
            interiorCameraPosition.y += dy;
            interiorCameraPosition.z += dz;
            shiftCameraInsideCar(false);
            updateKeyframeEditorInputs();
        }

        function nudgeInteriorCameraTarget(dx, dy, dz) {
            interiorCameraTarget.x += dx;
            interiorCameraTarget.y += dy;
            interiorCameraTarget.z += dz;
            shiftCameraInsideCar(false);
            updateKeyframeEditorInputs();
        }

        function setupCamInNudgeControls() {
            if (camInNudgeControlsReady) {
                return;
            }

            const stepInput = document.getElementById('cam-step');
            const requiredButtonIds = [
                'cam-pos-x-neg',
                'cam-pos-x-pos',
                'cam-pos-y-neg',
                'cam-pos-y-pos',
                'cam-pos-z-neg',
                'cam-pos-z-pos',
                'cam-tgt-x-neg',
                'cam-tgt-x-pos',
                'cam-tgt-y-neg',
                'cam-tgt-y-pos',
                'cam-tgt-z-neg',
                'cam-tgt-z-pos',
                'cam-capture-current',
                'cam-preview'
            ];

            if (!stepInput || requiredButtonIds.some((id) => !document.getElementById(id))) {
                return;
            }

            camInNudgeControlsReady = true;

            const bindButton = (buttonId, handler) => {
                const button = document.getElementById(buttonId);
                if (!button) {
                    return;
                }

                button.addEventListener('click', (event) => {
                    event.preventDefault();
                    handler();
                });
            };

            bindButton('cam-pos-x-neg', () => {
                const step = getCamInNudgeStep();
                nudgeInteriorCameraPosition(-step, 0, 0);
            });
            bindButton('cam-pos-x-pos', () => {
                const step = getCamInNudgeStep();
                nudgeInteriorCameraPosition(step, 0, 0);
            });
            bindButton('cam-pos-y-neg', () => {
                const step = getCamInNudgeStep();
                nudgeInteriorCameraPosition(0, -step, 0);
            });
            bindButton('cam-pos-y-pos', () => {
                const step = getCamInNudgeStep();
                nudgeInteriorCameraPosition(0, step, 0);
            });
            bindButton('cam-pos-z-neg', () => {
                const step = getCamInNudgeStep();
                nudgeInteriorCameraPosition(0, 0, -step);
            });
            bindButton('cam-pos-z-pos', () => {
                const step = getCamInNudgeStep();
                nudgeInteriorCameraPosition(0, 0, step);
            });

            bindButton('cam-tgt-x-neg', () => {
                const step = getCamInNudgeStep();
                nudgeInteriorCameraTarget(-step, 0, 0);
            });
            bindButton('cam-tgt-x-pos', () => {
                const step = getCamInNudgeStep();
                nudgeInteriorCameraTarget(step, 0, 0);
            });
            bindButton('cam-tgt-y-neg', () => {
                const step = getCamInNudgeStep();
                nudgeInteriorCameraTarget(0, -step, 0);
            });
            bindButton('cam-tgt-y-pos', () => {
                const step = getCamInNudgeStep();
                nudgeInteriorCameraTarget(0, step, 0);
            });
            bindButton('cam-tgt-z-neg', () => {
                const step = getCamInNudgeStep();
                nudgeInteriorCameraTarget(0, 0, -step);
            });
            bindButton('cam-tgt-z-pos', () => {
                const step = getCamInNudgeStep();
                nudgeInteriorCameraTarget(0, 0, step);
            });

            bindButton('cam-capture-current', () => {
                if (!camera || !controls) {
                    return;
                }

                interiorCameraPosition.copy(camera.position);
                interiorCameraTarget.copy(controls.target);
                updateKeyframeEditorInputs();
            });

            bindButton('cam-preview', () => {
                shiftCameraInsideCar(false);
                updateKeyframeEditorInputs();
            });
        }

        function setActiveSectionPivotAxisValues(axisX, axisY, axisZ) {
            if (!Number.isFinite(axisX) || !Number.isFinite(axisY) || !Number.isFinite(axisZ)) {
                return false;
            }

            activeSectionIndex = getCurrentSectionIndex();
            const pivotFrame = getPivotKeyframe(activeSectionIndex);
            pivotFrame[0] = parseFloat(axisX.toFixed(2));
            pivotFrame[1] = parseFloat(axisY.toFixed(2));
            pivotFrame[2] = parseFloat(axisZ.toFixed(2));
            pivotKeyframes[activeSectionIndex] = pivotFrame;

            applyPivotOffsetFromKeyframe(activeSectionIndex);
            refreshModelTimeline();
            updateKeyframeEditorInputs();
            return true;
        }

        function setActiveSectionPivotAxisFromLocalPoint(localPoint) {
            if (!localPoint || !Number.isFinite(localPoint.x) || !Number.isFinite(localPoint.y) || !Number.isFinite(localPoint.z)) {
                return false;
            }

            return setActiveSectionPivotAxisValues(localPoint.x, localPoint.y, localPoint.z);
        }

        function estimateSteeringWheelLocalPivot() {
            if (!model) {
                return null;
            }

            model.updateMatrixWorld(true);
            const steerPattern = /(steer|steering)/i;
            const roadWheelPattern = /(tyre|tire|rim|rotor|hub|disc|brake|caliper|front[_\s-]*wheel|rear[_\s-]*wheel)/i;
            let bestCenterWorld = null;
            let bestScore = Number.NEGATIVE_INFINITY;

            model.traverse((node) => {
                if (!node || !node.isObject3D) {
                    return;
                }

                const label = getNodeHierarchyLabel(node, 8);
                if (!steerPattern.test(label) || roadWheelPattern.test(label)) {
                    return;
                }

                const bounds = new THREE.Box3().setFromObject(node);
                if (!Number.isFinite(bounds.min.x)) {
                    return;
                }

                const size = bounds.getSize(new THREE.Vector3());
                const center = bounds.getCenter(new THREE.Vector3());
                const volume = Math.max(0.000001, size.x * size.y * size.z);
                const compactnessScore = 1 / Math.cbrt(volume);
                const score = compactnessScore * 6 + center.y * 0.25;

                if (score > bestScore) {
                    bestScore = score;
                    bestCenterWorld = center.clone();
                }
            });

            if (bestCenterWorld) {
                return model.worldToLocal(bestCenterWorld.clone());
            }

            const fallbackWorld = interiorCameraPosition.clone().lerp(interiorCameraTarget, 0.4);
            return model.worldToLocal(fallbackWorld);
        }

        function setupAxisQuickControls() {
            if (axisQuickControlsReady) {
                return;
            }

            const steeringButton = document.getElementById('axis-to-steering');
            const camTargetButton = document.getElementById('axis-to-cam-target');
            if (!steeringButton || !camTargetButton) {
                return;
            }

            axisQuickControlsReady = true;

            steeringButton.addEventListener('click', (event) => {
                event.preventDefault();
                const localPoint = estimateSteeringWheelLocalPivot();
                setActiveSectionPivotAxisFromLocalPoint(localPoint);
            });

            camTargetButton.addEventListener('click', (event) => {
                event.preventDefault();
                if (!model) {
                    return;
                }

                const localPoint = model.worldToLocal(interiorCameraTarget.clone());
                setActiveSectionPivotAxisFromLocalPoint(localPoint);
            });
        }

        function getAxisNudgeStep() {
            const stepInput = document.getElementById('axis-step');
            const fallbackStep = 0.02;

            if (!stepInput) {
                return fallbackStep;
            }

            const parsed = parseFloat(stepInput.value);
            if (!Number.isFinite(parsed) || parsed <= 0) {
                stepInput.value = fallbackStep.toFixed(3);
                return fallbackStep;
            }

            return parsed;
        }

        function nudgeActiveSectionPivotAxis(dx, dy, dz) {
            activeSectionIndex = getCurrentSectionIndex();
            const pivotFrame = getPivotKeyframe(activeSectionIndex);
            return setActiveSectionPivotAxisValues(
                pivotFrame[0] + dx,
                pivotFrame[1] + dy,
                pivotFrame[2] + dz
            );
        }

        function applyActiveAxisToAllSections() {
            activeSectionIndex = getCurrentSectionIndex();
            const sourceFrame = getPivotKeyframe(activeSectionIndex);
            const targetX = parseFloat(sourceFrame[0].toFixed(2));
            const targetY = parseFloat(sourceFrame[1].toFixed(2));
            const targetZ = parseFloat(sourceFrame[2].toFixed(2));
            const sectionCount = Math.max(1, sections.length);

            for (let index = 0; index < sectionCount; index += 1) {
                if (!Array.isArray(pivotKeyframes[index]) || pivotKeyframes[index].length < 3) {
                    pivotKeyframes[index] = [targetX, targetY, targetZ];
                    continue;
                }

                pivotKeyframes[index][0] = targetX;
                pivotKeyframes[index][1] = targetY;
                pivotKeyframes[index][2] = targetZ;
            }

            applyPivotOffsetFromKeyframe(activeSectionIndex);
            refreshModelTimeline();
            updateKeyframeEditorInputs();
            return true;
        }

        function setupAxisManualControls() {
            if (axisManualControlsReady) {
                return;
            }

            const stepInput = document.getElementById('axis-step');
            const requiredButtonIds = [
                'axis-x-neg',
                'axis-x-pos',
                'axis-y-neg',
                'axis-y-pos',
                'axis-z-neg',
                'axis-z-pos',
                'axis-grab-current',
                'axis-apply-all'
            ];

            if (!stepInput || requiredButtonIds.some((id) => !document.getElementById(id))) {
                return;
            }

            axisManualControlsReady = true;

            const bindButton = (buttonId, handler) => {
                const button = document.getElementById(buttonId);
                if (!button) {
                    return;
                }

                button.addEventListener('click', (event) => {
                    event.preventDefault();
                    handler();
                });
            };

            bindButton('axis-x-neg', () => {
                const step = getAxisNudgeStep();
                nudgeActiveSectionPivotAxis(-step, 0, 0);
            });
            bindButton('axis-x-pos', () => {
                const step = getAxisNudgeStep();
                nudgeActiveSectionPivotAxis(step, 0, 0);
            });
            bindButton('axis-y-neg', () => {
                const step = getAxisNudgeStep();
                nudgeActiveSectionPivotAxis(0, -step, 0);
            });
            bindButton('axis-y-pos', () => {
                const step = getAxisNudgeStep();
                nudgeActiveSectionPivotAxis(0, step, 0);
            });
            bindButton('axis-z-neg', () => {
                const step = getAxisNudgeStep();
                nudgeActiveSectionPivotAxis(0, 0, -step);
            });
            bindButton('axis-z-pos', () => {
                const step = getAxisNudgeStep();
                nudgeActiveSectionPivotAxis(0, 0, step);
            });

            bindButton('axis-grab-current', () => {
                if (!model || !controls) {
                    return;
                }

                const localPoint = model.worldToLocal(controls.target.clone());
                setActiveSectionPivotAxisFromLocalPoint(localPoint);
            });

            bindButton('axis-apply-all', () => {
                applyActiveAxisToAllSections();
            });
        }

        function refreshModelTimeline() {
            if (!modelRig || !modelPivot) {
                return;
            }

            setupModelScrollAnimations(sections, modelRig, modelPivot);
            requestShadowUpdate();
            ScrollTrigger.refresh();
        }

        function updateKeyframeEditorInputs() {
            return;
            const modelSectionEl = document.getElementById('model-section');
            if (modelSectionEl) {
                modelSectionEl.textContent = `${activeSectionIndex + 1} / ${sections.length}`;
            }

            const activeModelFrame = modelKeyframes[activeSectionIndex] || modelKeyframes[0];
            if (activeModelFrame) {
                setInputValue('pos-x', activeModelFrame[0]);
                setInputValue('pos-y', activeModelFrame[1]);
                setInputValue('pos-z', activeModelFrame[2]);
                setInputValue('rot-x', activeModelFrame[3]);
                setInputValue('rot-y', activeModelFrame[4]);
                setInputValue('rot-z', activeModelFrame[5]);
            }

            const activePivotFrame = getPivotKeyframe(activeSectionIndex);
            setInputValue('axis-x', activePivotFrame[0]);
            setInputValue('axis-y', activePivotFrame[1]);
            setInputValue('axis-z', activePivotFrame[2]);

            const activeLightFrame = getLightKeyframe(activeSectionIndex);
            setInputValue('light-x', activeLightFrame[0]);
            setInputValue('light-y', activeLightFrame[1]);
            setInputValue('light-z', activeLightFrame[2]);

            setInputValue('cam-x', interiorCameraPosition.x);
            setInputValue('cam-y', interiorCameraPosition.y);
            setInputValue('cam-z', interiorCameraPosition.z);
            setInputValue('cam-tx', interiorCameraTarget.x);
            setInputValue('cam-ty', interiorCameraTarget.y);
            setInputValue('cam-tz', interiorCameraTarget.z);
            setInputValue('cam-ax', interiorCameraTarget.x - interiorCameraPosition.x);
            setInputValue('cam-ay', interiorCameraTarget.y - interiorCameraPosition.y);
            setInputValue('cam-az', interiorCameraTarget.z - interiorCameraPosition.z);
        }

        function setupKeyframeEditorControls() {
            return;
            if (keyframeEditorReady) {
                return;
            }

            keyframeEditorReady = true;
            updateKeyframeEditorInputs();

            const bindInput = (inputId, onCommit) => {
                const input = document.getElementById(inputId);
                if (!input) {
                    return;
                }

                input.addEventListener('change', () => {
                    const parsedValue = parseFloat(input.value);
                    if (!Number.isFinite(parsedValue)) {
                        updateKeyframeEditorInputs();
                        return;
                    }

                    activeSectionIndex = getCurrentSectionIndex();
                    onCommit(parseFloat(parsedValue.toFixed(2)), activeSectionIndex);
                    updateKeyframeEditorInputs();
                });
            };

            bindInput('pos-x', (value, sectionIndex) => {
                modelKeyframes[sectionIndex][0] = value;
                if (modelRig) {
                    modelRig.position.x = value;
                }
                refreshModelTimeline();
            });

            bindInput('pos-y', (value, sectionIndex) => {
                modelKeyframes[sectionIndex][1] = value;
                if (modelRig) {
                    modelRig.position.y = value;
                }
                refreshModelTimeline();
            });

            bindInput('pos-z', (value, sectionIndex) => {
                modelKeyframes[sectionIndex][2] = value;
                if (modelRig) {
                    modelRig.position.z = value;
                }
                refreshModelTimeline();
            });

            bindInput('rot-x', (value, sectionIndex) => {
                modelKeyframes[sectionIndex][3] = value;
                if (modelPivot) {
                    modelPivot.rotation.x = value;
                }
                refreshModelTimeline();
            });

            bindInput('rot-y', (value, sectionIndex) => {
                modelKeyframes[sectionIndex][4] = value;
                if (modelPivot) {
                    modelPivot.rotation.y = value;
                }
                refreshModelTimeline();
            });

            bindInput('rot-z', (value, sectionIndex) => {
                modelKeyframes[sectionIndex][5] = value;
                if (modelPivot) {
                    modelPivot.rotation.z = value;
                }
                refreshModelTimeline();
            });

            bindInput('axis-x', (value, sectionIndex) => {
                const pivotFrame = getPivotKeyframe(sectionIndex);
                pivotFrame[0] = value;
                pivotKeyframes[sectionIndex] = pivotFrame;
                if (sectionIndex === activeSectionIndex) {
                    applyPivotOffsetFromKeyframe(sectionIndex);
                }
                refreshModelTimeline();
            });

            bindInput('axis-y', (value, sectionIndex) => {
                const pivotFrame = getPivotKeyframe(sectionIndex);
                pivotFrame[1] = value;
                pivotKeyframes[sectionIndex] = pivotFrame;
                if (sectionIndex === activeSectionIndex) {
                    applyPivotOffsetFromKeyframe(sectionIndex);
                }
                refreshModelTimeline();
            });

            bindInput('axis-z', (value, sectionIndex) => {
                const pivotFrame = getPivotKeyframe(sectionIndex);
                pivotFrame[2] = value;
                pivotKeyframes[sectionIndex] = pivotFrame;
                if (sectionIndex === activeSectionIndex) {
                    applyPivotOffsetFromKeyframe(sectionIndex);
                }
                refreshModelTimeline();
            });

            bindInput('light-x', (value, sectionIndex) => {
                const [currentX, currentY, currentZ] = getLightKeyframe(sectionIndex);
                applyLightToKeyframe(sectionIndex, value, currentY, currentZ);
                if (sectionIndex === activeSectionIndex) {
                    applyLightFromKeyframe(sectionIndex);
                }
            });

            bindInput('light-y', (value, sectionIndex) => {
                const [currentX, currentY, currentZ] = getLightKeyframe(sectionIndex);
                applyLightToKeyframe(sectionIndex, currentX, value, currentZ);
                if (sectionIndex === activeSectionIndex) {
                    applyLightFromKeyframe(sectionIndex);
                }
            });

            bindInput('light-z', (value, sectionIndex) => {
                const [currentX, currentY, currentZ] = getLightKeyframe(sectionIndex);
                applyLightToKeyframe(sectionIndex, currentX, currentY, value);
                if (sectionIndex === activeSectionIndex) {
                    applyLightFromKeyframe(sectionIndex);
                }
            });

            bindInput('cam-x', (value) => {
                interiorCameraPosition.x = value;
                shiftCameraInsideCar(false);
            });

            bindInput('cam-y', (value) => {
                interiorCameraPosition.y = value;
                shiftCameraInsideCar(false);
            });

            bindInput('cam-z', (value) => {
                interiorCameraPosition.z = value;
                shiftCameraInsideCar(false);
            });

            bindInput('cam-tx', (value) => {
                interiorCameraTarget.x = value;
                shiftCameraInsideCar(false);
            });

            bindInput('cam-ty', (value) => {
                interiorCameraTarget.y = value;
                shiftCameraInsideCar(false);
            });

            bindInput('cam-tz', (value) => {
                interiorCameraTarget.z = value;
                shiftCameraInsideCar(false);
            });

            bindInput('cam-ax', (value) => {
                interiorCameraTarget.x = interiorCameraPosition.x + value;
                shiftCameraInsideCar(false);
            });

            bindInput('cam-ay', (value) => {
                interiorCameraTarget.y = interiorCameraPosition.y + value;
                shiftCameraInsideCar(false);
            });

            bindInput('cam-az', (value) => {
                interiorCameraTarget.z = interiorCameraPosition.z + value;
                shiftCameraInsideCar(false);
            });

            setupCamInNudgeControls();
            setupAxisQuickControls();
            setupAxisManualControls();
        }

        function syncPivotOffsetToSection() {
            const sectionIndex = getCurrentSectionIndex();

            if (sectionIndex === activeSectionIndex) {
                return;
            }

            activeSectionIndex = sectionIndex;
            applyLightFromKeyframe(activeSectionIndex);
            if (!smoothPivotEnabled) {
                applyPivotOffsetFromKeyframe(activeSectionIndex);
            }

            updateKeyframeEditorInputs();
        }

        function setupModelDragControls() {
            if (dragControlsReady || !renderer) {
                return;
            }

            dragControlsReady = true;

            const setModifierState = (event, isPressed) => {
                if (event.key === 'Shift') {
                    isShiftPressed = isPressed;
                }
                if (event.key === 'Alt') {
                    isAltPressed = isPressed;
                }
            };

            window.addEventListener('keydown', (event) => setModifierState(event, true));
            window.addEventListener('keyup', (event) => setModifierState(event, false));
            window.addEventListener('blur', () => {
                isShiftPressed = false;
                isAltPressed = false;
            });

            const handlePointerDown = (event) => {
                if (!modelRig || !modelPivot || !camera) {
                    return;
                }

                if (event.button !== 0) {
                    return;
                }

                const activeElement = document.activeElement;
                if (activeElement && activeElement.tagName === 'INPUT' && activeElement.closest && activeElement.closest('#debug-info')) {
                    activeElement.blur();
                }

                const wantsTranslate = event.shiftKey || isShiftPressed;
                const wantsRotate = event.altKey || isAltPressed;

                if (wantsTranslate) {
                    isTranslateDrag = true;
                    isRotateDrag = false;
                } else if (wantsRotate) {
                    isRotateDrag = true;
                    isTranslateDrag = false;
                } else {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();

                activeSectionIndex = getCurrentSectionIndex();
                updateKeyframeEditorInputs();

                if (controls) {
                    controls.enabled = false;
                }
                if (modelScrollTimeline && modelScrollTimeline.scrollTrigger) {
                    modelScrollTimeline.scrollTrigger.disable();
                }

                renderer.domElement.style.cursor = 'move';
                renderer.domElement.setPointerCapture(event.pointerId);

                if (isTranslateDrag) {
                    dragPlane.set(new THREE.Vector3(0, 1, 0), -modelRig.position.y);
                    updateDragPointer(event);
                    dragRaycaster.setFromCamera(dragPointer, camera);
                    lastDragRigPosition.copy(modelRig.position);

                    if (dragRaycaster.ray.intersectPlane(dragPlane, dragIntersection)) {
                        dragOffset.copy(modelRig.position).sub(dragIntersection);
                    }
                }

                if (isRotateDrag) {
                    dragLastX = event.clientX;
                }
            };

            const handlePointerMove = (event) => {
                let dragChanged = false;

                if (isTranslateDrag && modelRig && camera) {
                    updateDragPointer(event);
                    dragRaycaster.setFromCamera(dragPointer, camera);

                    if (dragRaycaster.ray.intersectPlane(dragPlane, dragIntersection)) {
                        modelRig.position.copy(dragIntersection).add(dragOffset);
                        enforceModelAboveGarageGround();
                        dragMovement.subVectors(modelRig.position, lastDragRigPosition);
                        const dragDistance = dragMovement.length();
                        if (dragDistance > 0) {
                            const travelDirection = dragMovement.z === 0 ? Math.sign(dragMovement.x || 1) : Math.sign(dragMovement.z);
                            rotateWheels(-travelDirection * dragDistance * 8);
                        }
                        lastDragRigPosition.copy(modelRig.position);
                        dragChanged = true;
                    }
                }

                if (isRotateDrag && modelPivot) {
                    const deltaX = event.clientX - dragLastX;
                    dragLastX = event.clientX;
                    modelPivot.rotation.y += deltaX * 0.005;
                    dragChanged = true;
                }

                if (dragChanged) {
                    syncActiveDragTransform();
                }
            };

            const handlePointerUp = (event) => {
                if (!isTranslateDrag && !isRotateDrag) {
                    return;
                }

                isTranslateDrag = false;
                isRotateDrag = false;
                renderer.domElement.style.cursor = 'grab';
                renderer.domElement.releasePointerCapture(event.pointerId);

                if (controls) {
                    controls.enabled = true;
                }

                applyRigTransformToKeyframe(getCurrentSectionIndex());
                setupModelScrollAnimations(sections, modelRig, modelPivot);
                ScrollTrigger.refresh();
            };

            renderer.domElement.addEventListener('pointerdown', handlePointerDown, true);
            renderer.domElement.addEventListener('pointermove', handlePointerMove);
            renderer.domElement.addEventListener('pointerup', handlePointerUp);
            renderer.domElement.addEventListener('pointercancel', handlePointerUp);
            renderer.domElement.addEventListener('pointerleave', handlePointerUp);
        }

        function setupModelScrollAnimations(sectionNodes, rig, pivot) {
            if (!rig || !pivot) {
                return;
            }

            if (modelScrollTimeline) {
                if (modelScrollTimeline.scrollTrigger) {
                    modelScrollTimeline.scrollTrigger.kill();
                }
                modelScrollTimeline.kill();
                modelScrollTimeline = null;
            }

            const frameCount = Math.min(modelKeyframes.length, sectionNodes.length);

            if (frameCount === 0) {
                return;
            }

            const [startPosX, startPosY, startPosZ, startRotX, startRotY, startRotZ] = modelKeyframes[0];
            rig.position.set(startPosX, startPosY, startPosZ);
            pivot.rotation.set(startRotX, startRotY, startRotZ);
            const [startPivotX, startPivotY, startPivotZ] = getPivotKeyframe(0);
            pivotOffset.set(startPivotX, startPivotY, startPivotZ);
            applyPivotOffset();
            applyLightFromKeyframe(0);
            updateKeyframeEditorInputs();

            if (frameCount === 1) {
                requestShadowUpdate();
                return;
            }

            const timeline = gsap.timeline({
                defaults: { ease: 'none' },
                onUpdate: requestShadowUpdate,
                scrollTrigger: {
                    trigger: sectionsRoot,
                    start: 'top top',
                    end: 'bottom bottom',
                    scrub: 0.8
                }
            });

            const segmentDurations = [];
            for (let i = 0; i < frameCount - 1; i += 1) {
                const sectionNode = sectionNodes[i];
                const fallbackHeight = window.innerHeight || 1;
                let sectionHeight = sectionNode
                    ? Math.max(1, sectionNode.offsetHeight || sectionNode.clientHeight || fallbackHeight)
                    : fallbackHeight;

                segmentDurations.push(sectionHeight);
            }

            const durationUnit = segmentDurations.length
                ? Math.max(1, Math.min(...segmentDurations))
                : 1;
            let timelineCursor = 0;

            for (let i = 1; i < frameCount; i += 1) {
                const [posX, posY, posZ, rotX, rotY, rotZ] = modelKeyframes[i];
                const [pivotX, pivotY, pivotZ] = getPivotKeyframe(i);
                const segmentIndex = i - 1;
                const segmentDuration = Math.max(0.05, segmentDurations[segmentIndex] / durationUnit);

                timeline.to(rig.position, {
                    x: posX,
                    y: posY,
                    z: posZ,
                    duration: segmentDuration
                }, timelineCursor);

                timeline.to(pivot.rotation, {
                    x: rotX,
                    y: rotY,
                    z: rotZ,
                    duration: segmentDuration
                }, timelineCursor);

                timeline.to(pivotOffset, {
                    x: pivotX,
                    y: pivotY,
                    z: pivotZ,
                    duration: segmentDuration,
                    onUpdate: applyPivotOffset
                }, timelineCursor);

                timelineCursor += segmentDuration;
            }

            modelScrollTimeline = timeline;
        }
