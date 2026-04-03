// App.js - Additional functionality for Porsche 3D Showcase

// Function to update debug info
function updateDebugInfo(position, rotation) {
    document.getElementById('position').textContent =
        `${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}`;
    document.getElementById('rotation').textContent =
        `${rotation.x.toFixed(2)}, ${rotation.y.toFixed(2)}, ${rotation.z.toFixed(2)}`;
}

// Function to create custom scroll animations for the model
function createScrollAnimations(sections, model) {
    sections.forEach((section, index) => {
        // Animate section opacity and scale on scroll
        gsap.from(section, {
            scrollTrigger: {
                trigger: section,
                start: 'top center',
                end: 'bottom center',
                scrub: true,
                markers: false
            },
            opacity: 0.3,
            scale: 0.9,
            ease: 'power2.out'
        });

        // Animate model to specific position and rotation for each section
        if (model) {
            const posData = section.getAttribute('data-pos').split(', ');
            const rotData = section.getAttribute('data-rot').split(', ');

            const targetPos = {
                x: parseFloat(posData[0]),
                y: parseFloat(posData[1]),
                z: parseFloat(posData[2])
            };

            const targetRot = {
                x: parseFloat(rotData[0]),
                y: parseFloat(rotData[1]),
                z: parseFloat(rotData[2])
            };

            gsap.to(model.position, {
                x: targetPos.x,
                y: targetPos.y,
                z: targetPos.z,
                scrollTrigger: {
                    trigger: section,
                    start: 'top center',
                    end: 'bottom center',
                    scrub: true
                }
            });

            gsap.to(model.rotation, {
                x: targetRot.x,
                y: targetRot.y,
                z: targetRot.z,
                scrollTrigger: {
                    trigger: section,
                    start: 'top center',
                    end: 'bottom center',
                    scrub: true
                }
            });
        }
    });
}

// Export functions for use in index.html if needed
window.updateDebugInfo = updateDebugInfo;
window.createScrollAnimations = createScrollAnimations;