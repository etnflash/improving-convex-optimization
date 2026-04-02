document.addEventListener("DOMContentLoaded", function () {
    const stepsRange = document.getElementById("cd-steps-range");
    const x0xRange = document.getElementById("cd-x0x-range");
    const x0yRange = document.getElementById("cd-x0y-range");

    const paramsDisplay = document.getElementById("cd-params-display");
    const metricsBox = document.getElementById("cdMetricsBox");
    const canvas = document.getElementById("cdCanvas");
    const runBtn = document.getElementById("runCdBtn");
    const resetBtn = document.getElementById("resetCdBtn");

    if (!stepsRange || !x0xRange || !x0yRange || !canvas || !runBtn || !resetBtn) {
        return;
    }

    const ctx = canvas.getContext("2d");

    const Q = [
        [4.0, 1.2],
        [1.2, 2.0]
    ];
    const b = [1.0, -1.5];

    function objective(x) {
        const qx0 = Q[0][0] * x[0] + Q[0][1] * x[1];
        const qx1 = Q[1][0] * x[0] + Q[1][1] * x[1];
        return 0.5 * (x[0] * qx0 + x[1] * qx1) - (b[0] * x[0] + b[1] * x[1]);
    }

    function createRng(seed) {
        let s = seed >>> 0;
        return function () {
            s = (1664525 * s + 1013904223) >>> 0;
            return s / 4294967296;
        };
    }

    function coordinateUpdate(x, j) {
        const other = j === 0 ? 1 : 0;
        const newX = x.slice();
        newX[j] = (b[j] - Q[j][other] * newX[other]) / Q[j][j];
        return newX;
    }

    function runCyclic(x0, steps) {
        let x = x0.slice();
        const vals = [objective(x)];
        for (let k = 0; k < steps; k++) {
            const j = k % 2;
            x = coordinateUpdate(x, j);
            vals.push(objective(x));
        }
        return { x, vals };
    }

    function runRandom(x0, steps, seed) {
        const rand = createRng(seed);
        let x = x0.slice();
        const vals = [objective(x)];
        for (let k = 0; k < steps; k++) {
            const j = rand() < 0.5 ? 0 : 1;
            x = coordinateUpdate(x, j);
            vals.push(objective(x));
        }
        return { x, vals };
    }

    function drawCurves(cyclicVals, randomVals) {
        const width = canvas.width;
        const height = canvas.height;
        const pad = 45;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        const maxLen = Math.max(cyclicVals.length, randomVals.length);
        const allVals = cyclicVals.concat(randomVals);
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

        ctx.strokeStyle = "#2563eb";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < cyclicVals.length; i++) {
            const p = toCanvas(i, cyclicVals[i]);
            if (i === 0) {
                ctx.moveTo(p[0], p[1]);
            } else {
                ctx.lineTo(p[0], p[1]);
            }
        }
        ctx.stroke();

        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < randomVals.length; i++) {
            const p = toCanvas(i, randomVals[i]);
            if (i === 0) {
                ctx.moveTo(p[0], p[1]);
            } else {
                ctx.lineTo(p[0], p[1]);
            }
        }
        ctx.stroke();

        ctx.fillStyle = "#334155";
        ctx.font = "12px sans-serif";
        ctx.fillText("iteration", width / 2 - 24, height - 10);
        ctx.save();
        ctx.translate(14, height / 2 + 26);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText("objective value", 0, 0);
        ctx.restore();

        ctx.fillStyle = "#2563eb";
        ctx.fillRect(width - 145, 20, 14, 8);
        ctx.fillStyle = "#334155";
        ctx.fillText("cyclic", width - 125, 28);

        ctx.fillStyle = "#ef4444";
        ctx.fillRect(width - 145, 38, 14, 8);
        ctx.fillStyle = "#334155";
        ctx.fillText("random", width - 125, 46);
    }

    function updateParams() {
        paramsDisplay.textContent = `iterations = ${stepsRange.value}, x0 = (${parseFloat(x0xRange.value).toFixed(1)}, ${parseFloat(x0yRange.value).toFixed(1)})`;
    }

    function runDemo() {
        const steps = parseInt(stepsRange.value, 10);
        const x0 = [parseFloat(x0xRange.value), parseFloat(x0yRange.value)];

        const cyclic = runCyclic(x0, steps);
        const random = runRandom(x0, steps, 123456);

        drawCurves(cyclic.vals, random.vals);

        let log = "Rule   | final x1   final x2   | final F\n";
        log += "-------+-----------------------+----------\n";
        log += `cyclic | ${cyclic.x[0].toFixed(5).padEnd(9)} ${cyclic.x[1].toFixed(5).padEnd(9)} | ${cyclic.vals[cyclic.vals.length - 1].toFixed(7)}\n`;
        log += `random | ${random.x[0].toFixed(5).padEnd(9)} ${random.x[1].toFixed(5).padEnd(9)} | ${random.vals[random.vals.length - 1].toFixed(7)}\n`;
        metricsBox.textContent = log;
    }

    function resetDemo() {
        updateParams();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        metricsBox.textContent = "Run the demo to populate metrics.";
    }

    stepsRange.addEventListener("input", updateParams);
    x0xRange.addEventListener("input", updateParams);
    x0yRange.addEventListener("input", updateParams);

    runBtn.addEventListener("click", runDemo);
    resetBtn.addEventListener("click", resetDemo);

    resetDemo();
});
