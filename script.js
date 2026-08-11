const uploadArea = document.getElementById("uploadArea");
const uploadButton = document.getElementById("uploadButton");
const fileInput = document.getElementById("fileInput");
const results = document.getElementById("results");
const downloadAllButton = document.getElementById("downloadAllButton");

const MAX_FILE_SIZE = 20 * 1024 * 1024;

let compressionResults = [];


// ======================================================
// UPLOAD
// ======================================================

uploadButton.addEventListener("click", (event) => {
    event.stopPropagation();
    fileInput.click();
});

uploadArea.addEventListener("click", (event) => {
    if (event.target !== uploadButton) {
        fileInput.click();
    }
});

fileInput.addEventListener("change", () => {
    handleFiles(fileInput.files);
    fileInput.value = "";
});


// ======================================================
// DRAG & DROP
// ======================================================

uploadArea.addEventListener("dragover", (event) => {
    event.preventDefault();
    uploadArea.classList.add("dragover");
});

uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragover");
});

uploadArea.addEventListener("drop", (event) => {
    event.preventDefault();

    uploadArea.classList.remove("dragover");

    handleFiles(event.dataTransfer.files);
});


// ======================================================
// HANDLE FILES
// ======================================================

function handleFiles(files) {

    if (!files || files.length === 0) {
        return;
    }

    results.innerHTML = "";

    results.style.display = "block";

    compressionResults = [];

    downloadAllButton.disabled = true;

    Array.from(files).forEach((file) => {

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {

            showError(
                `${file.name}: format not supported.`
            );

            return;
        }

        if (file.size > MAX_FILE_SIZE) {

            showError(
                `${file.name}: file is larger than 20 MB.`
            );

            return;
        }

        createCompressionCard(file);
    });
}


// ======================================================
// CREATE CARD
// ======================================================

function createCompressionCard(file) {

    const card =
        document.createElement("div");

    card.className =
        "compression-card";

    card.innerHTML = `

        <div class="result-header">

            <div>

                <h3>
                    ${escapeHTML(file.name)}
                </h3>

                <span class="original-label">
                    Original: ${formatBytes(file.size)}
                </span>

            </div>

            <button
                class="remove-button"
                type="button"
            >
                ×
            </button>

        </div>


        <div class="comparison">

            <div class="preview-box">

                <span>
                    Original
                </span>

                <img
                    class="original-preview"
                    alt="Original image"
                >

            </div>


            <div class="preview-box">

                <span>
                    Compressed
                </span>

                <img
                    class="compressed-preview"
                    alt="Compressed image"
                >

            </div>

        </div>


        <!-- FORMAT -->

        <div class="format-section">

            <span class="format-title">
                Output Format
            </span>

            <div class="format-options">

                <button
                    class="format-option active"
                    data-format="jpeg"
                    type="button"
                >
                    JPG
                </button>

                <button
                    class="format-option"
                    data-format="png"
                    type="button"
                >
                    PNG
                </button>

                <button
                    class="format-option"
                    data-format="webp"
                    type="button"
                >
                    WEBP
                </button>

            </div>

        </div>


        <!-- RESIZE -->

        <div class="resize-section">

            <span class="resize-title">
                Resize Image
            </span>

            <div class="resize-inputs">

                <div class="resize-field">

                    <label>
                        Width
                    </label>

                    <input
                        class="width-input"
                        type="number"
                        min="1"
                    >

                </div>


                <span class="resize-x">
                    ×
                </span>


                <div class="resize-field">

                    <label>
                        Height
                    </label>

                    <input
                        class="height-input"
                        type="number"
                        min="1"
                    >

                </div>

            </div>


            <label class="aspect-label">

                <input
                    class="aspect-checkbox"
                    type="checkbox"
                    checked
                >

                Keep aspect ratio

            </label>


            <button
                class="reset-size-button"
                type="button"
            >
                Use original size
            </button>

        </div>


        <!-- QUALITY -->

        <div class="quality-section">

            <div class="quality-top">

                <label>
                    Compression Quality
                </label>

                <strong class="quality-value">
                    75%
                </strong>

            </div>


            <input
                class="quality-slider"
                type="range"
                min="20"
                max="100"
                value="75"
            >


            <div class="quality-hints">

                <span>
                    Smaller file
                </span>

                <span>
                    Better quality
                </span>

            </div>

        </div>


        <!-- STATS -->

        <div class="stats">

            <div class="stat">

                <span>
                    Original
                </span>

                <strong class="original-size">
                    ${formatBytes(file.size)}
                </strong>

            </div>


            <div class="stat">

                <span>
                    Compressed
                </span>

                <strong class="compressed-size">
                    —
                </strong>

            </div>


            <div class="stat saved-stat">

                <span>
                    You save
                </span>

                <strong class="saved-percent">
                    —
                </strong>

            </div>

        </div>


        <div class="result-actions">

            <button
                class="download-button"
                type="button"
                disabled
            >
                Download
            </button>

        </div>

    `;


    results.appendChild(card);


    // ==================================================
    // ELEMENTS
    // ==================================================

    const originalPreview =
        card.querySelector(".original-preview");

    const compressedPreview =
        card.querySelector(".compressed-preview");

    const qualitySlider =
        card.querySelector(".quality-slider");

    const qualityValue =
        card.querySelector(".quality-value");

    const compressedSize =
        card.querySelector(".compressed-size");

    const savedPercent =
        card.querySelector(".saved-percent");

    const downloadButton =
        card.querySelector(".download-button");

    const removeButton =
        card.querySelector(".remove-button");

    const formatButtons =
        card.querySelectorAll(".format-option");

    const widthInput =
        card.querySelector(".width-input");

    const heightInput =
        card.querySelector(".height-input");

    const aspectCheckbox =
        card.querySelector(".aspect-checkbox");

    const resetSizeButton =
        card.querySelector(".reset-size-button");


    // ==================================================
    // VARIABLES
    // ==================================================

    let selectedFormat = "jpeg";

    let originalWidth = 0;

    let originalHeight = 0;

    let aspectRatio = 1;

    let compressedBlob = null;

    let compressedPreviewURL = null;

    let resultObject = null;


    // ==================================================
    // LOAD IMAGE
    // ==================================================

    const reader =
        new FileReader();


    reader.onload = (event) => {

        originalPreview.src =
            event.target.result;


        const image =
            new Image();


        image.onload = () => {

            originalWidth =
                image.width;

            originalHeight =
                image.height;

            aspectRatio =
                originalWidth /
                originalHeight;


            widthInput.value =
                originalWidth;

            heightInput.value =
                originalHeight;


            compressFile();

        };


        image.src =
            event.target.result;

    };


    reader.readAsDataURL(file);


    // ==================================================
    // QUALITY
    // ==================================================

    qualitySlider.addEventListener(
        "input",
        () => {

            qualityValue.textContent =
                `${qualitySlider.value}%`;

            compressFile();

        }
    );


    // ==================================================
    // FORMAT
    // ==================================================

    formatButtons.forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                formatButtons.forEach(
                    (item) => {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                selectedFormat =
                    button.dataset.format;


                compressFile();

            }
        );

    });


    // ==================================================
    // WIDTH
    // ==================================================

    widthInput.addEventListener(
        "input",
        () => {

            const width =
                parseInt(
                    widthInput.value
                );


            if (!width || width < 1) {
                return;
            }


            if (
                aspectCheckbox.checked
            ) {

                heightInput.value =
                    Math.round(
                        width /
                        aspectRatio
                    );

            }


            compressFile();

        }
    );


    // ==================================================
    // HEIGHT
    // ==================================================

    heightInput.addEventListener(
        "input",
        () => {

            const height =
                parseInt(
                    heightInput.value
                );


            if (!height || height < 1) {
                return;
            }


            if (
                aspectCheckbox.checked
            ) {

                widthInput.value =
                    Math.round(
                        height *
                        aspectRatio
                    );

            }


            compressFile();

        }
    );


    // ==================================================
    // ASPECT RATIO
    // ==================================================

    aspectCheckbox.addEventListener(
        "change",
        () => {

            if (
                aspectCheckbox.checked
            ) {

                const width =
                    parseInt(
                        widthInput.value
                    );


                if (
                    width &&
                    width > 0
                ) {

                    heightInput.value =
                        Math.round(
                            width /
                            aspectRatio
                        );

                }

            }

        }
    );


    // ==================================================
    // RESET SIZE
    // ==================================================

    resetSizeButton.addEventListener(
        "click",
        () => {

            widthInput.value =
                originalWidth;

            heightInput.value =
                originalHeight;

            compressFile();

        }
    );


    // ==================================================
    // REMOVE
    // ==================================================

    removeButton.addEventListener(
        "click",
        () => {

            if (compressedPreviewURL) {

                URL.revokeObjectURL(
                    compressedPreviewURL
                );

            }


            if (resultObject) {

                compressionResults =
                    compressionResults.filter(
                        (item) =>
                            item !== resultObject
                    );

            }


            card.remove();


            updateDownloadAllButton();


            if (
                results.children.length === 0
            ) {

                results.style.display =
                    "none";

            }

        }
    );


    // ==================================================
    // COMPRESSION
    // ==================================================

    function compressFile() {

        if (
            !originalWidth ||
            !originalHeight
        ) {
            return;
        }


        let width =
            parseInt(
                widthInput.value
            );


        let height =
            parseInt(
                heightInput.value
            );


        if (
            !width ||
            width < 1
        ) {

            width =
                originalWidth;

        }


        if (
            !height ||
            height < 1
        ) {

            height =
                originalHeight;

        }


        const MAX_DIMENSION =
            10000;


        width =
            Math.min(
                width,
                MAX_DIMENSION
            );


        height =
            Math.min(
                height,
                MAX_DIMENSION
            );


        const canvas =
            document.createElement(
                "canvas"
            );


        canvas.width =
            width;

        canvas.height =
            height;


        const ctx =
            canvas.getContext(
                "2d"
            );


        const image =
            new Image();


        image.onload = () => {

            if (
                selectedFormat === "jpeg"
            ) {

                ctx.fillStyle =
                    "#ffffff";

                ctx.fillRect(
                    0,
                    0,
                    width,
                    height
                );

            }


            ctx.drawImage(
                image,
                0,
                0,
                width,
                height
            );


            let mimeType;


            if (
                selectedFormat === "png"
            ) {

                mimeType =
                    "image/png";

            } else if (
                selectedFormat === "webp"
            ) {

                mimeType =
                    "image/webp";

            } else {

                mimeType =
                    "image/jpeg";

            }


            let quality =
                Number(
                    qualitySlider.value
                ) / 100;


            if (
                selectedFormat === "png"
            ) {

                quality =
                    undefined;

            }


            compressCanvas(
                canvas,
                mimeType,
                quality
            );

        };


        image.src =
            originalPreview.src;

    }


    // ==================================================
    // COMPRESS CANVAS
    // ==================================================

    function compressCanvas(
        canvas,
        mimeType,
        quality
    ) {

        canvas.toBlob(
            (blob) => {

                if (!blob) {

                    showError(
                        "Compression failed."
                    );

                    return;

                }


                /*
                 * Smaller than original
                 */

                if (
                    blob.size < file.size
                ) {

                    useCompressedBlob(
                        blob
                    );

                    return;

                }


                /*
                 * Try stronger compression
                 * for JPG / WEBP
                 */

                if (
                    selectedFormat !== "png"
                ) {

                    tryStrongerCompression(
                        canvas,
                        mimeType,
                        quality
                    );

                    return;

                }


                /*
                 * PNG became bigger.
                 * Keep original.
                 */

                useOriginalFile();

            },
            mimeType,
            quality
        );

    }


    // ==================================================
    // STRONGER COMPRESSION
    // ==================================================

    function tryStrongerCompression(
        canvas,
        mimeType,
        currentQuality
    ) {

        const qualities = [

            currentQuality - 0.15,

            currentQuality - 0.30,

            0.40,

            0.30,

            0.20

        ];


        let index = 0;


        function tryNext() {

            if (
                index >=
                qualities.length
            ) {

                useOriginalFile();

                return;

            }


            const quality =
                Math.max(
                    0.20,
                    qualities[index]
                );


            index++;


            canvas.toBlob(
                (blob) => {

                    if (!blob) {

                        tryNext();

                        return;

                    }


                    if (
                        blob.size <
                        file.size
                    ) {

                        useCompressedBlob(
                            blob
                        );

                        return;

                    }


                    tryNext();

                },
                mimeType,
                quality
            );

        }


        tryNext();

    }


    // ==================================================
    // USE COMPRESSED
    // ==================================================

    function useCompressedBlob(blob) {

        compressedBlob =
            blob;


        if (
            compressedPreviewURL
        ) {

            URL.revokeObjectURL(
                compressedPreviewURL
            );

        }


        compressedPreviewURL =
            URL.createObjectURL(
                blob
            );


        compressedPreview.src =
            compressedPreviewURL;


        compressedSize.textContent =
            formatBytes(
                blob.size
            );


        const saved =
            Math.round(
                (
                    1 -
                    blob.size /
                    file.size
                ) * 100
            );


        savedPercent.textContent =
            `${Math.max(
                0,
                saved
            )}%`;


        downloadButton.disabled =
            false;


        saveResult(
            blob,
            createFileName(
                file.name,
                selectedFormat
            )
        );

    }


    // ==================================================
    // USE ORIGINAL
    // ==================================================

    function useOriginalFile() {

        compressedBlob =
            file;


        if (
            compressedPreviewURL
        ) {

            URL.revokeObjectURL(
                compressedPreviewURL
            );

        }


        compressedPreview.src =
            originalPreview.src;


        compressedSize.textContent =
            formatBytes(
                file.size
            );


        savedPercent.textContent =
            "0%";


        downloadButton.disabled =
            false;


        saveResult(
            file,
            file.name
        );

    }


    // ==================================================
    // SAVE RESULT
    // ==================================================

    function saveResult(
        blob,
        filename
    ) {

        if (
            resultObject
        ) {

            const index =
                compressionResults.indexOf(
                    resultObject
                );


            if (
                index !== -1
            ) {

                compressionResults.splice(
                    index,
                    1
                );

            }

        }


        resultObject = {
            blob: blob,
            filename: filename
        };


        compressionResults.push(
            resultObject
        );


        updateDownloadAllButton();

    }


    // ==================================================
    // DOWNLOAD SINGLE
    // ==================================================

    downloadButton.addEventListener(
        "click",
        () => {

            if (
                !compressedBlob
            ) {
                return;
            }


            downloadBlob(
                compressedBlob,
                compressedBlob === file
                    ? file.name
                    : createFileName(
                        file.name,
                        selectedFormat
                    )
            );

        }
    );

}


// ======================================================
// DOWNLOAD ALL
// ======================================================

downloadAllButton.addEventListener(
    "click",
    async () => {

        if (
            compressionResults.length === 0
        ) {
            return;
        }


        /*
         * JSZip must be loaded in index.html.
         */

        if (
            typeof JSZip === "undefined"
        ) {

            alert(
                "JSZip is not loaded. Add JSZip to index.html."
            );

            return;

        }


        downloadAllButton.disabled =
            true;


        downloadAllButton.textContent =
            "Creating ZIP...";


        try {

            const zip =
                new JSZip();


            compressionResults.forEach(
                (item) => {

                    zip.file(
                        item.filename,
                        item.blob
                    );

                }
            );


            const zipBlob =
                await zip.generateAsync(
                    {
                        type: "blob"
                    }
                );


            downloadBlob(
                zipBlob,
                "compressed-images.zip"
            );

        } catch (error) {

            console.error(
                error
            );

            alert(
                "Could not create ZIP file."
            );

        }


        downloadAllButton.disabled =
            false;


        downloadAllButton.textContent =
            "Download All";

    }
);


// ======================================================
// UPDATE DOWNLOAD ALL BUTTON
// ======================================================

function updateDownloadAllButton() {

    downloadAllButton.disabled =
        compressionResults.length === 0;

}


// ======================================================
// DOWNLOAD BLOB
// ======================================================

function downloadBlob(
    blob,
    filename
) {

    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;

    link.download =
        filename;


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    setTimeout(() => {

        URL.revokeObjectURL(
            url
        );

    }, 1000);

}


// ======================================================
// FILE NAME
// ======================================================

function createFileName(
    name,
    format
) {

    const extensionIndex =
        name.lastIndexOf(".");


    const baseName =
        extensionIndex === -1
            ? name
            : name.substring(
                0,
                extensionIndex
            );


    let extension;


    if (
        format === "png"
    ) {

        extension =
            "png";

    } else if (
        format === "webp"
    ) {

        extension =
            "webp";

    } else {

        extension =
            "jpg";

    }


    return `${baseName}-compressed.${extension}`;

}


// ======================================================
// FORMAT BYTES
// ======================================================

function formatBytes(bytes) {

    if (
        bytes === 0
    ) {

        return "0 Bytes";

    }


    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB"
    ];


    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );


    return (
        parseFloat(
            (
                bytes /
                Math.pow(
                    1024,
                    index
                )
            ).toFixed(2)
        ) +
        " " +
        units[index]
    );

}


// ======================================================
// ERROR
// ======================================================

function showError(message) {

    results.style.display =
        "block";


    const error =
        document.createElement(
            "div"
        );


    error.className =
        "error-message";


    error.textContent =
        message;


    results.appendChild(
        error
    );

}


// ======================================================
// SECURITY
// ======================================================

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


    return div.innerHTML;

}