document.addEventListener("DOMContentLoaded", function () {
    const dimRange = document.getElementById("conic-dim-range");
    const accRange = document.getElementById("conic-acc-range");
    const structureRange = document.getElementById("conic-structure-range");

    const paramsDisplay = document.getElementById("conic-params-display");
    const metricsBox = document.getElementById("conicMetrics");
    const canvas = document.getElementById("conicCanvas");

    if (!dimRange || !accRange || !structureRange || !paramsDisplay || !metricsBox || !canvas) {
        return;
    }

    const ctx = canvas.getContext("2d");
    const classes = ["LP", "QP", "SOCP", "SDP"];

    function modelScores(dim, acc, structure) {
        const d = dim;
        const a = acc;
        const s = structure;

        const cost = {
            LP: 0.9 * d + 0.3 * a - 0.15 * s,
            QP: 1.1 * d + 0.4 * a - 0.18 * s,
            SOCP: 1.5 * d + 0.65 * a - 0.22 * s,
            SDP: 2.4 * d + 1.1 * a - 0.25 * s
        };

        const fidelity = {
            LP: 3.5 + 0.1 * s,
            QP: 5.2 + 0.18 * s,
            SOCP: 6.6 + 0.25 * s,
            SDP: 8.1 + 0.28 * s
        };

        const targetBoost = 0.25 * a;
        for (const key of classes) {
            fidelity[key] = Math.min(10, fidelity[key] + targetBoost);
            cost[key] = Math.max(0.5, cost[key]);
        }

        return { cost, fidelity };
    }

    function drawBars(cost) {
        const w = canvas.width;
        const h = canvas.height;
        const pad = 36;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);

        const values = classes.map((name) => cost[name]);
        const vmax = Math.max(...values) * 1.15;

        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad, h - pad);
        ctx.lineTo(w - pad, h - pad);
        ctx.moveTo(pad, h - pad);
        ctx.lineTo(pad, pad);
        ctx.stroke();

        const barW = (w - 2 * pad) / (classes.length * 1.6);
        const gap = barW * 0.6;
        const start = pad + gap;
        const colors = ["#2563eb", "#16a34a", "#d97706", "#dc2626"];

        classes.forEach((name, i) => {
            const val = cost[name];
            const height = ((val / vmax) * (h - 2 * pad));
            const x = start + i * (barW + gap);
            const y = h - pad - height;

            ctx.fillStyle = colors[i];
            ctx.fillRect(x, y, barW, height);

            ctx.fillStyle = "#334155";
            ctx.font = "12px sans-serif";
            ctx.fillText(name, x + 4, h - pad + 16);
            ctx.fillText(val.toFixed(1), x + 2, y - 6);
        });

        ctx.fillStyle = "#334155";
        ctx.fillText("relative compute cost", pad + 4, pad - 8);
    }

    function update() {
        const dim = parseInt(dimRange.value, 10);
        const acc = parseInt(accRange.value, 10);
        const structure = parseInt(structureRange.value, 10);

        const scores = modelScores(dim, acc, structure);
        drawBars(scores.cost);

        let bestCost = "LP";
        let bestFidelity = "LP";
        classes.forEach((name) => {
            if (scores.cost[name] < scores.cost[bestCost]) {
                bestCost = name;
            }
            if (scores.fidelity[name] > scores.fidelity[bestFidelity]) {
                bestFidelity = name;
            }
        });

        let recommended = "QP";
        if (acc >= 8) {
            recommended = structure >= 7 ? "SDP" : "SOCP";
        } else if (dim >= 8) {
            recommended = "LP";
        } else if (structure >= 8) {
            recommended = "SOCP";
        }

        let text = "Conic Modeling Planner\n";
        text += "---------------------\n";
        text += `dimension scale = ${dim}, accuracy target = ${acc}, structure score = ${structure}\n\n`;
        text += "Class summary:\n";
        classes.forEach((name) => {
            text += `${name.padEnd(5)} cost=${scores.cost[name].toFixed(2)}  fidelity=${scores.fidelity[name].toFixed(2)}\n`;
        });
        text += "\n";
        text += `lowest-cost class: ${bestCost}\n`;
        text += `highest-fidelity class: ${bestFidelity}\n`;
        text += `recommended starting model: ${recommended}\n`;

        metricsBox.textContent = text;
        paramsDisplay.textContent = `dimension=${dim}, accuracy=${acc}, structure=${structure}`;
    }

    dimRange.addEventListener("input", update);
    accRange.addEventListener("input", update);
    structureRange.addEventListener("input", update);

    update();
});
