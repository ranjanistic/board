
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  PenTool, Eraser, Palette, Shapes, ArrowRight, Type, PaintBucket,
  RectangleHorizontal, Circle, Minus as LineIcon, Triangle
} from 'lucide-react';
import type { DrawingTool, ShapeType } from '@/types';

interface DrawingToolsPanelProps {
  selectedTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  selectedShapeType: ShapeType;
  onShapeTypeChange: (shapeType: ShapeType) => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  canvasBackgroundColor: string;
  onCanvasBackgroundColorChange: (color: string) => void;
  isCanvasLocked: boolean;
}

const PRESET_COLORS = ['#000000', '#FF3B30', '#34C759', '#007AFF', '#FFCC00', '#AF52DE', '#D0B8FF', '#FFD8D8', '#FFFFFF'];
const PRESET_CANVAS_BACKGROUNDS = ['#FFFFFF', '#F0F0F0', '#E0E0E0', '#333333', '#FFF8E1', '#E3F2FD'];


export default function DrawingToolsPanel({
  selectedTool,
  onToolChange,
  selectedShapeType,
  onShapeTypeChange,
  selectedColor,
  onColorChange,
  brushSize,
  onBrushSizeChange,
  canvasBackgroundColor,
  onCanvasBackgroundColorChange,
  isCanvasLocked,
}: DrawingToolsPanelProps) {
  const showBrushSizeSlider = ['pen', 'eraser', 'shape', 'arrow', 'text'].includes(selectedTool);
  const showColorPicker = ['pen', 'shape', 'arrow', 'text'].includes(selectedTool);

  const commonToggleItemClass = "flex flex-col items-center p-2 h-auto text-xs";

  const headerHeightEstimate = "70px"; 
  const bottomBarHeightEstimate = "75px"; 
  const windowMargin = "0.75rem"; 
  const gapBetweenElements = "0.75rem"; 

  const panelTopOffset = `calc(${windowMargin} + ${headerHeightEstimate} + ${gapBetweenElements})`;
  const panelBottomOffset = `calc(${windowMargin} + ${bottomBarHeightEstimate} + ${gapBetweenElements})`;

  const effectiveSelectedTool = selectedTool === 'hand' ? undefined : selectedTool;

  return (
    <aside
      className="fixed left-3 rounded-lg shadow-xl bg-card/90 backdrop-blur-sm z-10 w-72 transition-transform duration-300 ease-in-out flex flex-col"
      style={{
        top: panelTopOffset,
        bottom: panelBottomOffset,
      }}
    >
      <ScrollArea className="flex-grow">
        <div className="p-4 space-y-6">
          <div>
            <Label className="text-sm font-medium mb-2 block">Tool</Label>
            <ToggleGroup
              type="single"
              value={effectiveSelectedTool}
              onValueChange={(value) => { if (value) onToolChange(value as DrawingTool) }}
              className="grid grid-cols-3 gap-2"
              aria-label="Drawing tool"
            >
              <ToggleGroupItem value="pen" aria-label="Pen" className={commonToggleItemClass} disabled={isCanvasLocked}>
                <PenTool className="h-4 w-4 mb-1" /> Pen
              </ToggleGroupItem>
              <ToggleGroupItem value="eraser" aria-label="Eraser" className={commonToggleItemClass} disabled={isCanvasLocked}>
                <Eraser className="h-4 w-4 mb-1" /> Eraser
              </ToggleGroupItem>
               <ToggleGroupItem value="shape" aria-label="Shape Tool" className={commonToggleItemClass} disabled={isCanvasLocked}>
                <Shapes className="h-4 w-4 mb-1" /> Shape
              </ToggleGroupItem>
              <ToggleGroupItem value="arrow" aria-label="Arrow" className={commonToggleItemClass} disabled={isCanvasLocked}>
                <ArrowRight className="h-4 w-4 mb-1" /> Arrow
              </ToggleGroupItem>
              <ToggleGroupItem value="text" aria-label="Text" className={commonToggleItemClass} disabled={isCanvasLocked}>
                <Type className="h-4 w-4 mb-1" /> Text
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {selectedTool === 'shape' && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Shape Type</Label>
              <ToggleGroup
                type="single"
                value={selectedShapeType}
                onValueChange={(value) => { if (value) onShapeTypeChange(value as ShapeType) }}
                className="grid grid-cols-4 gap-2"
                aria-label="Shape type"
                disabled={isCanvasLocked}
              >
                <ToggleGroupItem value="rectangle" aria-label="Rectangle" className="p-2 h-10">
                  <RectangleHorizontal className="h-5 w-5" />
                </ToggleGroupItem>
                <ToggleGroupItem value="circle" aria-label="Circle" className="p-2 h-10">
                  <Circle className="h-5 w-5" />
                </ToggleGroupItem>
                <ToggleGroupItem value="line" aria-label="Line" className="p-2 h-10">
                  <LineIcon className="h-5 w-5" />
                </ToggleGroupItem>
                <ToggleGroupItem value="triangle" aria-label="Triangle" className="p-2 h-10">
                  <Triangle className="h-5 w-5" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          )}

          {showBrushSizeSlider && selectedTool !== 'hand' && (
            <div>
              <Label htmlFor="brush-size" className="text-sm font-medium mb-2 block">
                {selectedTool === 'text' ? `Font Size: ${brushSize * 3}px` : `Brush Size: ${brushSize}px`}
              </Label>
              <Slider
                id="brush-size"
                min={selectedTool === 'text' ? 4 : 1}
                max={selectedTool === 'text' ? 20 : 50}
                step={1}
                value={[brushSize]}
                onValueChange={(value) => onBrushSizeChange(value[0])}
                aria-label={selectedTool === 'text' ? "Font size" : "Brush size"}
                disabled={isCanvasLocked}
              />
            </div>
          )}

          {showColorPicker && selectedTool !== 'hand' && (
            <div>
              <Label className="text-sm font-medium mb-2 block flex items-center">
                <Palette className="h-4 w-4 mr-2" /> Stroke/Text Color
              </Label>
              <div className="grid grid-cols-5 gap-1 mb-2">
                {PRESET_COLORS.map((color) => (
                  <Button
                    key={color}
                    variant="outline"
                    size="icon"
                    className={`w-full h-8 rounded-md border-2 ${selectedColor === color ? 'border-primary ring-2 ring-primary' : 'border-border'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => onColorChange(color)}
                    aria-label={`Color ${color}`}
                    disabled={isCanvasLocked}
                  />
                ))}
              </div>
              <Input
                type="color"
                value={selectedColor}
                onChange={(e) => onColorChange(e.target.value)}
                className="w-full h-10 p-1"
                aria-label="Custom stroke/text color picker"
                disabled={isCanvasLocked}
              />
            </div>
          )}

          <div>
            <Label className="text-sm font-medium mb-2 block flex items-center">
              <PaintBucket className="h-4 w-4 mr-2" /> Canvas Background
            </Label>
            <div className="grid grid-cols-3 gap-1 mb-2">
                {PRESET_CANVAS_BACKGROUNDS.map((color) => (
                  <Button
                    key={color}
                    variant="outline"
                    size="icon"
                    className={`w-full h-8 rounded-md border-2 ${canvasBackgroundColor === color ? 'border-primary ring-2 ring-primary' : 'border-border'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => onCanvasBackgroundColorChange(color)}
                    aria-label={`Canvas background color ${color}`}
                    disabled={isCanvasLocked}
                  />
                ))}
              </div>
            <Input
              type="color"
              value={canvasBackgroundColor}
              onChange={(e) => onCanvasBackgroundColorChange(e.target.value)}
              className="w-full h-10 p-1"
              aria-label="Canvas background color picker"
              disabled={isCanvasLocked}
            />
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}

