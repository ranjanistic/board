
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Grid, List, Minus, FilePlus, ChevronLeft, ChevronRight, Trash2, Download, Lock, Unlock, Maximize, Minimize, PanelLeftClose, PanelRightOpen, Hand, CircleDot
} from 'lucide-react';
import type { BackgroundType, DrawingTool } from '@/types';
import { cn } from '@/lib/utils';

const AboutLogo = () => (
  <img src="https://payr.org.in/logo.png" alt="Payr Logo" width="20" height="20" />
);

interface CanvasBottomBarProps {
  currentPage: number;
  totalPages: number;
  onAddPage: () => void;
  onSelectPage: (pageIndex: number) => void;
  canAddPage: boolean;
  selectedBackgroundPattern: BackgroundType;
  onBackgroundPatternChange: (pattern: BackgroundType) => void;
  onClearCanvas: () => void;
  onExportCanvas: () => void;
  isCanvasLocked: boolean;
  onToggleLock: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  selectedTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
}

export default function CanvasBottomBar({
  currentPage,
  totalPages,
  onAddPage,
  onSelectPage,
  canAddPage,
  selectedBackgroundPattern,
  onBackgroundPatternChange,
  onClearCanvas,
  onExportCanvas,
  isCanvasLocked,
  onToggleLock,
  isFullscreen,
  onToggleFullscreen,
  isSidebarOpen,
  toggleSidebar,
  selectedTool,
  onToolChange,
}: CanvasBottomBarProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <footer
        className="fixed bottom-3 left-3 right-3 p-3 bg-card/80 backdrop-blur-sm flex flex-wrap items-center justify-center sm:justify-between gap-2 sm:gap-3 shadow-xl rounded-lg z-20"
      >
        <div className="flex items-center space-x-1.5 flex-shrink-0">
           <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleSidebar}
                className={cn("h-9 w-9", isSidebarOpen && "bg-accent text-accent-foreground hover:bg-accent/90")}
                aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{isSidebarOpen ? "Hide Tools" : "Show Tools"}</p></TooltipContent>
          </Tooltip>
          <ToggleGroup
            type="single"
            size="sm"
            value={selectedBackgroundPattern}
            onValueChange={(value) => { if (value) onBackgroundPatternChange(value as BackgroundType) }}
            aria-label="Background pattern"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem value="none" aria-label="No background pattern" className="p-2 h-9 w-9">
                  <Minus className="h-4 w-4" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent><p>No Background</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem value="grid" aria-label="Grid background pattern" className="p-2 h-9 w-9">
                  <Grid className="h-4 w-4" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent><p>Grid Background</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem value="lines" aria-label="Lined background pattern" className="p-2 h-9 w-9">
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent><p>Lined Background</p></TooltipContent>
            </Tooltip>
             <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem value="dotted" aria-label="Dotted background pattern" className="p-2 h-9 w-9">
                  <CircleDot className="h-4 w-4" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent><p>Dotted Background</p></TooltipContent>
            </Tooltip>
          </ToggleGroup>
        </div>


        <div className="flex items-center space-x-1.5 flex-shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => onToolChange(selectedTool === 'hand' ? 'pen' : 'hand')} 
                className={cn("h-9 w-9", selectedTool === 'hand' && "bg-accent text-accent-foreground hover:bg-accent/90")}
                aria-label="Hand Tool"
              >
                <Hand className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Hand Tool (Pan & Zoom)</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={onClearCanvas} disabled={isCanvasLocked} className="h-9 w-9">
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Clear Page</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={onExportCanvas} className="h-9 w-9">
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Export Page</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={onToggleLock} 
                className={cn("h-9 w-9", isCanvasLocked && "bg-accent text-accent-foreground hover:bg-accent/90")}
              >
                {isCanvasLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{isCanvasLocked ? 'Unlock Canvas' : 'Lock Canvas'}</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={onToggleFullscreen} 
                className={cn("h-9 w-9", isFullscreen && "bg-accent text-accent-foreground hover:bg-accent/90")}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</p></TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center space-x-1.5 flex-shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSelectPage(currentPage - 2)} 
                disabled={currentPage <= 1}
                aria-label="Previous page"
                className="h-9 w-9"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Previous Page</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-sm font-medium tabular-nums whitespace-nowrap px-2 py-1.5 h-9 flex items-center border border-transparent">
                {currentPage} of {totalPages}
              </span>
            </TooltipTrigger>
             <TooltipContent><p>Current Page / Total Pages</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSelectPage(currentPage)} 
                disabled={currentPage >= totalPages}
                aria-label="Next page"
                className="h-9 w-9"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Next Page</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={onAddPage} disabled={!canAddPage} className="h-9 w-9">
                <FilePlus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Add Page</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={() => window.open("https://payr.org.in", "_blank")} className="h-9 w-9">
                <AboutLogo />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>About Payr</p></TooltipContent>
          </Tooltip>
        </div>
      </footer>
    </TooltipProvider>
  );
}
