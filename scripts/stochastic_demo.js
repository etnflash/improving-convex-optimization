document.addEventListener("DOMContentLoaded", function () {
    const alphaRange = document.getElementById("sgd-alpha-range");
    const stepsRange = document.getElementById("sgd-steps-range");
    const noiseRange = document.getElementById("sgd-noise-range");

    const paramsDisplay = document.getElementById("sgd-params-display");
    const metricsBox = document.getElementById("sgdMetricsBox");
    const canvas = document.getElementById("sgdCanvas");
    const runBtn = document.getElementById("runSgdBtn");
    const resetBtn = document.getElementById("resetSgdBtn");

    if (!alphaRange || !stepsRange || !noiseRange || !canvas || !runBtn || !resetBtn) {
        return;
    }

    const ctx = canvas.getContext("2d");

    function objective(x) {
        const d = x - 2.0;
        return 0.5 * d * d;
    }

    function createRng(seed) {
        let s = seed >>> 0;
        return function () {
            s = (1664525 * s + 1013904223) >>> 0;
            return s / 4294967296;
        };
    }

    function gaussian(rand) {
        const u1 = Math.max(rand(), 1e-12);
        const u2 = rand();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }

    function runTrajectory(batchSize, alpha, steps, noiseScale, seed) {
        const rand = createRng(seed);
        let x = -3.0;
        const values = [];

        for (let k = 0; k < steps; k++) {
            let noiseSum = 0;
            for (let i = 0; i < batchSize; i++) {
                noiseSum += gaussian(rand);
            }
            const noise = (noiseScale / Math.sqrt(batchSize)) * (noiseSum / batchSize);
            const g = (x - 2.0) + noise;
            x = x - alpha * g;
            values.push(objective(x));
        }

        return { values, finalX: x, finalF: objective(x) };
    }

    function drawCurves(seriesMap) {
        const width = canvas.width;
        const height = canvas.height;
        const pad = 45;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        const labels = Object.keys(seriesMap);
        const maxLen = Math.max.apply(null, labels.map((k) => seriesMap[k].values.length));
        const allVals = labels.flatMap((k) => seriesMap[k].values);
        const minVal = Math.min.apply(null, allVals);
        const maxVal = Math.max.apply(null, allVals);
        const range = Math.max(maxVal - minVal, 1e-9);

        function toCanvas(i, v) {
            const x = pad + (maxLen <= 1 ? 0 : (i / (maxLen - 1)) * (width - 2 * pad));
            const y = height - pad - ((v - minVal) / range) * (height - 2 * pad);
            return [x, y];
        }

        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pad, height - pad);
        ctx.lineTo(width - pad, height - pad);
        ctx.moveTo(pad, height - pad);
        ctx.lineTo(pad, pad);
        ctx.stroke();

        const colors = {
            "batch=1": "#ef4444",
            "batch=8": "#2563eb",
            "batch=32": "#16a34a"
        };

        labels.forEach((label) => {
            const arr = seriesMap[label].values;
            ctx.strokeStyle = colors[label] || "#111827";
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < arr.length; i++) {
                const p = toCanvas(i, arr[i]);
                if (i === 0) {
                    ctx.moveTo(p[0], p[1]);
                } else {
                    ctx.lineTo(p[0], p[1]);
                }
            }
            ctx.stroke();
        });

        ctx.fillStyle = "#334155";
        ctx.font = "12px sans-serif";
        ctx.fillText("iteration", width / 2 - 22, height - 10);
        ctx.save();
        ctx.translate(14, height / 2 + 28);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText("objective value", 0, 0);
        ctx.restore();

        let ly = 24;
        ["batch=1", "batch=8", "batch=32"].forEach((label) => {
            ctx.fillStyle = colors[label];
            ctx.fillRect(width - 130, ly - 8, 14, 8);
            ctx.fillStyle = "#334155";
            ctx.fillText(label, width - 110, ly);
            ly += 16;
        });
    }

    function updateParams() {
        paramsDisplay.textContent = `eta = ${parseFloat(alphaRange.value).toFixed(2)}, iterations = ${stepsRange.value}, noise scale = ${parseFloat(noiseRange.value).toFixed(2)}`;
    }

    function runDemo() {
        const alpha = parseFloat(alphaRange.value);
        const steps = parseInt(stepsRange.value, 10);
        const noiseScale = parseFloat(noiseRange.value);

        const s1 = runTrajectory(1, alpha, steps, noiseScale, 101);
        const s8 = runTrajectory(8, alpha, steps, noiseScale, 202);
        const s32 = runTrajectory(32, alpha, steps, noiseScale, 303);

        const seriesMap = {
            "batch=1": s1,
            "batch=8": s8,
            "batch=32": s32
        };

        drawCurves(seriesMap);

        let log = "Batch | final x   | final F(x)\n";
        log += "------+-----------+-----------\n";
        log += `1     | ${s1.finalX.toFixed(5).padEnd(9)} | ${s1.finalF.toFixed(7)}\n`;
        log += `8     | ${s8.finalX.toFixed(5).padEnd(9)} | ${s8.finalF.toFixed(7)}\n`;
        log += `32    | ${s32.finalX.toFixed(5).padEnd(9)} | ${s32.finalF.toFixed(7)}\n`;
        metricsBox.textContent = log;
    }

    function resetDemo() {
        updateParams();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        metricsBox.textContent = "Run the demo to populate metrics.";
    }

    alphaRange.addEventListener("input", updateParams);
    stepsRange.addEventListener("input", updateParams);
    noiseRange.addEventListener("input", updateParams);

    runBtn.addEventListener("click", runDemo);
    resetBtn.addEventListener("click", resetDemo);

    resetDemo();
});
