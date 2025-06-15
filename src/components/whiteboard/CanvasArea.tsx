
"use client";

import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import type { DrawingTool, BackgroundType, Point, ShapeType, PanOffset } from '@/types';

interface CanvasAreaProps {
  width: number;
  height: number;
  tool: DrawingTool;
  shapeType: ShapeType;
  color: string;
  brushSize: number;
  activePageStrokeDataUrl?: string;
  onDrawEnd: (strokeDataUrl: string) => void;

  requestCompositeImageForExport: boolean;
  onCompositeImageReadyForExport: (compositeDataUrl: string) => void;

  clearCanvasSignal: number;
  isLocked: boolean;
  backgroundPattern: BackgroundType;
  canvasBackgroundColor: string;

  canvasZoom: number;
  setCanvasZoom: (zoom: number | ((prevZoom: number) => number)) => void;
  panOffset: PanOffset;
  setPanOffset: (offset: PanOffset | ((prevOffset: PanOffset) => PanOffset)) => void;
}

export interface CanvasAreaHandle {
  getCurrentStrokeDataUrl: () => string | undefined;
}

function drawArrowhead(ctx: CanvasRenderingContext2D, from: Point, to: Point, radius: number) {
  const x_center = to.x;
  const y_center = to.y;
  let angle;
  let x;
  let y;

  ctx.beginPath();
  angle = Math.atan2(to.y - from.y, to.x - from.x);
  const arrowLength = Math.max(5 / (ctx.canvas.width/ctx.canvas.offsetWidth), radius * 1.5); 
  const arrowWidthAngle = Math.PI / 8;

  ctx.moveTo(x_center, y_center);
  x = x_center - arrowLength * Math.cos(angle - arrowWidthAngle);
  y = y_center - arrowLength * Math.sin(angle - arrowWidthAngle);
  ctx.lineTo(x, y);
  x = x_center - arrowLength * Math.cos(angle + arrowWidthAngle);
  y = y_center - arrowLength * Math.sin(angle + arrowWidthAngle);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();
}

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 5.0;

const CanvasArea = forwardRef<CanvasAreaHandle, CanvasAreaProps>(({
  width,
  height,
  tool,
  shapeType,
  color,
  brushSize,
  activePageStrokeDataUrl,
  onDrawEnd,
  requestCompositeImageForExport,
  onCompositeImageReadyForExport,
  clearCanvasSignal,
  isLocked,
  backgroundPattern,
  canvasBackgroundColor,
  canvasZoom,
  setCanvasZoom,
  panOffset,
  setPanOffset,
}, ref) => {
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const tempDrawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const backgroundDivRef = useRef<HTMLDivElement>(null);


  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentCanvasPoint, setCurrentCanvasPoint] = useState<Point | null>(null);

  const [panStartPoint, setPanStartPoint] = useState<{ clientX: number, clientY: number } | null>(null);
  const [initialPanOffsetForDrag, setInitialPanOffsetForDrag] = useState<PanOffset>({x:0, y:0});

  const [isTextInputActive, setIsTextInputActive] = useState(false);
  const [textInputPosition, setTextInputPosition] = useState<Point | null>(null);
  const [textInputValue, setTextInputValue] = useState('');
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  const initialPinchDistanceRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(1);
  const initialPanOffsetForPinchRef = useRef<PanOffset>({ x: 0, y: 0 });
  const pinchCenterScreenRef = useRef<Point | null>(null);

  const [themedGridLineColor, setThemedGridLineColor] = useState('hsl(var(--border))');


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const borderVarValue = getComputedStyle(document.documentElement).getPropertyValue('--border').trim();
      setThemedGridLineColor(borderVarValue ? `hsl(${borderVarValue})` : 'rgba(0,0,0,0.1)');
    }
  }, []);

  useImperativeHandle(ref, () => ({
    getCurrentStrokeDataUrl: () => {
      const mainCanvas = drawingCanvasRef.current;
      if (!mainCanvas) return undefined;
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = mainCanvas.width;
      exportCanvas.height = mainCanvas.height;
      const exportCtx = exportCanvas.getContext('2d');
      if(!exportCtx) return undefined;
      exportCtx.drawImage(mainCanvas, 0, 0); // User strokes are on transparent background
      return exportCanvas.toDataURL('image/png');
    }
  }));

  const getDrawingContext = useCallback(() => {
    return drawingCanvasRef.current?.getContext('2d') || null;
  }, []);

  const getTempDrawingContext = useCallback(() => {
    return tempDrawingCanvasRef.current?.getContext('2d') || null;
  }, []);

  useEffect(() => {
    const ctx = getDrawingContext();
    const canvas = drawingCanvasRef.current;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (activePageStrokeDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.onerror = () => {
        console.error("Error loading image for canvas page.");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      img.src = activePageStrokeDataUrl;
    }
  }, [activePageStrokeDataUrl, width, height, getDrawingContext]);

  useEffect(() => {
    if (clearCanvasSignal > 0) {
      const ctx = getDrawingContext();
      if (ctx && drawingCanvasRef.current) {
        ctx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
      }
       if (isTextInputActive) {
        setIsTextInputActive(false);
        setTextInputValue('');
      }
    }
  }, [clearCanvasSignal, getDrawingContext, isTextInputActive]);

 const generateCompositeImage = useCallback(() => {
    if (!drawingCanvasRef.current) return '';
    const exportCanvas = document.createElement('canvas');

    exportCanvas.width = drawingCanvasRef.current.width;
    exportCanvas.height = drawingCanvasRef.current.height;
    const exportCtx = exportCanvas.getContext('2d');
    if (!exportCtx) return '';

    // 1. Fill with canvas background color
    exportCtx.fillStyle = canvasBackgroundColor;
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // 2. Draw patterns directly onto the export canvas at 1x scale (world scale)
    const patternSize = 20; 
    exportCtx.lineWidth = 0.5; 
    exportCtx.strokeStyle = themedGridLineColor;

    if (backgroundPattern === 'grid') {
        for (let x = 0; x < exportCanvas.width; x += patternSize) {
            exportCtx.beginPath(); exportCtx.moveTo(x, 0); exportCtx.lineTo(x, exportCanvas.height); exportCtx.stroke();
        }
        for (let y = 0; y < exportCanvas.height; y += patternSize) {
            exportCtx.beginPath(); exportCtx.moveTo(0, y); exportCtx.lineTo(exportCanvas.width, y); exportCtx.stroke();
        }
    } else if (backgroundPattern === 'lines') {
        for (let y = patternSize; y < exportCanvas.height; y += patternSize) {
            exportCtx.beginPath(); exportCtx.moveTo(0, y); exportCtx.lineTo(exportCanvas.width, y); exportCtx.stroke();
        }
    } else if (backgroundPattern === 'dotted') {
        const dotRadius = 1;
        exportCtx.fillStyle = themedGridLineColor;
        for (let x = patternSize / 2; x < exportCanvas.width; x += patternSize) {
            for (let y = patternSize / 2; y < exportCanvas.height; y += patternSize) {
                exportCtx.beginPath();
                exportCtx.arc(x, y, dotRadius, 0, 2 * Math.PI);
                exportCtx.fill();
            }
        }
    }
    // 3. Draw the user's strokes (which are on a transparent background)
    exportCtx.drawImage(drawingCanvasRef.current, 0, 0);
    return exportCanvas.toDataURL('image/png');
  }, [canvasBackgroundColor, backgroundPattern, themedGridLineColor, drawingCanvasRef]);


  useEffect(() => {
    if (requestCompositeImageForExport) {
      onCompositeImageReadyForExport(generateCompositeImage());
    }
  }, [requestCompositeImageForExport, generateCompositeImage, onCompositeImageReadyForExport]);

  const getPointOnCanvas = useCallback((clientX: number, clientY: number): Point | null => {
    const wrapper = canvasWrapperRef.current;
    if (!wrapper) return null;
    const rect = wrapper.getBoundingClientRect();

    const xRelativeToWrapper = clientX - rect.left;
    const yRelativeToWrapper = clientY - rect.top;

    // Invert the pan and zoom to get world coordinates
    const worldX = (xRelativeToWrapper - panOffset.x) / canvasZoom;
    const worldY = (yRelativeToWrapper - panOffset.y) / canvasZoom;

    return { x: worldX, y: worldY };
  }, [panOffset, canvasZoom]);


  const processStartDrawing = (point: Point | null) => {
    if (isLocked && tool !== 'hand') return;
    if (!point || tool === 'hand' || tool === 'text') return;


    setIsDrawing(true);
    setStartPoint(point);
    setCurrentCanvasPoint(point);

    const mainCtx = getDrawingContext();
    if (!mainCtx) return;

    mainCtx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    mainCtx.strokeStyle = color;
    mainCtx.fillStyle = color;
    // Apply zoom correction for tool size
    mainCtx.lineWidth = (tool === 'eraser' ? brushSize * 2 : brushSize) / canvasZoom;
    mainCtx.lineCap = 'round';
    mainCtx.lineJoin = 'round';

    if (tool === 'pen' || tool === 'eraser') {
      mainCtx.beginPath();
      mainCtx.moveTo(point.x, point.y);
    }
  };

  const processDraw = (point: Point | null) => {
    if (isLocked && tool !== 'hand') return;
    if (!point || !isDrawing || !startPoint || tool === 'hand' || tool === 'text') return;


    setCurrentCanvasPoint(point);
    const mainCtx = getDrawingContext();
    const tempCtx = getTempDrawingContext();

    if (!mainCtx || !tempCtx || !tempDrawingCanvasRef.current) return;

    tempCtx.clearRect(0, 0, tempDrawingCanvasRef.current.width, tempDrawingCanvasRef.current.height);
    tempCtx.strokeStyle = color;
    tempCtx.fillStyle = color;
    tempCtx.lineWidth = brushSize / canvasZoom; // Apply zoom correction
    tempCtx.lineCap = 'round';
    tempCtx.lineJoin = 'round';

    if (tool === 'pen' || tool === 'eraser') {
      mainCtx.lineTo(point.x, point.y);
      mainCtx.stroke();
    } else if (tool === 'shape' && startPoint) {
      const currentShapeWidth = point.x - startPoint.x;
      const currentShapeHeight = point.y - startPoint.y;
      tempCtx.beginPath();
      if (shapeType === 'rectangle') {
        tempCtx.rect(startPoint.x, startPoint.y, currentShapeWidth, currentShapeHeight);
      } else if (shapeType === 'circle') {
        const radiusX = Math.abs(currentShapeWidth / 2);
        const radiusY = Math.abs(currentShapeHeight / 2);
        const centerX = startPoint.x + currentShapeWidth / 2;
        const centerY = startPoint.y + currentShapeHeight / 2;
        tempCtx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      } else if (shapeType === 'line') {
        tempCtx.moveTo(startPoint.x, startPoint.y);
        tempCtx.lineTo(point.x, point.y);
      } else if (shapeType === 'triangle') {
        tempCtx.moveTo(startPoint.x + currentShapeWidth / 2, startPoint.y);
        tempCtx.lineTo(startPoint.x, point.y);
        tempCtx.lineTo(point.x, point.y);
        tempCtx.closePath();
      }
      tempCtx.stroke();
    } else if (tool === 'arrow' && startPoint) {
      tempCtx.beginPath();
      tempCtx.moveTo(startPoint.x, startPoint.y);
      tempCtx.lineTo(point.x, point.y);
      tempCtx.stroke();
      drawArrowhead(tempCtx, startPoint, point, (brushSize * 3) / canvasZoom); // Apply zoom correction
    }
  };

  const processStopDrawing = (finalPointInput?: Point | null) => {
    const finalPos = finalPointInput || currentCanvasPoint;

    if (!isDrawing || !startPoint || !finalPos || (isLocked && tool !== 'hand') || tool === 'hand' || tool === 'text') {
        setIsDrawing(false);
        return;
    }

    const mainCtx = getDrawingContext();
    const tempCtx = getTempDrawingContext();

    if (!mainCtx || !tempCtx || !tempDrawingCanvasRef.current) return;

    tempCtx.clearRect(0, 0, tempDrawingCanvasRef.current.width, tempDrawingCanvasRef.current.height);

    mainCtx.strokeStyle = color;
    mainCtx.fillStyle = color;
    mainCtx.lineWidth = (tool === 'eraser' ? brushSize * 2 : brushSize) / canvasZoom; // Apply zoom correction
    mainCtx.lineCap = 'round';
    mainCtx.lineJoin = 'round';

    if (tool === 'shape') {
      const shapeWidth = finalPos.x - startPoint.x;
      const shapeHeight = finalPos.y - startPoint.y;
      mainCtx.beginPath();
      if (shapeType === 'rectangle') {
        mainCtx.rect(startPoint.x, startPoint.y, shapeWidth, shapeHeight);
      } else if (shapeType === 'circle') {
        const radiusX = Math.abs(shapeWidth / 2);
        const radiusY = Math.abs(shapeHeight / 2);
        const centerX = startPoint.x + shapeWidth / 2;
        const centerY = startPoint.y + shapeHeight / 2;
        mainCtx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      } else if (shapeType === 'line') {
        mainCtx.moveTo(startPoint.x, startPoint.y);
        mainCtx.lineTo(finalPos.x, finalPos.y);
      } else if (shapeType === 'triangle') {
        mainCtx.moveTo(startPoint.x + shapeWidth / 2, startPoint.y);
        mainCtx.lineTo(startPoint.x, finalPos.y);
        mainCtx.lineTo(finalPos.x, finalPos.y);
        mainCtx.closePath();
      }
      mainCtx.stroke();
    } else if (tool === 'arrow') {
      mainCtx.beginPath();
      mainCtx.moveTo(startPoint.x, startPoint.y);
      mainCtx.lineTo(finalPos.x, finalPos.y);
      mainCtx.stroke();
      drawArrowhead(mainCtx, startPoint, finalPos, (brushSize * 3) / canvasZoom); // Apply zoom correction
    }

    if (tool === 'eraser') {
      mainCtx.globalCompositeOperation = 'source-over';
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentCanvasPoint(null);

    if (drawingCanvasRef.current) {
      onDrawEnd(drawingCanvasRef.current.toDataURL('image/png'));
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const point = getPointOnCanvas(e.clientX, e.clientY);
    if (tool === 'hand') {
      if (isLocked) return;
      if (point) {
        setIsDrawing(true);
        setPanStartPoint({ clientX: e.clientX, clientY: e.clientY });
        setInitialPanOffsetForDrag(panOffset);
        if (canvasWrapperRef.current) canvasWrapperRef.current.style.cursor = 'grabbing';
      }
      return;
    }
    processStartDrawing(point);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const point = getPointOnCanvas(e.clientX, e.clientY);
    if (tool === 'hand' && isDrawing && panStartPoint) {
      if (isLocked) return;
      const dx = e.clientX - panStartPoint.clientX;
      const dy = e.clientY - panStartPoint.clientY;
      setPanOffset({
        x: initialPanOffsetForDrag.x + dx,
        y: initialPanOffsetForDrag.y + dy,
      });
      return;
    }
    processDraw(point);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tool === 'hand') {
      if(isDrawing && !isLocked) {
        setIsDrawing(false);
        setPanStartPoint(null);
        if (canvasWrapperRef.current) canvasWrapperRef.current.style.cursor = 'grab';
      }
      return;
    }
    const point = getPointOnCanvas(e.clientX, e.clientY);
    processStopDrawing(point);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tool === 'hand' && isDrawing && !isLocked) {
        setIsDrawing(false);
        setPanStartPoint(null);
        if (canvasWrapperRef.current) canvasWrapperRef.current.style.cursor = 'grab';
        return;
    }
    if (isDrawing && tool !== 'text' && tool !== 'hand') {
        processStopDrawing(currentCanvasPoint);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (tool === 'hand') {
        if (isLocked) return;
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            e.preventDefault();
            setIsDrawing(true);
            setPanStartPoint({ clientX: touch.clientX, clientY: touch.clientY });
            setInitialPanOffsetForDrag(panOffset);
        } else if (e.touches.length === 2) {
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            initialPinchDistanceRef.current = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
            initialZoomRef.current = canvasZoom;
            initialPanOffsetForPinchRef.current = panOffset; 
            pinchCenterScreenRef.current = { 
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2
            };
        }
    } else {
        if (isLocked) return;
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const point = getPointOnCanvas(touch.clientX, touch.clientY);
            if (tool !== 'text') e.preventDefault();
            processStartDrawing(point);
        }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
     if (tool === 'hand') {
        if (isLocked) return;
        if (e.touches.length === 1 && isDrawing && panStartPoint) {
            e.preventDefault();
            const touch = e.touches[0];
            const dx = touch.clientX - panStartPoint.clientX;
            const dy = touch.clientY - panStartPoint.clientY;
            setPanOffset({
                x: initialPanOffsetForDrag.x + dx,
                y: initialPanOffsetForDrag.y + dy,
            });
        } else if (e.touches.length === 2 && initialPinchDistanceRef.current !== null && pinchCenterScreenRef.current !== null) {
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const currentPinchDistance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);

            const oldZoom = initialZoomRef.current;
            let newZoom = oldZoom * (currentPinchDistance / initialPinchDistanceRef.current);
            newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));

            const screenPinchX = pinchCenterScreenRef.current.x;
            const screenPinchY = pinchCenterScreenRef.current.y;
            const worldX = (screenPinchX - initialPanOffsetForPinchRef.current.x) / oldZoom;
            const worldY = (screenPinchY - initialPanOffsetForPinchRef.current.y) / oldZoom;

            const newPanX = screenPinchX - worldX * newZoom;
            const newPanY = screenPinchY - worldY * newZoom;

            setCanvasZoom(newZoom); 
            setPanOffset({ x: newPanX, y: newPanY }); 
        }
    } else {
        if (isLocked) return;
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const point = getPointOnCanvas(touch.clientX, touch.clientY);
            if (tool !== 'text') e.preventDefault();
            processDraw(point);
        }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (tool === 'hand') {
        if (isDrawing && e.touches.length === 0 && !isLocked) {
            setIsDrawing(false);
            setPanStartPoint(null);
        }
        if (e.touches.length < 2) { 
             initialPinchDistanceRef.current = null;
             pinchCenterScreenRef.current = null;
        }
    } else {
        if (tool !== 'text') e.preventDefault();
        if (isLocked) {
             setIsDrawing(false);
             setStartPoint(null);
             return;
        }
        if (e.changedTouches.length === 1) {
            const touch = e.changedTouches[0];
            const point = getPointOnCanvas(touch.clientX, touch.clientY);

            if (tool === 'text' && !isDrawing && !isTextInputActive && startPoint && point && Math.abs(point.x - startPoint.x) < 10 && Math.abs(point.y - startPoint.y) < 10) {
                handleCanvasClick(point);
            } else if (isDrawing) {
                processStopDrawing(point);
            } else if (startPoint) { 
                processStopDrawing(point);
            }
        } else if (isDrawing) { 
            processStopDrawing(currentCanvasPoint);
        }
        setStartPoint(null); 
    }
  };


  const handleCanvasClick = (pointOrEvent: Point | React.MouseEvent<HTMLDivElement>) => {
    if (isLocked) return;

    let clickPoint: Point | null;
    if ('clientX' in pointOrEvent) {
        clickPoint = getPointOnCanvas(pointOrEvent.clientX, pointOrEvent.clientY);
    } else {
        clickPoint = pointOrEvent;
    }

    if (!clickPoint) return;

    if (tool === 'text') {
      if(isTextInputActive) {
          handleTextSubmit();
      } else {
          setTextInputPosition(clickPoint);
          setIsTextInputActive(true);
      }
    }
  };

  useEffect(() => {
    if (isTextInputActive && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [isTextInputActive]);

  const handleTextSubmit = () => {
    if (!textInputValue.trim() || !textInputPosition) {
      setIsTextInputActive(false);
      setTextInputValue('');
      setTextInputPosition(null);
      return;
    }
    const ctx = getDrawingContext();
    if (ctx) {
      ctx.fillStyle = color;
      const fontSize = (brushSize * 3) / canvasZoom; // Apply zoom correction
      ctx.font = `${fontSize}px "Inter Tight", Arial, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      const lines = textInputValue.split('\n');
      const lineHeight = fontSize * 1.2; 
      lines.forEach((line, index) => {
        ctx.fillText(line, textInputPosition.x, textInputPosition.y + (index * lineHeight));
      });

      if (drawingCanvasRef.current) {
        onDrawEnd(drawingCanvasRef.current.toDataURL('image/png'));
      }
    }
    setIsTextInputActive(false);
    setTextInputValue('');
    setTextInputPosition(null);
  };

  const getCursor = () => {
    if (isLocked) return 'not-allowed';
    if (tool === 'hand') return isDrawing ? 'grabbing' : 'grab';
    if (tool === 'text') return 'text';
    return 'crosshair';
  };

  const canvasInteractionWrapperStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: `${width}px`,
    height: `${height}px`,
    cursor: getCursor(),
    overflow: 'hidden',
    touchAction: tool === 'hand' ? 'none' : (tool === 'text' ? 'auto' : 'none')
  };

  const transformedElementsContainerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: `${width}px`, 
    height: `${height}px`,
    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${canvasZoom})`,
    transformOrigin: '0 0',
    border: `1px solid hsl(var(--border))`, 
    boxSizing: 'border-box',
    backgroundColor: canvasBackgroundColor, // Apply canvas background color here
  };

  useEffect(() => {
    const bgDiv = backgroundDivRef.current;
    if (!bgDiv) return;

    let bgImage = 'none';
    let bgSize = 'auto';
    
    const visualPatternSize = 20; 
    const scaledPatternSize = visualPatternSize / canvasZoom; // Scale pattern based on zoom

    // Patterns are positioned relative to the (0,0) of the transformed container,
    // so they don't need panOffset directly here. The parent's transform handles panning.
    // However, if you wanted the pattern to seem "fixed" to the viewport *while panning the content*,
    // you'd use (panOffset.x % scaledPatternSize) but that might be too complex.
    // For now, let patterns pan with content.
    let bgPositionX = `0px`;
    let bgPositionY = `0px`;


    if (backgroundPattern !== 'none') {
      if (backgroundPattern === 'grid') {
        bgImage = `
          linear-gradient(${themedGridLineColor} 1px, transparent 1px),
          linear-gradient(90deg, ${themedGridLineColor} 1px, transparent 1px)
        `;
        bgSize = `${scaledPatternSize}px ${scaledPatternSize}px`;
      } else if (backgroundPattern === 'lines') {
        bgImage = `linear-gradient(${themedGridLineColor} 1px, transparent 1px)`;
        bgSize = `100% ${scaledPatternSize}px`; // Horizontal lines
        bgPositionX = `0px`;
        bgPositionY = `${scaledPatternSize/2}px`; // Start lines not at the very top
      } else if (backgroundPattern === 'dotted') {
        bgImage = `radial-gradient(${themedGridLineColor} 1px, transparent 1px)`;
        bgSize = `${scaledPatternSize}px ${scaledPatternSize}px`;
        bgPositionX = `${scaledPatternSize/2}px`;
        bgPositionY = `${scaledPatternSize/2}px`;
      }
    }

    bgDiv.style.backgroundColor = 'transparent'; // Pattern div is transparent
    bgDiv.style.backgroundImage = bgImage;
    bgDiv.style.backgroundSize = bgSize;
    bgDiv.style.backgroundPosition = `${bgPositionX} ${bgPositionY}`;

  }, [backgroundPattern, themedGridLineColor, canvasZoom, panOffset]); // panOffset removed from deps for pattern position

  useEffect(() => {
    const handleGlobalMouseUpOutside = (e: MouseEvent) => {
      if (isDrawing && tool !== 'hand' && tool !== 'text' && e.target !== canvasWrapperRef.current && !canvasWrapperRef.current?.contains(e.target as Node)) {
         processStopDrawing(currentCanvasPoint); 
      }
    };

    if (isDrawing && tool !== 'hand' && tool !== 'text') {
      window.addEventListener('mouseup', handleGlobalMouseUpOutside);
    }
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUpOutside);
    };
  }, [isDrawing, tool, processStopDrawing, currentCanvasPoint]);


  return (
    <div
      ref={canvasWrapperRef} 
      style={canvasInteractionWrapperStyle}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onClick={(e) => { if (tool === 'text' && !isDrawing) handleCanvasClick(e);}}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div style={transformedElementsContainerStyle}>
        {/* Pattern Layer - now inside the transformed container, draws over its background color */}
        <div
            ref={backgroundDivRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%', 
                height: '100%',
                zIndex: 0, 
            }}
        />
        <canvas
            ref={drawingCanvasRef}
            width={width} 
            height={height}
            style={{ position: 'absolute', top: 0, left: 0, zIndex: 1, backgroundColor: 'transparent' }}
            aria-label="Whiteboard drawing area"
            role="img"
        />
        <canvas
            ref={tempDrawingCanvasRef}
            width={width} 
            height={height}
            className="pointer-events-none"
            style={{ position: 'absolute', top: 0, left: 0, zIndex: 2, backgroundColor: 'transparent' }}
            aria-hidden="true"
        />
        {isTextInputActive && textInputPosition && (
            <textarea
            ref={textInputRef}
            value={textInputValue}
            onChange={(e) => setTextInputValue(e.target.value)}
            onBlur={handleTextSubmit}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleTextSubmit();
                }
                if (e.key === 'Escape') {
                setIsTextInputActive(false);
                setTextInputValue('');
                setTextInputPosition(null);
                }
            }}
            style={{
                position: 'absolute',
                left: `${textInputPosition.x}px`, 
                top: `${textInputPosition.y}px`,
                width: 'auto',
                minWidth: '50px',
                height: 'auto',
                minHeight: `${(brushSize * 3 / canvasZoom) * 1.2 + 8}px`, 
                border: '1px dashed hsl(var(--border))',
                background: 'hsl(var(--popover))',
                color: color,
                fontSize: `${(brushSize * 3) / canvasZoom}px`, 
                fontFamily: '"Inter Tight", Arial, sans-serif',
                lineHeight: '1.2',
                padding: '4px',
                zIndex: 3, // Above pattern div
                resize: 'none',
                overflow: 'hidden',
                outline: 'none',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                borderRadius: '3px',
            }}
            placeholder="Type..."
            />
        )}
      </div>
    </div>
  );
});

CanvasArea.displayName = 'CanvasArea';
export default CanvasArea;

