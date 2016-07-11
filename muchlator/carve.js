var i = 0;
var widthOrig, heightOrig, width, height;
var minPath, path, imageData;
var iter, quality;

function carveH() {
    var idx, idxP, x, y;
    var top, leftTop, rightTop;
    var min0, min1, min2, minNow;
    var data = imageData.data;

    for (var ti = 0; ti < 1; ti++) {

        var time0 = new Date().getTime();
        for (x = 0; x < width + 2; x += 1) {
            minPath[x] = Math.abs(data[x * 4 - 4] - data[x * 4 + 4]);
        }
        for (y = 0; y < height; y += 1) {
            idx = (y * (widthOrig + 2));
            minPath[idx] = Infinity;
            minPath[idx + width + 1] = Infinity;
        }

        dataBW = new Array(data.length/4);
        for (var i = 0; i < data.length/4; i += 1) {
            dataBW[i] = 0.2989*data[i * 4] + 0.5870*data[i * 4 + 1] + 0.1140*data[i * 4 + 2];
        }

        //fill 2D path array
        for (y = 1; y < height; y += 1) {
            idx = ((y + 1) * widthOrig - 1);
            idxP = y * (widthOrig + 2) - 1 + 1 - (widthOrig + 2);
            for (x = 0; x < width; x += 1) {
                idx++;
                idxP++;

                top = Math.abs(dataBW[idx - 1] - dataBW[idx + 1]);
                leftTop = top + Math.abs(dataBW[idx - 1] - dataBW[idx - widthOrig]);
                rightTop = top + Math.abs(dataBW[idx + 1] - dataBW[idx - widthOrig]);

                min0 = minPath[idxP - 1] + leftTop;
                min1 = minPath[idxP] + top;
                min2 = minPath[idxP + 1] + rightTop;
                minNow = Math.min(min0, Math.min(min1, min2));

                minPath[idxP + (widthOrig + 2)] = minNow;
                if (minNow == min0)
                    path[idx] = x - 1;
                else if (minNow == min1)
                    path[idx] = x;
                else
                    path[idx] = x + 1;
            }
        }


        //seams search
        var seams = [];
        for (x = 0; x < width; x += 1) {
            idxP = (heightOrig - 2) * (widthOrig + 2) + x;
            seams.push({ xorig: x, x: x, cost: minPath[idxP] });
        }
        
        heTo = height * (1-quality);
        for (y = height - 1; y > heTo; y -= 1) {
            idxP = y * (widthOrig + 2) + x + 1 - (widthOrig + 2);
            var len = seams.length;
            var lastX = -1, lastI = -1;
            for (var i = len - 1; i >= 0; i--) {
                idxP++;
                idx = (y * widthOrig + seams[i].x);
                seams[i].x = path[idx];
                if (lastX == seams[i].x) {
                    var myEnergy = seams[i].cost;
                    var hisEnergy = seams[lastI].cost;
                    if (myEnergy > hisEnergy) {
                        seams.splice(i, 1);
                    }
                    else {
                        seams.splice(lastI, 1);
                    }
                }

                lastX = seams[i].x;
                lastI = i;
            }
        }

        //cleanup minPath
        for (y = 0; y < height; y += 1) {
            idx = ((y + 1) * widthOrig - 1);
            for (x = 0; x < width; x += 1) {
                idx += 1;
                //idx = (y * widthOrig + x);
                minPath[idx] = 0;
            }
        }

        //seam mark
        var len = seams.length;
        for (var i = 0; i < len; i++) {
            var nowX = seams[i].xorig;
            for (y = height - 1; y >= 0; y -= 1) {
                idx = (y * widthOrig + nowX);
                nowX = path[idx];
                minPath[idx] -= 1;
                //data[idx * 4] = 255;
            }
        }

        //seam delete
        for (y = 0; y < height; y += 1) {
            var writeMinus = 0;
            var skipWrites = 0;
            idx = ((y + 1) * widthOrig - 1) * 4;
            idxWrite = ((y + 1) * widthOrig - 1) * 4;
            for (x = 0; x < width; x += 1) {
                idxWrite += 4;
                idx += 4;
                var num = minPath[idx / 4];
                if (num < 0)
                    skipWrites += -num;
                if (skipWrites > 0) {
                    idxWrite -= 4;
                    skipWrites -= 1;
                    continue;
                }
                data[idxWrite] = data[idx];
                data[idxWrite + 1] = data[idx + 1];
                data[idxWrite + 2] = data[idx + 2];
            }
            //black border
            for (x = width - len; x < width; x += 1) {
                idx = (y * widthOrig + x) * 4;
                data[idx] = 0;
                data[idx + 1] = 0;
                data[idx + 2] = 0;
            }
        }

        //transponse = slow and stupid
        data2 = new Array(data.length);
        for (y = 1; y < height; y += 1) {
            y2 = y;
            if ((iter / 2) % 2)
                y2 = height - y;
            for (x = 0; x < width; x += 1) {
                idx = (y * widthOrig + x) * 4;
                idx2 = (x * heightOrig + y2) * 4;
                data2[idx2] = data[idx];
                data2[idx2+1] = data[idx+1];
                data2[idx2+2] = data[idx+2];
                data2[idx2+3] = data[idx+3];
            }
        }
        for (i = 1; i < data.length; i++) {
            data[i] = data2[i];
        }
    }
    width = width - len;
    postMessage({ "imageData": imageData, "width": width, "height": height });
}


















self.addEventListener("message", function (e) {
    var edata = e.data;
    widthOrig = edata.widthOrig;
    heightOrig = edata.heightOrig;
    width = edata.width;
    height = edata.height;
    minPath = edata.minPath;
    path = edata.path;
    imageData = edata.imageData;
    iter = edata.iter;
    quality = edata.quality;
    carveH();
}, false);
