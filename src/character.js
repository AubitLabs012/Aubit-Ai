(function () {
  function showFallback(container, message) {
    const fallback = document.createElement("div");
    fallback.className = "aubit-avatar-fallback";
    fallback.textContent = message;
    container.replaceChildren(fallback);
  }

  function fitModelToView(root, camera) {
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const maxAxis = Math.max(size.x, size.y, size.z) || 1;
    const scale = 2.5 / maxAxis;

    root.scale.setScalar(scale);

    const scaledBox = new THREE.Box3().setFromObject(root);
    const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
    const scaledSize = scaledBox.getSize(new THREE.Vector3());

    root.position.x -= scaledCenter.x;
    root.position.y -= scaledCenter.y;
    root.position.z -= scaledCenter.z;
    root.position.y -= scaledSize.y * 0.5;

    const distance = Math.max(scaledSize.y * 1.35, scaledSize.x * 1.7, 3.2);
    camera.position.set(0, scaledSize.y * 0.18, distance);
    camera.lookAt(0, scaledSize.y * 0.12, 0);
  }

  function pickDefaultClip(clips) {
    if (!clips || !clips.length) {
      return null;
    }

    return clips.find((clip) => /idle/i.test(clip.name)) || clips[0];
  }

  window.initializeCharacter3D = function initializeCharacter3D(options) {
    const config = options || {};
    const container = config.container;
    const modelUrl = config.modelUrl || "./models/my-character.glb";

    if (!container || !window.THREE || !THREE.GLTFLoader) {
      return {
        playAnimation: function () {},
        dispose: function () {},
      };
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    if (renderer.outputColorSpace !== undefined) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    container.replaceChildren(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xe7fbff, 0x1c2733, 2.4));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(2.8, 3.6, 4.2);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x8bdcff, 1.35);
    fillLight.position.set(-3.2, 2.2, 2.4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffd3a0, 0.95);
    rimLight.position.set(0.6, 2.4, -3.2);
    scene.add(rimLight);

    const clock = new THREE.Clock();
    const loader = new THREE.GLTFLoader();
    let mixer = null;
    let activeAction = null;
    let frameId = 0;
    let disposed = false;
    let currentModel = null;
    let availableClips = [];

    function resize() {
      if (disposed) {
        return;
      }

      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    function renderLoop() {
      if (disposed) {
        return;
      }

      const delta = clock.getDelta();
      if (mixer) {
        mixer.update(delta);
      }
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(renderLoop);
    }

    function playAnimation(name) {
      if (!mixer || !availableClips.length) {
        return false;
      }

      const lowerName = String(name || "").toLowerCase();
      const clip =
        availableClips.find((item) => item.name === name) ||
        availableClips.find((item) => item.name.toLowerCase() === lowerName) ||
        pickDefaultClip(availableClips);

      if (!clip) {
        return false;
      }

      const nextAction = mixer.clipAction(clip);
      nextAction.reset().fadeIn(0.28).play();
      if (activeAction && activeAction !== nextAction) {
        activeAction.fadeOut(0.28);
      }
      activeAction = nextAction;
      return true;
    }

    loader.load(
      modelUrl,
      function (gltf) {
        if (disposed) {
          return;
        }

        currentModel = gltf.scene;
        scene.add(currentModel);
        fitModelToView(currentModel, camera);

        availableClips = gltf.animations || [];
        if (availableClips.length) {
          mixer = new THREE.AnimationMixer(currentModel);
          const defaultClip = pickDefaultClip(availableClips);
          if (defaultClip) {
            playAnimation(defaultClip.name);
          }
        }

        resize();
        renderLoop();
      },
      undefined,
      function () {
        showFallback(container, "3D character could not be loaded.");
      },
    );

    resize();
    window.addEventListener("resize", resize);

    return {
      playAnimation: playAnimation,
      dispose: function () {
        disposed = true;
        window.removeEventListener("resize", resize);
        window.cancelAnimationFrame(frameId);
        if (mixer) {
          mixer.stopAllAction();
        }

        if (currentModel) {
          currentModel.traverse(function (child) {
            if (child.isMesh) {
              if (child.geometry) {
                child.geometry.dispose();
              }
              const materials = Array.isArray(child.material) ? child.material : [child.material];
              materials.forEach(function (material) {
                if (material && material.dispose) {
                  material.dispose();
                }
              });
            }
          });
        }

        renderer.dispose();
      },
    };
  };
})();
