document.addEventListener("DOMContentLoaded", function () {
    const stepsRange = document.getElementById("diag-steps-range");
    const decayRange = document.getElementById("diag-decay-range");
    const noiseRange = document.getElementById("diag-noise-range");
    const threshRange = document.getElementById("diag-thresh-range");

    const paramsDisplay = document.getElementById("diag-params-display");
    const metricsBox = document.getElementById("diagMetricsBox");
    const canvas = document.getElementById("diagCanvas");
    const runBtn = document.getElementById("runDiagBtn");
    const resetBtn = document.getElementById("resetDiagBtn");

    if (!stepsRange || !decayRange || !noiseRange || !threshRange || !canvas || !runBtn || !resetBtn) {
        return;
    }

    const ctx = canvas.getContext("2d");

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

    function clampPositive(v) {
        return v < 1e-8 ? 1e-8 : v;
    }

    function simulate(steps, decay, noiseLevel) {
        const rand = createRng(4096);
        const obj = [];
        const feas = [];
        const grad = [];
        const gap = [];

        let o = 8.0;
        let f = 1.2;
        let g = 2.0;
        let p = 1.5;

        for (let k = 0; k < steps; k++) {
            const nz = noiseLevel * gaussian(rand);
            o = clampPositive(o * decay + 0.25 * nz);
            f = clampPositive(f * (decay + 0.01) + 0.12 * nz);
            g = clampPositive(g * (decay + 0.005) + 0.15 * nz);
            p = clampPositive(p * (decay + 0.008) + 0.10 * nz);

            obj.push(o);
            feas.push(f);
            grad.push(g);
            gap.push(p);
        }

        return { obj: obj, feas: feas, grad: grad, gap: gap };
    }

    function drawCurves(data) {
        const width = canvas.width;
        const height = canvas.height;
        const pad = 45;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        const all = data.obj.concat(data.feas, data.grad, data.gap);
        const minY = Math.min.apply(null, all);
        const maxY = Math.max.apply(null, all);
        const rangeY = Math.max(maxY - minY, 1e-9);
        const n = data.obj.length;

        function toCanvas(i, y) {
            const x = pad + (n <= 1 ? 0 : (i / (n - 1)) * (width - 2 * pad));
            const yy = height - pad - ((y - minY) / rangeY) * (height - 2 * pad);
            return [x, yy];
        }

        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pad, height - pad);
        ctx.lineTo(width - pad, height - pad);
        ctx.moveTo(pad, height - pad);
        ctx.lineTo(pad, pad);
        ctx.stroke();

        const specs = [
            { key: "obj", color: "#2563eb", name: "objective" },
            { key: "feas", color: "#16a34a", name: "feasibility" },
            { key: "grad", color: "#ef4444", name: "grad-norm" },
            { key: "gap", color: "#7c3aed", name: "gap" }
        ];

        specs.forEach(function (s) {
            const arr = data[s.key];
            ctx.strokeStyle = s.color;
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
        ctx.translate(14, height / 2 + 25);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText("metric value", 0, 0);
        ctx.restore();

        let y = 22;
        specs.forEach(function (s) {
            ctx.fillStyle = s.color;
            ctx.fillRect(width - 145, y - 8, 14, 8);
            ctx.fillStyle = "#334155";
            ctx.fillText(s.name, width - 125, y);
            y += 16;
        });
    }

    function updateParams() {
        paramsDisplay.textContent = `iterations = ${stepsRange.value}, decay = ${parseFloat(decayRange.value).toFixed(3)}, noise = ${parseFloat(noiseRange.value).toFixed(3)}, threshold = ${parseFloat(threshRange.value).toFixed(3)}`;
    }

    function runSimulation() {
        const steps = parseInt(stepsRange.value, 10);
        const decay = parseFloat(decayRange.value);
        const noise = parseFloat(noiseRange.value);
        const threshold = parseFloat(threshRange.value);

        const data = simulate(steps, decay, noise);
        drawCurves(data);

        const last = steps - 1;
        const o = data.obj[last];
        const f = data.feas[last];
        const g = data.grad[last];
        const p = data.gap[last];

        const stop = o <= threshold && f <= threshold && g <= threshold && p <= threshold;

        let txt = "Final metrics\n";
        txt += "-------------\n";
        txt += `objective   : ${o.toFixed(6)}\n`;
        txt += `feasibility : ${f.toFixed(6)}\n`;
        txt += `grad-norm   : ${g.toFixed(6)}\n`;
        txt += `gap         : ${p.toFixed(6)}\n\n`;
        txt += stop
            ? "Status: all diagnostics are below threshold."
            : "Status: at least one diagnostic is still above threshold.";

        metricsBox.textContent = txt;
    }

    function resetView() {
        updateParams();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        metricsBox.textContent = "Run the simulation to populate diagnostics.";
    }

    stepsRange.addEventListener("input", updateParams);
    decayRange.addEventListener("input", updateParams);
    noiseRange.addEventListener("input", updateParams);
    threshRange.addEventListener("input", updateParams);

    runBtn.addEventListener("click", runSimulation);
    resetBtn.addEventListener("click", resetView);

    resetView();
});
