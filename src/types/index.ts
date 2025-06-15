
export type DrawingTool = 'pen' | 'eraser' | 'shape' | 'arrow' | 'text' | 'hand';
export type BackgroundType = 'none' | 'grid' | 'lines' | 'dotted'; // Added 'dotted'
export type ShapeType = 'rectangle' | 'circle' | 'line' | 'triangle';

export interface WhiteboardPageData {
  id: string;
  strokeDataUrl?: string; // Store canvas strokes as base64 data URL (transparent background)
}

export interface Whiteboard {
  id: string;
  name: string;
  pages: WhiteboardPageData[];
  activePageIndex: number;
  lastModified: number; // timestamp
  backgroundPattern: BackgroundType; // The pattern like grid/lines/dotted
  canvasBackgroundColor: string; // The solid background color of the canvas
}

export interface Point {
  x: number;
  y: number;
}

export interface PanOffset {
  x: number;
  y: number;
}
