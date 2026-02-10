import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IMAGES } from '../constants';
import { ocrService } from '@/services/ocr';

type CropBox = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type DragMode = 'move' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se';

const DEFAULT_CROP: CropBox = { x: 0.1, y: 0.15, w: 0.8, h: 0.7 };
const IS_IOS =
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const MAX_EDITOR_EDGE = IS_IOS ? 1600 : 2200;
const MAX_OCR_EDGE = IS_IOS ? 1024 : 1400;
const MAX_OCR_PIXELS = IS_IOS ? 900_000 : 1_500_000;

const normalizeQuestionText = (raw: string) =>
  (raw || '')
    .replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '$1/$2')
    .replace(/\$\$([^$]+)\$\$/g, '$1')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\\\((.*?)\\\)/g, '$1')
    .replace(/\\\[(.*?)\\\]/g, '$1')
    .replace(/\\times|\\cdot/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\leq\b|\\le\b/g, '≤')
    .replace(/\\geq\b|\\ge\b/g, '≥')
    .replace(/[{}]/g, '')
    .trim();

const MistakeCapture: React.FC = () => {
  const navigate = useNavigate();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [imageDataUrl, setImageDataUrl] = useState<string>('');
  const [recognizedQuestion, setRecognizedQuestion] = useState('');
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognizeAttempts, setRecognizeAttempts] = useState(0);
  const [errorText, setErrorText] = useState('');
  const [crop, setCrop] = useState<CropBox>(DEFAULT_CROP);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; crop: CropBox; mode: DragMode } | null>(null);

  const hasImage = !!imageDataUrl;

  const cropStyle = useMemo(
    () => ({
      left: `${crop.x * 100}%`,
      top: `${crop.y * 100}%`,
      width: `${crop.w * 100}%`,
      height: `${crop.h * 100}%`
    }),
    [crop]
  );

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const resizeDataUrl = async (dataUrl: string, maxEdge: number, quality = 0.9) => {
    const img = await loadImage(dataUrl);
    const sourceW = img.naturalWidth || img.width;
    const sourceH = img.naturalHeight || img.height;
    const edgeScale = Math.min(1, maxEdge / Math.max(sourceW, sourceH));
    if (edgeScale >= 0.999) return dataUrl;

    const targetW = Math.max(2, Math.round(sourceW * edgeScale));
    const targetH = Math.max(2, Math.round(sourceH * edgeScale));
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;

    ctx.drawImage(img, 0, 0, sourceW, sourceH, 0, 0, targetW, targetH);
    return canvas.toDataURL('image/jpeg', quality);
  };

  const handleChooseFile = async (file: File | undefined) => {
    if (!file) return;
    setErrorText('');
    setRecognizedQuestion('');

    try {
      const rawDataUrl = await readFileAsDataUrl(file);
      const optimizedDataUrl = await resizeDataUrl(rawDataUrl, MAX_EDITOR_EDGE, 0.88);
      setImageDataUrl(optimizedDataUrl);
      setCrop(DEFAULT_CROP);
      setRecognizeAttempts(0);
      setRecognizedQuestion('');
    } catch {
      setErrorText('读取图片失败，请重试。');
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    await handleChooseFile(file);
    e.currentTarget.value = '';
  };

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const MIN_CROP_W = 0.16;
  const MIN_CROP_H = 0.08;

  const onCropPointerDown = (e: React.PointerEvent<HTMLElement>, mode: DragMode = 'move') => {
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      crop,
      mode
    };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onCropPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const dx = (e.clientX - dragStartRef.current.x) / rect.width;
    const dy = (e.clientY - dragStartRef.current.y) / rect.height;

    const start = dragStartRef.current;

    if (start.mode === 'move') {
      const nextX = clamp(start.crop.x + dx, 0, 1 - start.crop.w);
      const nextY = clamp(start.crop.y + dy, 0, 1 - start.crop.h);
      setCrop((prev) => ({ ...prev, x: nextX, y: nextY }));
      return;
    }

    let left = start.crop.x;
    let top = start.crop.y;
    let right = start.crop.x + start.crop.w;
    let bottom = start.crop.y + start.crop.h;

    if (start.mode.includes('nw') || start.mode.includes('sw')) left += dx;
    if (start.mode.includes('ne') || start.mode.includes('se')) right += dx;
    if (start.mode.includes('nw') || start.mode.includes('ne')) top += dy;
    if (start.mode.includes('sw') || start.mode.includes('se')) bottom += dy;

    left = clamp(left, 0, 1 - MIN_CROP_W);
    right = clamp(right, MIN_CROP_W, 1);
    top = clamp(top, 0, 1 - MIN_CROP_H);
    bottom = clamp(bottom, MIN_CROP_H, 1);

    if (right - left < MIN_CROP_W) {
      if (start.mode.includes('w')) {
        left = right - MIN_CROP_W;
      } else {
        right = left + MIN_CROP_W;
      }
    }

    if (bottom - top < MIN_CROP_H) {
      if (start.mode.includes('n')) {
        top = bottom - MIN_CROP_H;
      } else {
        bottom = top + MIN_CROP_H;
      }
    }

    left = clamp(left, 0, 1 - MIN_CROP_W);
    right = clamp(right, left + MIN_CROP_W, 1);
    top = clamp(top, 0, 1 - MIN_CROP_H);
    bottom = clamp(bottom, top + MIN_CROP_H, 1);

    setCrop({
      x: left,
      y: top,
      w: right - left,
      h: bottom - top
    });
  };

  const onCropPointerUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const getCropSourceRect = (box: CropBox) => {
    const image = imageRef.current;
    if (!image) throw new Error('Image not ready');

    const cw = image.clientWidth;
    const ch = image.clientHeight;
    const nw = image.naturalWidth;
    const nh = image.naturalHeight;
    if (!cw || !ch || !nw || !nh) throw new Error('Image dimensions are invalid');

    const renderedScale = Math.min(cw / nw, ch / nh);
    const renderedW = nw * renderedScale;
    const renderedH = nh * renderedScale;
    const offsetX = (cw - renderedW) / 2;
    const offsetY = (ch - renderedH) / 2;

    const bx = box.x * cw;
    const by = box.y * ch;
    const bw = box.w * cw;
    const bh = box.h * ch;

    const ix = Math.max(offsetX, bx);
    const iy = Math.max(offsetY, by);
    const ir = Math.min(offsetX + renderedW, bx + bw);
    const ib = Math.min(offsetY + renderedH, by + bh);

    const iw = Math.max(2, ir - ix);
    const ih = Math.max(2, ib - iy);

    const sx = Math.max(0, Math.round((ix - offsetX) / renderedScale));
    const sy = Math.max(0, Math.round((iy - offsetY) / renderedScale));
    const sw = Math.max(2, Math.round(iw / renderedScale));
    const sh = Math.max(2, Math.round(ih / renderedScale));

    return { sx, sy, sw, sh };
  };

  const createCroppedDataUrl = async () => {
    const image = imageRef.current;
    if (!image) throw new Error('Image not ready');

    const canvas = document.createElement('canvas');
    const { sx, sy, sw, sh } = getCropSourceRect(crop);

    const edgeScale = Math.min(1, 1800 / Math.max(sw, sh));
    const targetW = Math.max(2, Math.round(sw * edgeScale));
    const targetH = Math.max(2, Math.round(sh * edgeScale));
    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not available');

    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, targetW, targetH);
    return canvas.toDataURL('image/jpeg', 0.86);
  };

  const createCroppedDataUrlByBox = async (box: CropBox) => {
    const image = imageRef.current;
    if (!image) throw new Error('Image not ready');

    const canvas = document.createElement('canvas');
    const { sx, sy, sw, sh } = getCropSourceRect(box);

    const edgeScale = Math.min(1, MAX_OCR_EDGE / Math.max(sw, sh));
    const pixelScale = Math.min(1, Math.sqrt(MAX_OCR_PIXELS / Math.max(1, sw * sh)));
    const scale = Math.min(edgeScale, pixelScale);
    const targetW = Math.max(2, Math.round(sw * scale));
    const targetH = Math.max(2, Math.round(sh * scale));

    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not available');

    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, targetW, targetH);
    return canvas.toDataURL('image/jpeg', 0.84);
  };

  const expandCrop = (base: CropBox, ratio: number): CropBox => {
    const cx = base.x + base.w / 2;
    const cy = base.y + base.h / 2;
    const nw = Math.min(1, base.w * ratio);
    const nh = Math.min(1, base.h * ratio);
    const nx = clamp(cx - nw / 2, 0, 1 - nw);
    const ny = clamp(cy - nh / 2, 0, 1 - nh);
    return { x: nx, y: ny, w: nw, h: nh };
  };

  const looksValidOcrText = (text: string) => {
    const clean = text.replace(/\s+/g, ' ').trim();
    if (!clean) return false;
    if (clean.length < 10) return false;
    const badTail = /\$\$\s*$/.test(clean);
    return !badTail;
  };

  const runSmartRecognition = async () => {
    const candidates: CropBox[] = IS_IOS
      ? [crop, expandCrop(crop, 1.15), { x: 0, y: 0, w: 1, h: 1 }]
      : [crop, expandCrop(crop, 1.2), expandCrop(crop, 1.4), { x: 0, y: 0, w: 1, h: 1 }];

    let bestText = '';

    for (const box of candidates) {
      const dataUrl = await createCroppedDataUrlByBox(box);
      const text = await ocrService.recognizeQuestion(dataUrl);
      await new Promise((resolve) => setTimeout(resolve, 50));
      if (looksValidOcrText(text)) {
        return text.slice(0, 5000);
      }
      if (text.length > bestText.length) bestText = text;
    }

    return bestText.slice(0, 5000);
  };

  const handleRecognize = async () => {
    if (!hasImage) return;
    setIsRecognizing(true);
    setErrorText('');

    try {
      const question = normalizeQuestionText(await runSmartRecognition());
      setRecognizeAttempts((prev) => prev + 1);
      if (!question.trim()) {
        setErrorText('未识别到完整题目，请调整题目框后再次识别。');
        return;
      }
      setRecognizedQuestion(question);
    } catch (error: any) {
      setErrorText(error?.message || '识别失败，请稍后再试。');
    } finally {
      setIsRecognizing(false);
    }
  };

  const handleNext = async () => {
    if (!hasImage) {
      setErrorText('请先拍照或从相册选择图片。');
      return;
    }

    try {
      const cropped = await createCroppedDataUrl();
      let finalQuestion = recognizedQuestion;

      if (!finalQuestion.trim()) {
        setIsRecognizing(true);
        try {
          finalQuestion = normalizeQuestionText(await runSmartRecognition());
          setRecognizedQuestion(finalQuestion);
          setRecognizeAttempts((prev) => prev + 1);
        } finally {
          setIsRecognizing(false);
        }
      }

      if (!finalQuestion.trim()) {
        setErrorText('未识别到题目内容，请调整裁剪框后重试。');
        return;
      }

      navigate('/tagging', {
        state: {
          capturedImage: cropped,
          recognizedQuestion: finalQuestion
        }
      });
    } catch (error: any) {
      setErrorText(error?.message || '识别失败，请重试。');
    }
  };

  const handleFlashTip = () => {
    setErrorText('闪光灯请在系统相机拍摄界面中开启。');
  };

  return (
    <div className="relative flex h-[100svh] min-h-[100dvh] w-full flex-col overflow-hidden bg-black font-display select-none">
      {!hasImage && (
        <>
          <div
            className="absolute inset-0 z-0 bg-cover bg-center opacity-80"
            style={{ backgroundImage: `url("${IMAGES.cameraBg}")` }}
          >
            <div className="absolute inset-0 bg-black/30"></div>
          </div>

          <div className="relative z-20 flex items-center justify-between px-4 pb-2 pt-[max(env(safe-area-inset-top),1rem)] text-white">
            <div
              onClick={() => navigate(-1)}
              className="flex size-12 shrink-0 items-center justify-center rounded-full bg-black/20 backdrop-blur-md cursor-pointer hover:bg-black/40 transition-colors"
            >
              <span className="material-symbols-outlined text-white" style={{ fontSize: '24px' }}>
                close
              </span>
            </div>
            <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center drop-shadow-md">录入错题</h2>
            <div className="flex w-12 items-center justify-end" />
          </div>

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center w-full px-6 pb-6">
            <div className="mb-4 text-center">
              <h3 className="text-white tracking-wide text-2xl font-bold leading-tight drop-shadow-lg">请拍摄题目</h3>
              <p className="text-white/90 text-sm font-medium leading-normal mt-1 drop-shadow-md">支持拍照或从相册选择</p>
            </div>

            <div className="relative w-full aspect-[3/4] max-h-[500px] border-4 border-primary rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary/80 shadow-[0_0_15px_rgba(244,192,37,0.8)] animate-scan"></div>
            </div>

            {errorText && <p className="text-red-300 text-sm mt-4">{errorText}</p>}
          </div>

          <div className="fixed inset-x-0 bottom-0 z-[80] mx-auto w-full max-w-[min(100%,1024px)] bg-gradient-to-t from-black/95 via-black/80 to-transparent px-6 pt-6 pb-[calc(env(safe-area-inset-bottom)+0.9rem)]">
            <div className="flex items-center justify-around gap-6">
              <button onClick={() => galleryInputRef.current?.click()} className="flex flex-col items-center justify-center gap-1 group">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white transition-transform group-active:scale-95 hover:bg-white/30 border border-white/10">
                  <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                    photo_library
                  </span>
                </div>
                <span className="text-xs font-semibold text-white/80">相册</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="size-20 rounded-full border-4 border-white/30 flex items-center justify-center p-1">
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="size-16 rounded-full bg-primary shadow-[0_0_20px_rgba(244,192,37,0.4)] transition-transform active:scale-90 hover:scale-105 flex items-center justify-center text-[#221e10]"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
                      photo_camera
                    </span>
                  </button>
                </div>
              </div>

              <button onClick={handleFlashTip} className="flex flex-col items-center justify-center gap-1 group">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white transition-transform group-active:scale-95 hover:bg-white/30 border border-white/10">
                  <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                    flash_on
                  </span>
                </div>
                <span className="text-xs font-semibold text-white/80">闪光灯</span>
              </button>
            </div>
            <div className="h-1"></div>
          </div>
        </>
      )}

      {hasImage && (
        <div className="relative z-20 flex-1 flex flex-col bg-background-light dark:bg-background-dark">
          <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10">
            <button onClick={() => setImageDataUrl('')} className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h2 className="text-lg font-bold">裁剪题目区域</h2>
            <div className="w-10" />
          </div>

          <div className="flex-1 p-4 overflow-hidden flex flex-col gap-4">
            <div className="relative flex-1 rounded-2xl overflow-hidden bg-black/70">
              <img ref={imageRef} src={imageDataUrl} className="absolute inset-0 w-full h-full object-contain" alt="captured" />

              <div className="absolute inset-0 bg-black/45 pointer-events-none" />

              <div
                className="absolute border-2 border-primary rounded-xl shadow-[0_0_0_2000px_rgba(0,0,0,0.45)] cursor-move touch-none"
                style={cropStyle}
                onPointerDown={(e) => onCropPointerDown(e, 'move')}
                onPointerMove={onCropPointerMove}
                onPointerUp={onCropPointerUp}
                onPointerCancel={onCropPointerUp}
              >
                <div className="absolute inset-0 border border-white/70 rounded-xl pointer-events-none" />
                <div className="absolute -top-6 left-0 text-xs bg-primary px-2 py-0.5 rounded-full text-[#221e10] font-bold">题目框</div>
                <button
                  type="button"
                  className="absolute -left-2 -top-2 size-4 rounded-full bg-primary border border-white cursor-nwse-resize"
                  onPointerDown={(e) => onCropPointerDown(e, 'resize-nw')}
                  aria-label="resize-nw"
                />
                <button
                  type="button"
                  className="absolute -right-2 -top-2 size-4 rounded-full bg-primary border border-white cursor-nesw-resize"
                  onPointerDown={(e) => onCropPointerDown(e, 'resize-ne')}
                  aria-label="resize-ne"
                />
                <button
                  type="button"
                  className="absolute -left-2 -bottom-2 size-4 rounded-full bg-primary border border-white cursor-nesw-resize"
                  onPointerDown={(e) => onCropPointerDown(e, 'resize-sw')}
                  aria-label="resize-sw"
                />
                <button
                  type="button"
                  className="absolute -right-2 -bottom-2 size-4 rounded-full bg-primary border border-white cursor-nwse-resize"
                  onPointerDown={(e) => onCropPointerDown(e, 'resize-se')}
                  aria-label="resize-se"
                />
              </div>
            </div>

            {recognizedQuestion && (
              <div className="bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/10 rounded-xl p-3 text-sm max-h-36 overflow-auto">
                <p className="font-bold mb-1">OCR 识别结果</p>
                <pre className="text-text-sec-light dark:text-text-sec-dark whitespace-pre-wrap break-words font-sans text-sm m-0">
                  {recognizedQuestion}
                </pre>
              </div>
            )}

            {errorText && <p className="text-red-500 text-sm">{errorText}</p>}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleRecognize}
                disabled={isRecognizing}
                className="h-12 rounded-xl border border-primary text-primary font-bold disabled:opacity-60"
              >
                {isRecognizing ? '识别中...' : recognizeAttempts > 0 ? '再次识别' : '识别题目'}
              </button>
              <button onClick={handleNext} className="h-12 rounded-xl bg-primary text-[#221e10] font-bold">
                下一步
              </button>
            </div>
            {recognizeAttempts > 0 && (
              <p className="text-xs text-text-sec-light dark:text-text-sec-dark text-center">
                已识别 {recognizeAttempts} 次。若结果不完整，可微调题目框并再次识别。
              </p>
            )}
          </div>
        </div>
      )}

      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleInputChange} />
      <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleInputChange} />
    </div>
  );
};

export default MistakeCapture;
