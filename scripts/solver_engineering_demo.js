document.addEventListener("DOMContentLoaded", function () {
    const scalingRange = document.getElementById("se-scaling-range");
    const warmstartRange = document.getElementById("se-warmstart-range");
    const toleranceRange = document.getElementById("se-tolerance-range");

    const paramsDisplay = document.getElementById("se-params-display");
    const metricsBox = document.getElementById("solverEngineeringMetrics");
    const canvas = document.getElementById("solverEngineeringCanvas");

    if (!scalingRange || !warmstartRange || !toleranceRange || !canvas) {
        return;
    }

    const ctx = canvas.getContext("2d");

    function computeKpis(scaling, warmstart, tol) {
        const scalingFactor = (11 - scaling) / 10;
        const warmFactor = (11 - warmstart) / 10;
        const tolFactor = tol / 10;

        const iterations = Math.round(40 + 120 * tolFactor * (0.35 + 0.65 * scalingFactor) * (0.45 + 0.55 * warmFactor));
        const runtime = 0.12 * iterations * (0.8 + 0.4 * scalingFactor);
        const finalResidual = Math.max(1e-7, 1e-2 * Math.pow(0.62 + 0.04 * scalingFactor + 0.02 * warmFactor, iterations / 25));

        return { iterations, runtime, finalResidual };
    }

    function drawBars(kpi) {
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

        const vals = [kpi.iterations / 200, Math.min(1, kpi.runtime / 30), Math.min(1, -Math.log10(kpi.finalResidual) / 10)];
        const labels = ["Iterations", "Runtime", "Residual quality"];
        const colors = ["#2563eb", "#f59e0b", "#16a34a"];

        const barW = 58;
        const gap = 48;
        const startX = pad + 34;

        for (let i = 0; i < vals.length; i++) {
            const x = startX + i * (barW + gap);
            const bh = vals[i] * (h - 2 * pad);
            const y = h - pad - bh;

            ctx.fillStyle = colors[i];
            ctx.fillRect(x, y, barW, bh);

            ctx.fillStyle = "#334155";
            ctx.font = "12px sans-serif";
            ctx.fillText(labels[i], x - 6, h - pad + 18);
        }
    }

    function update() {
        const scaling = parseInt(scalingRange.value, 10);
        const warm = parseInt(warmstartRange.value, 10);
        const tol = parseInt(toleranceRange.value, 10);

        const kpi = computeKpis(scaling, warm, tol);
        drawBars(kpi);

        paramsDisplay.textContent = `scaling=${scaling}/10, warm-start=${warm}/10, tolerance strictness=${tol}/10`;

        let text = "Solver Engineering Run Report\n";
        text += "----------------------------\n";
        text += `Scaling quality: ${scaling}/10\n`;
        text += `Warm-start quality: ${warm}/10\n`;
        text += `Tolerance strictness: ${tol}/10\n\n`;
        text += `Estimated iterations: ${kpi.iterations}\n`;
        text += `Estimated runtime (arb): ${kpi.runtime.toFixed(2)}\n`;
        text += `Estimated final residual: ${kpi.finalResidual.toExponential(4)}\n`;
        text += `Engineering verdict: ${kpi.iterations < 70 ? "fast" : (kpi.iterations < 120 ? "balanced" : "slow/tight")}\n`;

        metricsBox.textContent = text;
    }

    scalingRange.addEventListener("input", update);
    warmstartRange.addEventListener("input", update);
    toleranceRange.addEventListener("input", update);

    update();
});
