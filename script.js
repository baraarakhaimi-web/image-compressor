// ======================================================
// IMAGECOMPRESS
// Client-side image compression
// ======================================================

const fileInput = document.getElementById("fileInput");
const uploadBox = document.getElementById("uploadBox");
const uploadButton = document.getElementById("uploadButton");

const quality = document.getElementById("quality");
const qualityValue = document.getElementById("qualityValue");

const resizeToggle = document.getElementById("resizeToggle");
const resizeOptions = document.getElementById("resizeOptions");

const resizeWidth = document.getElementById("resizeWidth");
const resizeHeight = document.getElementById("resizeHeight");

const compressButton = document.getElementById("compressButton");
const downloadButton = document.getElementById("downloadButton");

const originalPreview = document.getElementById("originalPreview");
const compressedPreview = document.getElementById("compressedPreview");

const originalSize = document.getElementById("originalSize");
const compressedSize = document.getElementById("compressedSize");

const statsOriginal = document.getElementById("statsOriginal");
const statsCompressed = document.getElementById("statsCompressed");
const statsSaved = document.getElementById("statsSaved");

let selectedFile = null;
let compressedBlob = null;
let originalURL = null;
let compressedURL = null;


// ======================================================
// FORMAT SIZE
// ======================================================

function formatBytes(bytes) {

    if (!bytes) return "0 KB";

    if (bytes < 1024) {
        return bytes + " B";
    }

    if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(2) + " KB";
    }

    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}


// ======================================================
// OPEN FILE SELECTOR
// ======================================================

uploadButton.addEventListener("click", function (event) {

    event.stopPropagation();

    fileInput.click();

});


uploadBox.addEventListener("click", function () {

    fileInput.click();

});


// ======================================================
// FILE SELECTED
// ======================================================

fileInput.addEventListener("change", function () {

    if (!fileInput.files.length) return;

    handleFile(fileInput.files[0]);

});


// ======================================================
// DRAG & DROP
// ======================================================

uploadBox.addEventListener("dragover", function (event) {

    event.preventDefault();

    uploadBox.classList.add("dragging");

});


uploadBox.addEventListener("dragleave", function () {

    uploadBox.classList.remove("dragging");

});


uploadBox.addEventListener("drop", function (event) {

    event.preventDefault();

    uploadBox.classList.remove("dragging");

    const file = event.dataTransfer.files[0];

    if (file) {
        handleFile(file);
    }

});


// ======================================================
// HANDLE FILE
// ======================================================

function handleFile(file) {

    if (!file.type.startsWith("image/")) {

        alert("Please choose a valid image.");

        return;
    }


    if (file.size > 20 * 1024 * 1024) {

        alert("Maximum file size is 20MB.");

        return;
    }


    selectedFile = file;

    compressedBlob = null;


    // Clean old URLs

    if (originalURL) {
        URL.revokeObjectURL(originalURL);
    }

    if (compressedURL) {
        URL.revokeObjectURL(compressedURL);
    }


    originalURL = URL.createObjectURL(file);


    // Original preview

    originalPreview.innerHTML = `
        <img
            src="${originalURL}"
            alt="Original image preview"
        >
    `;


    // Reset compressed preview

    compressedPreview.innerHTML = `
        <div class="empty-preview">
            Click "Compress Image" to generate preview
        </div>
    `;


    // Sizes

    const size = formatBytes(file.size);

    originalSize.textContent = size;
    statsOriginal.textContent = size;

    compressedSize.textContent = "0 KB";
    statsCompressed.textContent = "0 KB";
    statsSaved.textContent = "0%";


    compressButton.disabled = false;
    downloadButton.disabled = true;


    // Try to detect dimensions

    const img = new Image();

    img.onload = function () {

        resizeWidth.value = img.width;
        resizeHeight.value = img.height;

    };

    img.src = originalURL;

}


// ======================================================
// QUALITY
// ======================================================

quality.addEventListener("input", function () {

    qualityValue.textContent = quality.value + "%";

});


// ======================================================
// RESIZE TOGGLE
// ======================================================

resizeToggle.addEventListener("change", function () {

    resizeOptions.classList.toggle(
        "active",
        resizeToggle.checked
    );

});


// ======================================================
// KEEP ASPECT RATIO
// ======================================================

resizeWidth.addEventListener("input", function () {

    if (!resizeToggle.checked) return;

    if (!selectedFile) return;

});


resizeHeight.addEventListener("input", function () {

    if (!resizeToggle.checked) return;

});


// ======================================================
// COMPRESS
// ======================================================

compressButton.addEventListener("click", async function () {

    if (!selectedFile) {

        alert("Please choose an image first.");

        return;
    }


    compressButton.disabled = true;

    compressButton.textContent = "Compressing...";


    try {

        compressedBlob = await compressImage(
            selectedFile,
            Number(quality.value) / 100
        );


        if (compressedURL) {
            URL.revokeObjectURL(compressedURL);
        }


        compressedURL = URL.createObjectURL(
            compressedBlob
        );


        compressedPreview.innerHTML = `
            <img
                src="${compressedURL}"
                alt="Compressed image preview"
            >
        `;


        const originalBytes = selectedFile.size;
        const compressedBytes = compressedBlob.size;


        const saved = Math.max(
            0,
            ((originalBytes - compressedBytes) / originalBytes) * 100
        );


        originalSize.textContent =
            formatBytes(originalBytes);

        compressedSize.textContent =
            formatBytes(compressedBytes);

        statsOriginal.textContent =
            formatBytes(originalBytes);

        statsCompressed.textContent =
            formatBytes(compressedBytes);

        statsSaved.textContent =
            Math.round(saved) + "%";


        downloadButton.disabled = false;


    } catch (error) {

        console.error(error);

        alert(
            "Something went wrong while compressing the image."
        );

    }


    compressButton.disabled = false;

    compressButton.innerHTML =
        `Compress Image <span>→</span>`;

});


// ======================================================
// IMAGE COMPRESSION FUNCTION
// ======================================================

function compressImage(file, qualityValue) {

    return new Promise((resolve, reject) => {

        const img = new Image();

        const url = URL.createObjectURL(file);


        img.onload = function () {

            URL.revokeObjectURL(url);


            let width = img.naturalWidth;
            let height = img.naturalHeight;


            // ==========================================
            // RESIZE
            // ==========================================

            if (resizeToggle.checked) {

                const targetWidth =
                    parseInt(resizeWidth.value);

                const targetHeight =
                    parseInt(resizeHeight.value);


                if (targetWidth > 0) {

                    const ratio =
                        targetWidth / width;

                    width = targetWidth;

                    height =
                        Math.round(height * ratio);

                }


                if (
                    targetHeight > 0 &&
                    !targetWidth
                ) {

                    const ratio =
                        targetHeight / height;

                    height = targetHeight;

                    width =
                        Math.round(width * ratio);

                }

            }


            // ==========================================
            // CANVAS
            // ==========================================

            const canvas =
                document.createElement("canvas");

            canvas.width = width;
            canvas.height = height;


            const ctx =
                canvas.getContext("2d");


            // White background for JPG

            if (
                file.type === "image/jpeg" ||
                file.type === "image/jpg"
            ) {

                ctx.fillStyle = "#ffffff";

                ctx.fillRect(
                    0,
                    0,
                    width,
                    height
                );

            }


            ctx.drawImage(
                img,
                0,
                0,
                width,
                height
            );


            // ==========================================
            // OUTPUT FORMAT
            // ==========================================

            let outputType = "image/jpeg";


            if (file.type === "image/png") {

                outputType = "image/webp";

            } else if (file.type === "image/webp") {

                outputType = "image/webp";

            }


            // ==========================================
            // EXPORT
            // ==========================================

            canvas.toBlob(
                function (blob) {

                    if (!blob) {

                        reject(
                            new Error(
                                "Compression failed."
                            )
                        );

                        return;
                    }


                    // If compression creates a bigger
                    // file, still return it because the
                    // user can see the result.

                    resolve(blob);

                },
                outputType,
                qualityValue
            );

        };


        img.onerror = function () {

            URL.revokeObjectURL(url);

            reject(
                new Error(
                    "Image could not be loaded."
                )
            );

        };


        img.src = url;

    });

}


// ======================================================
// DOWNLOAD
// ======================================================

downloadButton.addEventListener("click", function () {

    if (!compressedBlob) return;


    const extension =
        compressedBlob.type === "image/webp"
            ? "webp"
            : "jpg";


    const originalName =
        selectedFile.name
            .replace(/\.[^/.]+$/, "");


    const link =
        document.createElement("a");


    link.href =
        compressedURL;


    link.download =
        `${originalName}-compressed.${extension}`;


    document.body.appendChild(link);

    link.click();

    link.remove();

});


// ======================================================
// CLEANUP
// ======================================================

window.addEventListener("beforeunload", function () {

    if (originalURL) {
        URL.revokeObjectURL(originalURL);
    }

    if (compressedURL) {
        URL.revokeObjectURL(compressedURL);
    }

});
