document.addEventListener("DOMContentLoaded", function () {
    const alphaRange = document.getElementById("pgd-alpha-range");
    const stepsRange = document.getElementById("pgd-steps-range");
    const x0xRange = document.getElementById("pgd-x0x-range");
    const x0yRange = document.getElementById("pgd-x0y-range");

    const paramsDisplay = document.getElementById("pgd-params-display");
    const metricsBox = document.getElementById("pgdMetricsBox");
    const canvas = document.getElementById("pgdCanvas");
    const runBtn = document.getElementById("runPgdBtn");
    const resetBtn = document.getElementById("resetPgdBtn");

    if (!alphaRange || !stepsRange || !x0xRange || !x0yRange || !canvas || !runBtn || !resetBtn) {
        return;
    }

    const ctx = canvas.getContext("2d");
    const rho = 1.5;
    const d = [2.5, 2.0];

    function objective(x) {
        const dx = x[0] - d[0];
        const dy = x[1] - d[1];
        return 0.5 * (dx * dx + dy * dy);
    }

    function grad(x) {
        return [x[0] - d[0], x[1] - d[1]];
    }

    function projectBox(v) {
        return [
            Math.max(-rho, Math.min(rho, v[0])),
            Math.max(-rho, Math.min(rho, v[1]))
        ];
    }

    function toCanvas(pt) {
        const width = canvas.width;
        const height = canvas.height;
        const pad = 40;
        const xMin = -3;
        const xMax = 3;
        const yMin = -3;
        const yMax = 3;

        const x = pad + ((pt[0] - xMin) / (xMax - xMin)) * (width - 2 * pad);
        const y = height - pad - ((pt[1] - yMin) / (yMax - yMin)) * (height - 2 * pad);
        return [x, y];
    }

    function drawAxesAndBox() {
        const width = canvas.width;
        const height = canvas.height;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        const origin = toCanvas([0, 0]);
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.moveTo(20, origin[1]);
        ctx.lineTo(width - 20, origin[1]);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(origin[0], 20);
        ctx.lineTo(origin[0], height - 20);
        ctx.stroke();

        const bl = toCanvas([-rho, -rho]);
        const tr = toCanvas([rho, rho]);
        const bw = tr[0] - bl[0];
        const bh = bl[1] - tr[1];

        ctx.fillStyle = "rgba(56, 161, 105, 0.12)";
        ctx.fillRect(bl[0], tr[1], bw, bh);
        ctx.strokeStyle = "#38a169";
        ctx.lineWidth = 2;
        ctx.strokeRect(bl[0], tr[1], bw, bh);

        const dCanvas = toCanvas(d);
        ctx.fillStyle = "#dc2626";
        ctx.beginPath();
        ctx.arc(dCanvas[0], dCanvas[1], 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = "#334155";
        ctx.font = "12px sans-serif";
        ctx.fillText("target d", dCanvas[0] + 8, dCanvas[1] - 8);
    }

    function runPgd() {
        const alpha = parseFloat(alphaRange.value);
        const steps = parseInt(stepsRange.value, 10);
        let x = [parseFloat(x0xRange.value), parseFloat(x0yRange.value)];

        const path = [x.slice()];
        let log = "k | x1      x2      | f(x)\n";
        log += "--+----------------+---------\n";
        log += `0 | ${x[0].toFixed(4).padEnd(7)} ${x[1].toFixed(4).padEnd(7)} | ${objective(x).toFixed(5)}\n`;

        for (let k = 1; k <= steps; k++) {
            const g = grad(x);
            const y = [x[0] - alpha * g[0], x[1] - alpha * g[1]];
            x = projectBox(y);
            path.push(x.slice());
            log += `${String(k).padEnd(2)}| ${x[0].toFixed(4).padEnd(7)} ${x[1].toFixed(4).padEnd(7)} | ${objective(x).toFixed(5)}\n`;
        }

        metricsBox.textContent = log;
        drawPath(path);
    }

    function drawPath(path) {
        drawAxesAndBox();

        ctx.strokeStyle = "#2563eb";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < path.length; i++) {
            const p = toCanvas(path[i]);
            if (i === 0) {
                ctx.moveTo(p[0], p[1]);
            } else {
                ctx.lineTo(p[0], p[1]);
            }
        }
        ctx.stroke();

        for (let i = 0; i < path.length; i++) {
            const p = toCanvas(path[i]);
            ctx.fillStyle = i === 0 ? "#7c3aed" : "#2563eb";
            ctx.beginPath();
            ctx.arc(p[0], p[1], 3.5, 0, 2 * Math.PI);
            ctx.fill();
        }

        const start = toCanvas(path[0]);
        const end = toCanvas(path[path.length - 1]);
        ctx.fillStyle = "#334155";
        ctx.font = "12px sans-serif";
        ctx.fillText("x0", start[0] + 6, start[1] - 6);
        ctx.fillText("x_end", end[0] + 6, end[1] - 6);
    }

    function updateParamsLabel() {
        paramsDisplay.textContent = `alpha = ${parseFloat(alphaRange.value).toFixed(2)}, iterations = ${stepsRange.value}, x0 = (${parseFloat(x0xRange.value).toFixed(1)}, ${parseFloat(x0yRange.value).toFixed(1)})`;
    }

    function resetView() {
        updateParamsLabel();
        drawAxesAndBox();
        metricsBox.textContent = "Run the demo to populate metrics.";
    }

    alphaRange.addEventListener("input", updateParamsLabel);
    stepsRange.addEventListener("input", updateParamsLabel);
    x0xRange.addEventListener("input", updateParamsLabel);
    x0yRange.addEventListener("input", updateParamsLabel);

    runBtn.addEventListener("click", runPgd);
    resetBtn.addEventListener("click", resetView);

    resetView();
});
