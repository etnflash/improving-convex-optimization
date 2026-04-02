document.addEventListener("DOMContentLoaded", function () {
    const setSelect = document.getElementById("proj-set-select");
    const v1Range = document.getElementById("proj-v1-range");
    const v2Range = document.getElementById("proj-v2-range");

    const paramsDisplay = document.getElementById("proj-params-display");
    const pointDisplay = document.getElementById("proj-point-display");
    const distDisplay = document.getElementById("proj-dist-display");
    const canvas = document.getElementById("projCanvas");

    if (!setSelect || !v1Range || !v2Range || !canvas) {
        return;
    }

    const ctx = canvas.getContext("2d");

    function norm2(v) {
        return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
    }

    function project(setType, v) {
        if (setType === "box") {
            const rho = 1.5;
            return [
                Math.max(-rho, Math.min(rho, v[0])),
                Math.max(-rho, Math.min(rho, v[1]))
            ];
        }

        if (setType === "ball") {
            const r = 1.5;
            const n = norm2(v);
            if (n <= r || n < 1e-12) {
                return v.slice();
            }
            return [r * v[0] / n, r * v[1] / n];
        }

        if (setType === "simplex") {
            // 2D simplex: x>=0, y>=0, x+y=1
            const a = [v[0], v[1]];
            const sorted = a.slice().sort(function (x, y) { return y - x; });
            const tau = (sorted[0] + sorted[1] - 1) / 2;
            return [Math.max(v[0] - tau, 0), Math.max(v[1] - tau, 0)];
        }

        // affine: x + y = 1
        const s = v[0] + v[1] - 1;
        return [v[0] - 0.5 * s, v[1] - 0.5 * s];
    }

    function toCanvas(p) {
        const width = canvas.width;
        const height = canvas.height;
        const pad = 45;
        const min = -3;
        const max = 3;
        const x = pad + ((p[0] - min) / (max - min)) * (width - 2 * pad);
        const y = height - pad - ((p[1] - min) / (max - min)) * (height - 2 * pad);
        return [x, y];
    }

    function drawSet(setType) {
        const width = canvas.width;
        const height = canvas.height;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        const o = toCanvas([0, 0]);
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(20, o[1]);
        ctx.lineTo(width - 20, o[1]);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(o[0], 20);
        ctx.lineTo(o[0], height - 20);
        ctx.stroke();

        if (setType === "box") {
            const bl = toCanvas([-1.5, -1.5]);
            const tr = toCanvas([1.5, 1.5]);
            const w = tr[0] - bl[0];
            const h = bl[1] - tr[1];
            ctx.fillStyle = "rgba(56, 161, 105, 0.12)";
            ctx.fillRect(bl[0], tr[1], w, h);
            ctx.strokeStyle = "#38a169";
            ctx.lineWidth = 2;
            ctx.strokeRect(bl[0], tr[1], w, h);
            return;
        }

        if (setType === "ball") {
            const c = toCanvas([0, 0]);
            const e = toCanvas([1.5, 0]);
            const r = Math.abs(e[0] - c[0]);
            ctx.fillStyle = "rgba(56, 161, 105, 0.12)";
            ctx.beginPath();
            ctx.arc(c[0], c[1], r, 0, 2 * Math.PI);
            ctx.fill();
            ctx.strokeStyle = "#38a169";
            ctx.lineWidth = 2;
            ctx.stroke();
            return;
        }

        if (setType === "simplex") {
            const p1 = toCanvas([1, 0]);
            const p2 = toCanvas([0, 1]);
            ctx.strokeStyle = "#38a169";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(p1[0], p1[1]);
            ctx.lineTo(p2[0], p2[1]);
            ctx.stroke();
            ctx.fillStyle = "#334155";
            ctx.font = "12px sans-serif";
            ctx.fillText("simplex edge", (p1[0] + p2[0]) / 2 + 8, (p1[1] + p2[1]) / 2 - 8);
            return;
        }

        const a = toCanvas([-2, 3]);
        const b = toCanvas([3, -2]);
        ctx.strokeStyle = "#38a169";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();
        ctx.fillStyle = "#334155";
        ctx.font = "12px sans-serif";
        ctx.fillText("x + y = 1", b[0] - 70, b[1] - 8);
    }

    function update() {
        const setType = setSelect.value;
        const v = [parseFloat(v1Range.value), parseFloat(v2Range.value)];
        const p = project(setType, v);
        const d = norm2([v[0] - p[0], v[1] - p[1]]);

        drawSet(setType);

        const vCanvas = toCanvas(v);
        const pCanvas = toCanvas(p);

        ctx.strokeStyle = "#64748b";
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(vCanvas[0], vCanvas[1]);
        ctx.lineTo(pCanvas[0], pCanvas[1]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#dc2626";
        ctx.beginPath();
        ctx.arc(vCanvas[0], vCanvas[1], 4.5, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = "#2563eb";
        ctx.beginPath();
        ctx.arc(pCanvas[0], pCanvas[1], 4.5, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = "#334155";
        ctx.font = "12px sans-serif";
        ctx.fillText("v", vCanvas[0] + 7, vCanvas[1] - 7);
        ctx.fillText("Proj(v)", pCanvas[0] + 7, pCanvas[1] - 7);

        paramsDisplay.textContent = "Set = " + setType + ", v = (" + v[0].toFixed(2) + ", " + v[1].toFixed(2) + ")";
        pointDisplay.textContent = "Projection: Pi_C(v) = (" + p[0].toFixed(3) + ", " + p[1].toFixed(3) + ")";
        distDisplay.textContent = "Distance ||v - Pi_C(v)||_2 = " + d.toFixed(4);
    }

    setSelect.addEventListener("change", update);
    v1Range.addEventListener("input", update);
    v2Range.addEventListener("input", update);
    update();
});
