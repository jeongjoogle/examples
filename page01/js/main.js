(function () {
    // setting values
    let fps = 30;
    let streamW = 320;
    let streamH = 240;
    let gridStep = 10;

    // screen parameters
    const CAPTURE_INTERVAL = 1000 / fps;
    const CAPTURE_W = streamW;
    const CAPTURE_H = streamH;
    const RESULT_W = CAPTURE_W;
    const RESULT_H = CAPTURE_H;

    // grid parameters
    const GRID_W = CAPTURE_W / gridStep;
    const GRID_H = CAPTURE_H / gridStep;
    const GRID_SIZE = gridStep * 2;
    const GRID_HALF = gridStep / 2;
    const INDEX_R = 0;
    const INDEX_G = 1;
    const INDEX_B = 2;

    // display variables
    let streamVideo;
    let captureCanvas, captureContext;
    let step1Canvas, step1Context;
    let step2Canvas, step2Context;
    let step3Canvas, step3Context;
    let step4Canvas, step4Context;
    let step5Canvas, step5Context;
    let step6Canvas, step6Context;
    let captureImage;

    // processing variables
    let averageR = averageG = averageB = 0;
    let lastAveR = lastAveG = lastAveB = [];
    let dtR = dtG = dtB = [];
    let dxR = dxG = dxB = [];
    let dyR = dyG = dyB = [];
    let ft = [];
    let fx = [];
    let fy = [];
    let resultx = [];
    let resulty = [];

    function init() {
        streamVideo = document.getElementById('display1');

        captureCanvas = document.getElementById('display2');
        captureCanvas.width = CAPTURE_W;
        captureCanvas.height = CAPTURE_H;
        captureContext = captureCanvas.getContext('2d');

        step1Canvas = document.getElementById('display3');
        step1Canvas.width = RESULT_W;
        step1Canvas.height = RESULT_H;
        step1Context = step1Canvas.getContext('2d');

        step2Canvas = document.getElementById('display4');
        step2Canvas.width = RESULT_W;
        step2Canvas.height = RESULT_H;
        step2Context = step2Canvas.getContext('2d');

        step3Canvas = document.getElementById('display5');
        step3Canvas.width = RESULT_W;
        step3Canvas.height = RESULT_H;
        step3Context = step3Canvas.getContext('2d');

        step4Canvas = document.getElementById('display6');
        step4Canvas.width = RESULT_W;
        step4Canvas.height = RESULT_H;
        step4Context = step4Canvas.getContext('2d');

        step5Canvas = document.getElementById('display7');
        step5Canvas.width = RESULT_W;
        step5Canvas.height = RESULT_H;
        step5Context = step5Canvas.getContext('2d');

        step6Canvas = document.getElementById('display8');
        step6Canvas.width = RESULT_W;
        step6Canvas.height = RESULT_H;
        step6Context = step6Canvas.getContext('2d');

        getStream();
    }

    function getStream() {
        captureContext.translate(CAPTURE_W, 0);
        captureContext.scale(-1, 1);

        let constraints = {
            audio: false,
            video: {
                width: streamW,
                height: streamH
            }
        };
        navigator.mediaDevices.getUserMedia(constraints)
            .then(function (stream) {
                streamVideo.srcObject = stream;
                self.setInterval(getCapture, CAPTURE_INTERVAL);
            })
            .catch(function (error) {
                console.log(error);
            });
    }

    function getCapture() {
        captureContext.drawImage(streamVideo, 0, 0, streamW, streamH);
        captureImage = captureContext.getImageData(0, 0, CAPTURE_W, CAPTURE_H);

        imageProcessing();
    }

    function imageProcessing() {
        // prepare
        differentiation();

        // compute
        opticalFolw();
    }

    function differentiation() {
        // images
        let averageImage = new ImageData(
            new Uint8ClampedArray(captureImage.data),
            captureImage.width,
            captureImage.height
        );
        let dtImage = new ImageData(
            new Uint8ClampedArray(captureImage.data),
            captureImage.width,
            captureImage.height
        );
        let dxImage = new ImageData(
            new Uint8ClampedArray(captureImage.data),
            captureImage.width,
            captureImage.height
        );
        let dyImage = new ImageData(
            new Uint8ClampedArray(captureImage.data),
            captureImage.width,
            captureImage.height
        );

        // loop outer
        for (let ix = 0; ix < GRID_W; ix++) {
            let x0 = ix * gridStep + GRID_HALF;
            for (let iy = 0; iy < GRID_H; iy++) {
                let y0 = iy * gridStep + GRID_HALF;
                let x1 = x0 - GRID_SIZE;
                let x2 = x0 + GRID_SIZE;
                let y1 = y0 - GRID_SIZE;
                let y2 = y0 + GRID_SIZE;
                let ig = GRID_W * iy + ix;

                // edge correction
                if (x1 < 0) {
                    x1 = 0;
                }
                if (x2 >= CAPTURE_W) {
                    x2 = CAPTURE_W - 1;
                }
                if (y1 < 0) {
                    y1 = 0;
                }
                if (y2 >= CAPTURE_H) {
                    y2 = CAPTURE_H - 1;
                }

                // compute average
                let k = (x2 - x1 + 1) * (y2 - y1 + 1);
                averageR = 0;
                averageG = 0;
                averageB = 0;
                for (let y = y1; y <= y2; y++) {
                    for (let x = (CAPTURE_W * y) + x1; x <= (CAPTURE_W * y) + x2; x++) {
                        averageR += captureImage.data[x * 4 + INDEX_R] / k;
                        averageG += captureImage.data[x * 4 + INDEX_G] / k;
                        averageB += captureImage.data[x * 4 + INDEX_B] / k;
                    }
                }
                averageR = Math.min(255, averageR);
                averageG = Math.min(255, averageG);
                averageB = Math.min(255, averageB);

                // compute time difference
                dtR[ig] = averageR - lastAveR[ig];
                dtG[ig] = averageG - lastAveG[ig];
                dtB[ig] = averageB - lastAveB[ig];

                // update
                lastAveR[ig] = averageR;
                lastAveG[ig] = averageG;
                lastAveB[ig] = averageB;

                // draw
                for (let y = y1; y <= y2; y++) {
                    for (let x = (CAPTURE_W * y) + x1; x <= (CAPTURE_W * y) + x2; x++) {
                        averageImage.data[x * 4 + INDEX_R] = averageR;
                        averageImage.data[x * 4 + INDEX_G] = averageG;
                        averageImage.data[x * 4 + INDEX_B] = averageB;
                    }
                }
                for (let y = y1; y <= y2; y++) {
                    for (let x = (CAPTURE_W * y) + x1; x <= (CAPTURE_W * y) + x2; x++) {
                        dtImage.data[x * 4 + INDEX_R] = dtR[ig];
                        dtImage.data[x * 4 + INDEX_G] = dtG[ig];
                        dtImage.data[x * 4 + INDEX_B] = dtB[ig];
                    }
                }
            }
        }
        // loop inner
        for (let ix = 1; ix < GRID_W - 1; ix++) {
            let x0 = ix * gridStep + GRID_HALF;
            for (let iy = 1; iy < GRID_H - 1; iy++) {
                let y0 = iy * gridStep + GRID_HALF;
                let x1 = x0 - GRID_SIZE;
                let x2 = x0 + GRID_SIZE;
                let y1 = y0 - GRID_SIZE;
                let y2 = y0 + GRID_SIZE;
                let ig = GRID_W * iy + ix;

                // compute x difference
                dxR[ig] = lastAveR[ig + 1] - lastAveR[ig - 1];
                dxG[ig] = lastAveG[ig + 1] - lastAveG[ig - 1];
                dxB[ig] = lastAveB[ig + 1] - lastAveB[ig - 1];

                // compute y difference
                dyR[ig] = lastAveR[ig + GRID_W] - lastAveR[ig - GRID_W];
                dyG[ig] = lastAveG[ig + GRID_W] - lastAveG[ig - GRID_W];
                dyB[ig] = lastAveB[ig + GRID_W] - lastAveB[ig - GRID_W];

                // draw
                for (let y = y1; y <= y2; y++) {
                    for (let x = (CAPTURE_W * y) + x1; x <= (CAPTURE_W * y) + x2; x++) {
                        dxImage.data[x * 4 + INDEX_R] = dxR[ig];
                        dxImage.data[x * 4 + INDEX_G] = dxG[ig];
                        dxImage.data[x * 4 + INDEX_B] = dxB[ig];
                    }
                }
                for (let y = y1; y <= y2; y++) {
                    for (let x = (CAPTURE_W * y) + x1; x <= (CAPTURE_W * y) + x2; x++) {
                        dyImage.data[x * 4 + INDEX_R] = dyR[ig];
                        dyImage.data[x * 4 + INDEX_G] = dyG[ig];
                        dyImage.data[x * 4 + INDEX_B] = dyB[ig];
                    }
                }
            }
        }

        // plot
        step1Context.putImageData(averageImage, 0, 0);
        step2Context.putImageData(dtImage, 0, 0);
        step3Context.putImageData(dxImage, 0, 0);
        step4Context.putImageData(dyImage, 0, 0);
    }

    function neighbourValues(f, d, i, color) {
        let j = color * 9;
        f[j + 0] = d[i];
        f[j + 1] = d[i - 1];
        f[j + 2] = d[i + 1];
        f[j + 3] = d[i - GRID_W];
        f[j + 4] = d[i + GRID_W];
        f[j + 5] = d[i - GRID_W - 1];
        f[j + 6] = d[i - GRID_W + 1];
        f[j + 7] = d[i + GRID_W - 1];
        f[j + 8] = d[i + GRID_W + 1];
    }

    function opticalFolw() {
        // plot
        step5Context.clearRect(0, 0, captureImage.width, captureImage.height);
        step6Context.clearRect(0, 0, captureImage.width, captureImage.height);
        let flowImage = new ImageData(
            new Uint8ClampedArray(captureImage.data),
            captureImage.width,
            captureImage.height
        );
        step6Context.putImageData(flowImage, 0, 0);

        // loop inner
        for (let ix = 1; ix < GRID_W - 1; ix++) {
            for (let iy = 1; iy < GRID_H - 1; iy++) {
                let ig = GRID_W * iy + ix;

                // regression
                neighbourValues(fx, dxR, ig, INDEX_R);
                neighbourValues(fx, dxG, ig, INDEX_G);
                neighbourValues(fx, dxB, ig, INDEX_B);
                neighbourValues(fy, dyR, ig, INDEX_R);
                neighbourValues(fy, dyG, ig, INDEX_G);
                neighbourValues(fy, dyB, ig, INDEX_B);
                neighbourValues(ft, dtR, ig, INDEX_R);
                neighbourValues(ft, dtG, ig, INDEX_G);
                neighbourValues(ft, dtB, ig, INDEX_B);

                // covariances
                let xx = xy = yy = xt = yt = 0;
                for (let i = 0; i < 3 * 9; i++) {
                    xx += fx[i] * fx[i];
                    xy += fx[i] * fy[i];
                    yy += fy[i] * fy[i];
                    xt += fx[i] * ft[i];
                    yt += fy[i] * ft[i];
                }

                // least squares
                let a = xx * yy - xy * xy + 1e10;
                let u = yy * xt - xy * yt;
                let v = xx * yt - xy * xt;

                // solve
                resultx[ig] = -2 * gridStep * u / a;
                resulty[ig] = -2 * gridStep * v / a;
            }
        }
        // loop outer
        for (let ix = 0; ix < GRID_W; ix++) {
            let x0 = ix * gridStep + GRID_HALF;
            for (let iy = 0; iy < GRID_H; iy++) {
                let y0 = iy * gridStep + GRID_HALF;
                let ig = GRID_W * iy + ix;

                // draw
                let u = fps * resultx[ig];
                let v = fps * resulty[ig];
                let a = Math.sqrt(u * u + v * v);
                if (a > 3) {
                    let colorR = 255 * 0.5 * (1 + u / a);
                    let colorG = 255 * 0.5 * (1 + v / a);
                    let colorB = 255;
                    let colors = 'rgb(' +
                        parseInt(colorR, 10).toString() + ', ' +
                        parseInt(colorG, 10).toString() + ', ' +
                        parseInt(colorB, 10).toString() + ')';

                    step5Context.beginPath();
                    step5Context.moveTo(x0, y0);
                    step5Context.lineTo(x0 + u, y0 + v);
                    step5Context.strokeStyle = colors;
                    step5Context.stroke();

                    step6Context.beginPath();
                    step6Context.moveTo(x0, y0);
                    step6Context.lineTo(x0 + u, y0 + v);
                    step6Context.strokeStyle = colors;
                    step6Context.stroke();
                }
            }
        }
    }

    init();
})();