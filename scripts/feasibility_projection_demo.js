document.addEventListener("DOMContentLoaded", function () {
    const pairSelect = document.getElementById("fp-pair-select");
    const x0xRange = document.getElementById("fp-x0x-range");
    const x0yRange = document.getElementById("fp-x0y-range");
    const stepsRange = document.getElementById("fp-steps-range");
    const presetA = document.getElementById("fp-preset-a");
    const presetB = document.getElementById("fp-preset-b");
    const presetC = document.getElementById("fp-preset-c");
    const bestCriterionSelect = document.getElementById("fp-best-criterion");

    const paramsDisplay = document.getElementById("fp-params-display");
    const bestDisplay = document.getElementById("fp-best-display");
    const metricsBox = document.getElementById("fpMetrics");
    const canvas = document.getElementById("fpCanvas");
    const runBtn = document.getElementById("runFpBtn");
    const resetBtn = document.getElementById("resetFpBtn");

    if (!pairSelect || !x0xRange || !x0yRange || !stepsRange || !presetA || !presetB || !presetC || !bestCriterionSelect || !paramsDisplay || !bestDisplay || !canvas || !runBtn || !resetBtn) {
        return;
    }

    const ctx = canvas.getContext("2d");

    function getQueryParams() {
        return new URLSearchParams(window.location.search);
    }

    function getCriterionFromQuery() {
        const q = getQueryParams().get("criterion");
        if (q === "pocs" || q === "dykstra" || q === "min") {
            return q;
        }
        return null;
    }

    function setCriterionInQuery(value) {
        const params = getQueryParams();
        if (value === "min") {
            params.delete("criterion");
        } else {
            params.set("criterion", value);
        }
        const query = params.toString();
        const next = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
        window.history.replaceState(null, "", next);
    }
    const presetMap = {
        "halfspace-disk": [
            { label: "Far Left", x0: [-2.4, 2.0], steps: 25 },
            { label: "Below", x0: [-0.8, -2.5], steps: 30 },
            { label: "Near Boundary", x0: [0.1, 2.3], steps: 20 }
        ],
        "box-affine": [
            { label: "Top Left", x0: [-2.6, 2.5], steps: 28 },
            { label: "Bottom Right", x0: [2.8, -2.4], steps: 30 },
            { label: "Center Drift", x0: [1.6, 1.4], steps: 18 }
        ],
        "simplex-disk": [
            { label: "Outside Quadrant", x0: [-2.0, 2.2], steps: 32 },
            { label: "Large Positive", x0: [2.5, 2.3], steps: 35 },
            { label: "Near Simplex", x0: [0.3, 0.2], steps: 16 }
        ]
    };

    function projectHalfspaceXGeZero(v) {
        return [Math.max(0, v[0]), v[1]];
    }

    function projectDisk(v, center, radius) {
        const dx = v[0] - center[0];
        const dy = v[1] - center[1];
        const n = Math.hypot(dx, dy);
        if (n <= radius || n === 0) {
            return [v[0], v[1]];
        }
        const s = radius / n;
        return [center[0] + s * dx, center[1] + s * dy];
    }

    function projectBox(v, low, high) {
        return [
            Math.max(low, Math.min(high, v[0])),
            Math.max(low, Math.min(high, v[1]))
        ];
    }

    function projectAffineLine(v, a, b, c) {
        const dot = a * v[0] + b * v[1] - c;
        const denom = a * a + b * b;
        if (denom === 0) {
            return [v[0], v[1]];
        }
        const t = dot / denom;
        return [v[0] - t * a, v[1] - t * b];
    }

    function projectSimplexSumLeq(v, sumCap) {
        const v0 = Math.max(0, v[0]);
        const v1 = Math.max(0, v[1]);
        if (v0 + v1 <= sumCap) {
            return [v0, v1];
        }

        const u = [v[0], v[1]].sort((a, b) => b - a);
        const theta1 = u[0] - sumCap;
        const w1 = [Math.max(v[0] - theta1, 0), Math.max(v[1] - theta1, 0)];
        if (w1[0] + w1[1] <= sumCap) {
            return w1;
        }

        const theta2 = (u[0] + u[1] - sumCap) / 2;
        return [Math.max(v[0] - theta2, 0), Math.max(v[1] - theta2, 0)];
    }

    function getPairSpec() {
        const key = pairSelect.value;
        if (key === "box-affine") {
            return {
                key,
                label: "A = box [-1.6,1.6]^2, B = affine line x1 + x2 = 0.6",
                projectA: (v) => projectBox(v, -1.6, 1.6),
                projectB: (v) => projectAffineLine(v, 1, 1, 0.6),
                draw: drawBoxAffine
            };
        }

        if (key === "simplex-disk") {
            const center = [0.9, 0.7];
            const radius = 1.0;
            const simplexCap = 1.6;
            return {
                key,
                label: "A = simplex {x>=0, y>=0, x+y<=1.6}, B = disk(center=(0.9,0.7), r=1.0)",
                projectA: (v) => projectSimplexSumLeq(v, simplexCap),
                projectB: (v) => projectDisk(v, center, radius),
                draw: () => drawSimplexDisk(center, radius, simplexCap)
            };
        }

        const center = [1.0, 0.0];
        const radius = 1.4;
        return {
            key: "halfspace-disk",
            label: "A = halfspace x1 >= 0, B = disk(center=(1,0), r=1.4)",
            projectA: projectHalfspaceXGeZero,
            projectB: (v) => projectDisk(v, center, radius),
            draw: () => drawHalfspaceDisk(center, radius)
        };
    }

    function distToIntersectionProxy(v, spec) {
        let z = [v[0], v[1]];
        for (let i = 0; i < 8; i++) {
            z = spec.projectA(z);
            z = spec.projectB(z);
        }
        return Math.hypot(v[0] - z[0], v[1] - z[1]);
    }

    function runPocs(x0, steps, spec) {
        let x = [x0[0], x0[1]];
        const path = [x.slice()];
        const residual = [];

        for (let k = 0; k < steps; k++) {
            x = spec.projectA(x);
            x = spec.projectB(x);
            path.push(x.slice());
            residual.push(distToIntersectionProxy(x, spec));
        }

        return { path, residual, final: x };
    }

    function runDykstra(x0, steps, spec) {
        let x = [x0[0], x0[1]];
        let p = [0, 0];
        let q = [0, 0];
        const path = [x.slice()];
        const residual = [];

        for (let k = 0; k < steps; k++) {
            const yInput = [x[0] + p[0], x[1] + p[1]];
            const y = spec.projectA(yInput);
            p = [yInput[0] - y[0], yInput[1] - y[1]];

            const xInput = [y[0] + q[0], y[1] + q[1]];
            x = spec.projectB(xInput);
            q = [xInput[0] - x[0], xInput[1] - x[1]];

            path.push(x.slice());
            residual.push(distToIntersectionProxy(x, spec));
        }

        return { path, residual, final: x };
    }

    function toCanvas(pt) {
        const xMin = -3;
        const xMax = 3;
        const yMin = -3;
        const yMax = 3;
        const pad = 36;
        const x = pad + ((pt[0] - xMin) / (xMax - xMin)) * (canvas.width - 2 * pad);
        const y = canvas.height - pad - ((pt[1] - yMin) / (yMax - yMin)) * (canvas.height - 2 * pad);
        return [x, y];
    }

    function drawAxes() {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const o = toCanvas([0, 0]);
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(16, o[1]);
        ctx.lineTo(canvas.width - 16, o[1]);
        ctx.moveTo(o[0], 16);
        ctx.lineTo(o[0], canvas.height - 16);
        ctx.stroke();
    }

    function drawHalfspaceDisk(center, radius) {
        drawAxes();

        const leftTop = toCanvas([0, 3]);
        const rightTop = toCanvas([3, 3]);
        const rightBottom = toCanvas([3, -3]);
        const leftBottom = toCanvas([0, -3]);
        ctx.fillStyle = "rgba(37, 99, 235, 0.08)";
        ctx.beginPath();
        ctx.moveTo(leftTop[0], leftTop[1]);
        ctx.lineTo(rightTop[0], rightTop[1]);
        ctx.lineTo(rightBottom[0], rightBottom[1]);
        ctx.lineTo(leftBottom[0], leftBottom[1]);
        ctx.closePath();
        ctx.fill();

        const c = toCanvas(center);
        const edge = toCanvas([center[0] + radius, center[1]]);
        const rCanvas = Math.abs(edge[0] - c[0]);
        ctx.fillStyle = "rgba(22, 163, 74, 0.09)";
        ctx.beginPath();
        ctx.arc(c[0], c[1], rCanvas, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = "#16a34a";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(c[0], c[1], rCanvas, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.strokeStyle = "#2563eb";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(leftTop[0], leftTop[1]);
        ctx.lineTo(leftBottom[0], leftBottom[1]);
        ctx.stroke();

        ctx.fillStyle = "#334155";
        ctx.font = "12px sans-serif";
        ctx.fillText("A: x1 >= 0", leftTop[0] + 8, leftTop[1] + 14);
        ctx.fillText("B: ||x-c|| <= r", c[0] - 42, c[1] - rCanvas - 8);
    }

    function drawBoxAffine() {
        drawAxes();

        const p1 = toCanvas([-1.6, -1.6]);
        const p2 = toCanvas([1.6, 1.6]);
        const w = p2[0] - p1[0];
        const h = p1[1] - p2[1];
        ctx.fillStyle = "rgba(37, 99, 235, 0.08)";
        ctx.fillRect(p1[0], p2[1], w, h);
        ctx.strokeStyle = "#2563eb";
        ctx.lineWidth = 1.8;
        ctx.strokeRect(p1[0], p2[1], w, h);

        const a = toCanvas([-2.4, 3.0]);
        const b = toCanvas([3.0, -2.4]);
        ctx.strokeStyle = "#16a34a";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();

        ctx.fillStyle = "#334155";
        ctx.font = "12px sans-serif";
        ctx.fillText("A: box", p1[0] + 8, p2[1] + 14);
        ctx.fillText("B: x1 + x2 = 0.6", a[0] + 8, a[1] + 14);
    }

    function drawSimplexDisk(center, radius, simplexCap) {
        drawAxes();

        const v1 = toCanvas([0, 0]);
        const v2 = toCanvas([simplexCap, 0]);
        const v3 = toCanvas([0, simplexCap]);
        ctx.fillStyle = "rgba(37, 99, 235, 0.08)";
        ctx.beginPath();
        ctx.moveTo(v1[0], v1[1]);
        ctx.lineTo(v2[0], v2[1]);
        ctx.lineTo(v3[0], v3[1]);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#2563eb";
        ctx.lineWidth = 1.8;
        ctx.stroke();

        const c = toCanvas(center);
        const edge = toCanvas([center[0] + radius, center[1]]);
        const rCanvas = Math.abs(edge[0] - c[0]);
        ctx.fillStyle = "rgba(22, 163, 74, 0.09)";
        ctx.beginPath();
        ctx.arc(c[0], c[1], rCanvas, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = "#16a34a";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(c[0], c[1], rCanvas, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.fillStyle = "#334155";
        ctx.font = "12px sans-serif";
        ctx.fillText("A: simplex", v3[0] + 8, v3[1] + 12);
        ctx.fillText("B: disk", c[0] - 16, c[1] - rCanvas - 8);
    }

    function drawPath(path, color, label) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        path.forEach((pt, i) => {
            const p = toCanvas(pt);
            if (i === 0) {
                ctx.moveTo(p[0], p[1]);
            } else {
                ctx.lineTo(p[0], p[1]);
            }
        });
        ctx.stroke();

        path.forEach((pt, i) => {
            const p = toCanvas(pt);
            ctx.fillStyle = i === 0 ? "#7c3aed" : color;
            ctx.beginPath();
            ctx.arc(p[0], p[1], 3.1, 0, 2 * Math.PI);
            ctx.fill();
        });

        const end = toCanvas(path[path.length - 1]);
        ctx.fillStyle = "#334155";
        ctx.font = "12px sans-serif";
        ctx.fillText(label, end[0] + 6, end[1] - 6);
    }

    function run() {
        const x0 = [parseFloat(x0xRange.value), parseFloat(x0yRange.value)];
        const steps = parseInt(stepsRange.value, 10);
        const spec = getPairSpec();

        const pocs = runPocs(x0, steps, spec);
        const dyk = runDykstra(x0, steps, spec);

        spec.draw();
        drawPath(pocs.path, "#dc2626", "POCS end");
        drawPath(dyk.path, "#2563eb", "Dykstra end");

        const pocsEndRes = pocs.residual[pocs.residual.length - 1] || 0;
        const dykEndRes = dyk.residual[dyk.residual.length - 1] || 0;

        let text = "Feasibility Projection Diagnostics\n";
        text += "--------------------------------\n";
        text += `x0 = (${x0[0].toFixed(2)}, ${x0[1].toFixed(2)}), iterations = ${steps}\n`;
        text += `sets: ${spec.label}\n\n`;
        text += `POCS end point: (${pocs.final[0].toFixed(5)}, ${pocs.final[1].toFixed(5)})\n`;
        text += `POCS residual to intersection proxy: ${pocsEndRes.toExponential(4)}\n`;
        text += `Dykstra end point: (${dyk.final[0].toFixed(5)}, ${dyk.final[1].toFixed(5)})\n`;
        text += `Dykstra residual to intersection proxy: ${dykEndRes.toExponential(4)}\n`;
        text += `residual ratio (POCS/Dykstra): ${(pocsEndRes / Math.max(dykEndRes, 1e-12)).toExponential(3)}\n`;

        metricsBox.textContent = text;
    }

    function resetPresetButtonStyle(button, label) {
        button.textContent = label;
        button.style.background = "#f8fafc";
        button.style.borderColor = "#94a3b8";
        button.style.color = "#0f172a";
        button.style.fontWeight = "500";
    }

    function evaluatePresetResidual(preset, spec, criterion) {
        const pocs = runPocs(preset.x0, preset.steps, spec);
        const dyk = runDykstra(preset.x0, preset.steps, spec);
        const pocsEndRes = pocs.residual[pocs.residual.length - 1] || 0;
        const dykEndRes = dyk.residual[dyk.residual.length - 1] || 0;

        if (criterion === "pocs") {
            return { score: pocsEndRes, label: "POCS" };
        }
        if (criterion === "dykstra") {
            return { score: dykEndRes, label: "Dykstra" };
        }
        return { score: Math.min(pocsEndRes, dykEndRes), label: "min(POCS, Dykstra)" };
    }

    function updatePresetButtons() {
        const presets = presetMap[pairSelect.value] || [];
        const buttons = [presetA, presetB, presetC];
        const spec = getPairSpec();
        const criterion = bestCriterionSelect.value;
        let bestIdx = -1;
        let bestScore = Number.POSITIVE_INFINITY;
        let bestLabel = "min(POCS, Dykstra)";

        for (let i = 0; i < buttons.length; i++) {
            const p = presets[i];
            const fallback = `Preset ${String.fromCharCode(65 + i)}`;
            const label = p ? p.label : fallback;
            resetPresetButtonStyle(buttons[i], label);
            if (p) {
                const evalResult = evaluatePresetResidual(p, spec, criterion);
                if (evalResult.score < bestScore) {
                    bestScore = evalResult.score;
                    bestIdx = i;
                    bestLabel = evalResult.label;
                }
            }
        }

        if (bestIdx >= 0) {
            const winner = buttons[bestIdx];
            winner.style.background = "#dcfce7";
            winner.style.borderColor = "#16a34a";
            winner.style.color = "#065f46";
            winner.style.fontWeight = "700";
            bestDisplay.textContent = `Best preset for this pair: ${winner.textContent} (${bestLabel}, score=${bestScore.toExponential(3)}).`;
        } else {
            bestDisplay.textContent = "";
        }
    }

    function applyPreset(index) {
        const presets = presetMap[pairSelect.value] || [];
        const p = presets[index];
        if (!p) {
            return;
        }
        x0xRange.value = String(p.x0[0]);
        x0yRange.value = String(p.x0[1]);
        stepsRange.value = String(p.steps);
        run();
        updateLabel();
    }

    function updateLabel() {
        const spec = getPairSpec();
        paramsDisplay.textContent = `pair = ${spec.key}, x0 = (${parseFloat(x0xRange.value).toFixed(1)}, ${parseFloat(x0yRange.value).toFixed(1)}), iterations = ${stepsRange.value}`;
    }

    function reset() {
        updatePresetButtons();
        updateLabel();
        const spec = getPairSpec();
        spec.draw();
        metricsBox.textContent = "Run the demo to populate diagnostics.";
    }

    pairSelect.addEventListener("change", reset);
    bestCriterionSelect.addEventListener("change", function () {
        setCriterionInQuery(bestCriterionSelect.value);
        updatePresetButtons();
    });
    x0xRange.addEventListener("input", updateLabel);
    x0yRange.addEventListener("input", updateLabel);
    stepsRange.addEventListener("input", updateLabel);
    presetA.addEventListener("click", function () { applyPreset(0); });
    presetB.addEventListener("click", function () { applyPreset(1); });
    presetC.addEventListener("click", function () { applyPreset(2); });
    runBtn.addEventListener("click", run);
    resetBtn.addEventListener("click", reset);

    const criterionFromQuery = getCriterionFromQuery();
    if (criterionFromQuery) {
        bestCriterionSelect.value = criterionFromQuery;
    }

    reset();
});
