// WebGPU API Demo - Basic Clear (demo.js)

const canvas = document.getElementById('webgpu-canvas');
const statusMessages = document.getElementById('statusMessages');

function logStatus(message, isError = false) {
    console.log(message);
    statusMessages.textContent = message;
    if (isError) {
        statusMessages.style.color = 'red';
    } else {
        statusMessages.style.color = 'black';
    }
}

async function initWebGPU() {
    logStatus('Initializing WebGPU...');

    if (!navigator.gpu) {
        logStatus('WebGPU not supported in this browser. Please use a compatible browser like Chrome or Edge (Canary/Dev versions might be needed).', true);
        throw new Error('WebGPU not supported');
    }

    // 1. Request an Adapter
    // An adapter represents a physical GPU or a software implementation.
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        logStatus('Failed to get GPU adapter. Your browser might support WebGPU, but no compatible GPU was found.', true);
        throw new Error('No GPU adapter found');
    }
    logStatus(`Adapter acquired: ${adapter.name}`);
    adapter.features.forEach(feature => console.log(`Adapter feature: ${feature}`));


    // 2. Request a Device
    // A device is the logical interface to the GPU.
    const device = await adapter.requestDevice();
    if (!device) {
        logStatus('Failed to get GPU device.', true);
        throw new Error('No GPU device found');
    }
    logStatus('Device acquired.');

    // 3. Configure the Canvas Context
    const context = canvas.getContext('webgpu');
    if (!context) {
        logStatus('Failed to get WebGPU context from canvas.', true);
        throw new Error('No WebGPU context');
    }

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    logStatus(`Preferred canvas format: ${presentationFormat}`);

    context.configure({
        device: device,
        format: presentationFormat,
        alphaMode: 'opaque', // or 'premultiplied'
    });
    logStatus('Canvas context configured.');

    return { device, context, presentationFormat };
}

function render(device, context, presentationFormat) {
    // 4. Create a Command Encoder
    // Command encoders record GPU commands.
    const commandEncoder = device.createCommandEncoder();

    // 5. Start a Render Pass
    // A render pass describes how to draw to a set of textures (attachments).
    // Here, we're drawing to the canvas's current texture.
    const textureView = context.getCurrentTexture().createView();

    const renderPassDescriptor = {
        colorAttachments: [{
            view: textureView,
            clearValue: { r: 0.2, g: 0.4, b: 0.8, a: 1.0 }, // Light blue clear color
            loadOp: 'clear', // Clear the texture before drawing
            storeOp: 'store', // Store the results of the drawing
        }],
    };

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    // --- At this point, you would typically set pipelines, bind groups, and issue draw calls ---
    // For this basic demo, we are only clearing the screen, so no draw calls are needed.
    passEncoder.end(); // End the render pass

    // 6. Submit Commands
    // Finalize the command buffer and submit it to the GPU's queue.
    const commandBuffer = commandEncoder.finish();
    device.queue.submit([commandBuffer]);

    logStatus('Render pass submitted. Canvas should be cleared to light blue.');
}

async function main() {
    try {
        const { device, context, presentationFormat } = await initWebGPU();
        render(device, context, presentationFormat);

        // For a dynamic demo, you might call render() in a requestAnimationFrame loop.
        // For this static clear, once is enough.
    } catch (error) {
        console.error(error);
        logStatus(`Error during WebGPU setup or rendering: ${error.message}`, true);
    }
}

main();