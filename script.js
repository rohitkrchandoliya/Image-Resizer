const uploadInput = document.getElementById('upload');
const canvas = document.getElementById('canvas');
const widthInput = document.getElementById('width');
const heightInput = document.getElementById('height');
const resizeBtn = document.getElementById('resize-btn');
const downloadBtn = document.getElementById('download-btn');
const preview = document.getElementById('preview');

const MAX_DIMENSION = 8192;
const MAX_PIXELS = 40000000;
let sourceImage = null;

downloadBtn.style.display = 'none';
resizeBtn.disabled = true;

function showPreviewMessage(message) {
  preview.replaceChildren();
  const paragraph = document.createElement('p');
  paragraph.textContent = message;
  preview.appendChild(paragraph);
}

uploadInput.addEventListener('change', event => {
  const file = event.target.files && event.target.files[0];
  sourceImage = null;
  resizeBtn.disabled = true;
  downloadBtn.style.display = 'none';
  canvas.width = 0;
  canvas.height = 0;
  preview.replaceChildren();

  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showPreviewMessage('Please upload a valid image file.');
    uploadInput.value = '';
    return;
  }
  if (file.size > 20 * 1024 * 1024) {
    showPreviewMessage('Image is too large. Choose a file under 20 MB.');
    uploadInput.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onerror = () => showPreviewMessage('Could not read this image. Please try another file.');
  reader.onload = () => {
    const img = new Image();
    img.onerror = () => showPreviewMessage('This file could not be decoded as an image.');
    img.onload = () => {
      sourceImage = img;
      preview.replaceChildren(img);
      resizeBtn.disabled = false;
    };
    img.src = String(reader.result);
  };
  reader.readAsDataURL(file);
});

resizeBtn.addEventListener('click', () => {
  if (!sourceImage || !sourceImage.complete || sourceImage.naturalWidth === 0) {
    showPreviewMessage('Please upload a valid image first.');
    return;
  }

  const rawWidth = widthInput.value.trim();
  const rawHeight = heightInput.value.trim();
  if (!/^\d+$/.test(rawWidth) || !/^\d+$/.test(rawHeight)) {
    showPreviewMessage('Enter positive whole-number dimensions.');
    return;
  }

  const width = Number(rawWidth);
  const height = Number(rawHeight);
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) ||
      width < 1 || height < 1 || width > MAX_DIMENSION || height > MAX_DIMENSION ||
      width * height > MAX_PIXELS) {
    showPreviewMessage('Dimensions must be at most 8192 × 8192 and no more than 40 million pixels total.');
    return;
  }

  try {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is unavailable in this browser.');
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(sourceImage, 0, 0, width, height);

    const resizedImageURL = canvas.toDataURL('image/png');
    downloadBtn.href = resizedImageURL;
    downloadBtn.download = 'resized-image.png';
    downloadBtn.style.display = 'inline-block';
    downloadBtn.textContent = 'Download Resized Image';
  } catch (error) {
    downloadBtn.style.display = 'none';
    showPreviewMessage(error instanceof Error
      ? 'Could not resize this image: ' + error.message
      : 'Could not resize this image.');
  }
});
