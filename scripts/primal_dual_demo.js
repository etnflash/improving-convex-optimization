document.addEventListener("DOMContentLoaded", function () {
    const tauRange = document.getElementById("pdhg-tau-range");
    const sigmaRange = document.getElementById("pdhg-sigma-range");
    const knormRange = document.getElementById("pdhg-knorm-range");
    const stepsRange = document.getElementById("pdhg-steps-range");

    const paramsDisplay = document.getElementById("pdhg-params-display");
    const metricsBox = document.getElementById("pdhgMetrics");
    const canvas = document.getElementById("pdhgCanvas");
    const runBtn = document.getElementById("runPdhgBtn");
    const resetBtn = document.getElementById("resetPdhgBtn");

    if (!tauRange || !sigmaRange || !knormRange || !stepsRange || !canvas || !runBtn || !resetBtn) {
        return;
    }

    const ctx = canvas.getContext("2d");

    function simulate(tau, sigma, knorm, steps) {
        const stability = tau * sigma * knorm * knorm;
        const primal = [];
        const dual = [];
        const gap = [];

        let p = 1.0;
        let d = 0.9;
        let g = 1.2;

        for (let k = 0; k <= steps; k++) {
            primal.push({ x: k, y: Math.max(p, 1e-12) });
            dual.push({ x: k, y: Math.max(d, 1e-12) });
            gap.push({ x: k, y: Math.max(g, 1e-12) });

            const base = Math.max(0.02, 0.72 - 0.35 * stability);
            const osc = Math.max(0, stability - 1) * 0.09 * Math.sin(0.22 * k);

            p = p * (1 - base + osc) + 0.005 * (1 + stability);
            d = d * (1 - 0.85 * base - osc) + 0.004 * (1 + 0.7 * stability);
            g = g * (1 - 0.65 * base + 0.5 * osc) + 0.007 * (1 + 0.8 * stability);

            if (stability > 1.15) {
                p += 0.02 * (stability - 1.15);
                d += 0.016 * (stability - 1.15);
                g += 0.03 * (stability - 1.15);
            }
        }

        return { primal, dual, gap, stability };
    }

    function drawSeries(seriesA, seriesB, seriesC) {
        const w = canvas.width;
        const h = canvas.height;
        const pad = 36;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad, h - pad);
        ctx.lineTo(w - pad, h - pad);
        ctx.moveTo(pad, h - pad);
        ctx.lineTo(pad, pad);
        ctx.stroke();

        const maxX = seriesA[seriesA.length - 1].x;
        const vals = seriesA.concat(seriesB, seriesC).map((p) => Math.log10(Math.max(p.y, 1e-12)));
        const yMin = Math.min(...vals);
        const yMax = Math.max(...vals, -0.000001);

        function tx(x) {
            return pad + (x / Math.max(1, maxX)) * (w - 2 * pad);
        }

        function ty(yLog) {
            return h - pad - ((yLog - yMin) / Math.max(1e-9, yMax - yMin)) * (h - 2 * pad);
        }

        function draw(series, color) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            series.forEach((p, i) => {
                const x = tx(p.x);
                const y = ty(Math.log10(Math.max(p.y, 1e-12)));
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();
        }

        draw(seriesA, "#2563eb");
        draw(seriesB, "#16a34a");
        draw(seriesC, "#dc2626");

        ctx.fillStyle = "#2563eb";
        ctx.fillRect(w - 168, pad + 8, 12, 3);
        ctx.fillStyle = "#334155";
        ctx.font = "12px sans-serif";
        ctx.fillText("primal residual", w - 150, pad + 12);

        ctx.fillStyle = "#16a34a";
        ctx.fillRect(w - 168, pad + 28, 12, 3);
        ctx.fillStyle = "#334155";
        ctx.fillText("dual residual", w - 150, pad + 32);

        ctx.fillStyle = "#dc2626";
        ctx.fillRect(w - 168, pad + 48, 12, 3);
        ctx.fillStyle = "#334155";
        ctx.fillText("gap proxy", w - 150, pad + 52);

        ctx.fillStyle = "#334155";
        ctx.fillText("log10(metric)", pad + 4, pad - 8);
        ctx.fillText("iterations", w - pad - 56, h - pad + 20);
    }

    function run() {
        const tau = parseFloat(tauRange.value);
        const sigma = parseFloat(sigmaRange.value);
        const knorm = parseFloat(knormRange.value);
        const steps = parseInt(stepsRange.value, 10);

        const out = simulate(tau, sigma, knorm, steps);
        drawSeries(out.primal, out.dual, out.gap);

        const pEnd = out.primal[out.primal.length - 1].y;
        const dEnd = out.dual[out.dual.length - 1].y;
        const gEnd = out.gap[out.gap.length - 1].y;

        let text = "PDHG Residual Diagnostics\n";
        text += "------------------------\n";
        text += `tau = ${tau.toFixed(3)}, sigma = ${sigma.toFixed(3)}, ||K|| = ${knorm.toFixed(2)}\n`;
        text += `stability index tau*sigma*||K||^2 = ${out.stability.toFixed(4)}\n`;
        text += `iterations = ${steps}\n\n`;
        text += `final primal residual: ${pEnd.toExponential(4)}\n`;
        text += `final dual residual: ${dEnd.toExponential(4)}\n`;
        text += `final gap proxy: ${gEnd.toExponential(4)}\n`;
        text += `stability verdict: ${out.stability < 1 ? "stable regime (expected)" : "aggressive regime (watch divergence)"}\n`;

        metricsBox.textContent = text;
    }

    function updateLabel() {
        const tau = parseFloat(tauRange.value);
        const sigma = parseFloat(sigmaRange.value);
        const knorm = parseFloat(knormRange.value);
        const steps = parseInt(stepsRange.value, 10);
        const idx = tau * sigma * knorm * knorm;
        paramsDisplay.textContent = `tau=${tau.toFixed(2)}, sigma=${sigma.toFixed(2)}, ||K||=${knorm.toFixed(1)}, iterations=${steps}, stability=${idx.toFixed(3)}`;
    }

    function reset() {
        updateLabel();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        metricsBox.textContent = "Run the demo to populate metrics.";
    }

    tauRange.addEventListener("input", updateLabel);
    sigmaRange.addEventListener("input", updateLabel);
    knormRange.addEventListener("input", updateLabel);
    stepsRange.addEventListener("input", updateLabel);

    runBtn.addEventListener("click", run);
    resetBtn.addEventListener("click", reset);

    reset();
});
