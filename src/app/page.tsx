
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import HeaderControls from '@/components/whiteboard/HeaderControls';
import DrawingToolsPanel from '@/components/whiteboard/DrawingToolsPanel';
import CanvasArea from '@/components/whiteboard/CanvasArea';
import CanvasBottomBar from '@/components/whiteboard/CanvasBottomBar';
import ManageWhiteboardsDialog from '@/components/whiteboard/ManageWhiteboardsDialog';
import type { Whiteboard, DrawingTool, BackgroundType, ShapeType, WhiteboardPageData, PanOffset } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelRightOpen, PanelBottomClose, PanelBottomOpen, Plus, Minus, PanelTopClose, PanelTopOpen } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

const MAX_WHITEBOARDS = 10;
const MAX_PAGES_PER_WHITEBOARD = 10;
const DEFAULT_WHITEBOARD_NAME = "Untitled Whiteboard";
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 5.0;
const ZOOM_STEP = 0.1;


interface CanvasAreaHandle {
  getCurrentStrokeDataUrl: () => string | undefined;
}

function createNewPage(index: number): WhiteboardPageData {
  return {
    id: `page-${Date.now()}-${index}`,
    strokeDataUrl: undefined,
  };
}

export default function WhiteboardPage() {
  const [whiteboards, setWhiteboards] = useState<Whiteboard[]>([]);
  const [activeWhiteboardId, setActiveWhiteboardId] = useState<string | undefined>(undefined);
  
  const [selectedTool, setSelectedTool] = useState<DrawingTool>('pen');
  const [selectedShapeType, setSelectedShapeType] = useState<ShapeType>('rectangle');
  const [selectedColor, setSelectedColor] = useState<string>('#000000'); 
  const [brushSize, setBrushSize] = useState<number>(5);
  const [selectedBackgroundPattern, setSelectedBackgroundPattern] = useState<BackgroundType>('none');
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState<string>('#FFFFFF'); 

  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);
  const canvasAreaRef = useRef<CanvasAreaHandle>(null);
  
  const [exportSignal, setExportSignal] = useState(0);
  const [clearCanvasSignal, setClearCanvasSignal] = useState(0);

  const [isCanvasLocked, setIsCanvasLocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [isBottomBarOpen, setIsBottomBarOpen] = useState(true);
  const [isHeaderOpen, setIsHeaderOpen] = useState(true);

  const [canvasZoom, setCanvasZoom] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<PanOffset>({ x: 0, y: 0 });


  const { toast } = useToast();

  const activeWhiteboard = whiteboards.find(wb => wb.id === activeWhiteboardId);
  const activePage = activeWhiteboard?.pages[activeWhiteboard.activePageIndex];

  useEffect(() => {
    const initialId = `wb-${Date.now()}`;
    const defaultWhiteboard: Whiteboard = {
      id: initialId,
      name: DEFAULT_WHITEBOARD_NAME,
      pages: [createNewPage(0)],
      activePageIndex: 0,
      lastModified: Date.now(),
      backgroundPattern: 'none',
      canvasBackgroundColor: '#FFFFFF', 
    };
    setWhiteboards([defaultWhiteboard]);
    setActiveWhiteboardId(initialId);
    setSelectedBackgroundPattern(defaultWhiteboard.backgroundPattern);
    setCanvasBackgroundColor(defaultWhiteboard.canvasBackgroundColor);
    setSelectedColor(defaultWhiteboard.canvasBackgroundColor === '#FFFFFF' ? '#000000' : '#FFFFFF'); 
    setPanOffset({ x: (window.innerWidth - (window.innerWidth * 1)) / 2, y: (window.innerHeight - (window.innerHeight * 1)) / 2 });
  }, []);

  useEffect(() => {
    const updateCanvasDimensions = () => {
      setCanvasWidth(window.innerWidth);
      setCanvasHeight(window.innerHeight);
    };

    updateCanvasDimensions();
    window.addEventListener('resize', updateCanvasDimensions);
    return () => window.removeEventListener('resize', updateCanvasDimensions);
  }, []);


  const persistPageStrokeData = useCallback((strokeDataUrl: string) => {
    if (!activeWhiteboardId) return;
    setWhiteboards(prev => prev.map(wb => {
      if (wb.id === activeWhiteboardId) {
        const updatedPages = [...wb.pages];
        if (wb.activePageIndex >= 0 && wb.activePageIndex < updatedPages.length) {
            updatedPages[wb.activePageIndex] = { ...updatedPages[wb.activePageIndex], strokeDataUrl };
            return { ...wb, pages: updatedPages, lastModified: Date.now() };
        } else {
            console.warn(`Invalid activePageIndex ${wb.activePageIndex} for whiteboard ${wb.id} in persistPageStrokeData`);
            return wb; 
        }
      }
      return wb;
    }));
  }, [activeWhiteboardId]);

  const saveCurrentCanvasBeforeAction = useCallback(() => {
    const currentData = canvasAreaRef.current?.getCurrentStrokeDataUrl();
    if (currentData !== undefined) { 
      persistPageStrokeData(currentData);
    }
  }, [persistPageStrokeData]);

  const handleNewWhiteboard = () => {
    saveCurrentCanvasBeforeAction();
    if (whiteboards.length >= MAX_WHITEBOARDS) {
      toast({ title: "Limit Reached", description: `You can only have up to ${MAX_WHITEBOARDS} whiteboards.`, variant: "destructive" });
      return;
    }
    const newId = `wb-${Date.now()}`;
    const newWhiteboard: Whiteboard = {
      id: newId,
      name: `${DEFAULT_WHITEBOARD_NAME} ${whiteboards.length + 1}`,
      pages: [createNewPage(0)],
      activePageIndex: 0,
      lastModified: Date.now(),
      backgroundPattern: 'none',
      canvasBackgroundColor: '#FFFFFF', 
    };
    setWhiteboards(prev => [...prev, newWhiteboard]);
    setActiveWhiteboardId(newId);
    setSelectedBackgroundPattern(newWhiteboard.backgroundPattern);
    setCanvasBackgroundColor(newWhiteboard.canvasBackgroundColor);
    setSelectedColor(newWhiteboard.canvasBackgroundColor === '#FFFFFF' ? '#000000' : '#FFFFFF'); 
    setClearCanvasSignal(prev => prev + 1); 
    setCanvasZoom(1);
    setPanOffset({ x: (canvasWidth - (canvasWidth * 1)) / 2, y: (canvasHeight - (canvasHeight * 1)) / 2 });
  };

  const handleSaveWhiteboard = () => { 
    saveCurrentCanvasBeforeAction(); 
    if (!activeWhiteboardId || !activeWhiteboard) return;
    
    setWhiteboards(prev => prev.map(wb => {
      if (wb.id === activeWhiteboardId) {
        return { 
          ...wb, 
          lastModified: Date.now(), 
          backgroundPattern: selectedBackgroundPattern,
          canvasBackgroundColor: canvasBackgroundColor,
          name: activeWhiteboard.name 
        };
      }
      return wb;
    }));
    toast({ title: "Saved", description: `"${activeWhiteboard.name || 'Whiteboard'}" saved successfully.` });
  };
  
  const handleSelectWhiteboard = (id: string) => {
    if (id === activeWhiteboardId) return;
    saveCurrentCanvasBeforeAction();

    const wbToLoad = whiteboards.find(wb => wb.id === id);
    if (wbToLoad) {
      setActiveWhiteboardId(id);
      setSelectedBackgroundPattern(wbToLoad.backgroundPattern);
      setCanvasBackgroundColor(wbToLoad.canvasBackgroundColor);
      setSelectedColor(wbToLoad.canvasBackgroundColor === '#FFFFFF' ? '#000000' : '#FFFFFF');
      setCanvasZoom(1);
      setPanOffset({ x: (canvasWidth - (canvasWidth * 1)) / 2, y: (canvasHeight - (canvasHeight * 1)) / 2 });
    }
  };

  const handleDeleteWhiteboard = (id: string) => {
    if (whiteboards.length <= 1) {
      toast({ title: "Cannot Delete", description: "You must have at least one whiteboard.", variant: "destructive" });
      return;
    }

    const remainingWhiteboards = whiteboards.filter(wb => wb.id !== id);
    setWhiteboards(remainingWhiteboards);

    if (activeWhiteboardId === id) {
      const firstRemainingId = remainingWhiteboards[0]?.id;
      if (firstRemainingId) {
        const wbToLoad = remainingWhiteboards.find(wb => wb.id === firstRemainingId);
        if (wbToLoad) {
            setActiveWhiteboardId(firstRemainingId);
            setSelectedBackgroundPattern(wbToLoad.backgroundPattern);
            setCanvasBackgroundColor(wbToLoad.canvasBackgroundColor);
            setSelectedColor(wbToLoad.canvasBackgroundColor === '#FFFFFF' ? '#000000' : '#FFFFFF');
            setCanvasZoom(1);
            setPanOffset({ x: (canvasWidth - (canvasWidth * 1)) / 2, y: (canvasHeight - (canvasHeight * 1)) / 2 });
        }
      } else {
         handleNewWhiteboard(); 
      }
    }
  };

  const handleRenameActiveWhiteboard = (newName: string) => {
    if (!activeWhiteboardId) return;
    setWhiteboards(prev => prev.map(wb => 
      wb.id === activeWhiteboardId ? { ...wb, name: newName, lastModified: Date.now() } : wb
    ));
  };
  
  const handleRenameWhiteboardFromDialog = (id: string, newName: string) => {
     setWhiteboards(prev => prev.map(wb => 
      wb.id === id ? { ...wb, name: newName, lastModified: Date.now() } : wb
    ));
  };

  const handleBackgroundPatternChange = (pattern: BackgroundType) => {
    setSelectedBackgroundPattern(pattern);
    if (activeWhiteboardId) {
       setWhiteboards(prev => prev.map(wb => 
        wb.id === activeWhiteboardId ? { ...wb, backgroundPattern: pattern, lastModified: Date.now() } : wb
      ));
    }
  };

  const handleCanvasBackgroundColorChange = (color: string) => {
    setCanvasBackgroundColor(color);
     if (activeWhiteboardId) {
       setWhiteboards(prev => prev.map(wb => 
        wb.id === activeWhiteboardId ? { ...wb, canvasBackgroundColor: color, lastModified: Date.now() } : wb
      ));
    }
  }
  
  const handleClearCanvas = () => {
    if (isCanvasLocked) {
      toast({ title: "Canvas Locked", description: "Unlock the canvas to clear.", variant: "destructive" });
      return;
    }
    setClearCanvasSignal(prev => prev + 1); 
    if (activeWhiteboardId) { 
      persistPageStrokeData(''); 
    }
  };

  const handleCompositeImageReadyForExport = (dataUrl: string) => {
    if (activeWhiteboard) {
        const link = document.createElement('a');
        link.download = `${activeWhiteboard.name || 'whiteboard'}_page${activeWhiteboard.activePageIndex + 1}.png`;
        link.href = dataUrl;
        link.click();
        toast({ title: "Exporting", description: "Your whiteboard page is being downloaded." });
    }
    setExportSignal(0);
  };

  const handleToolChange = (tool: DrawingTool) => {
    if (isCanvasLocked && tool !== 'hand') { 
      toast({ title: "Canvas Locked", description: "Unlock the canvas to change tool.", variant: "destructive" });
      return;
    }
    setSelectedTool(tool);
  };
  
  const handleShapeTypeChange = (shapeType: ShapeType) => {
    setSelectedShapeType(shapeType);
    if(selectedTool !== 'shape') setSelectedTool('shape');
  };

  const handleExportCanvas = () => {
     setExportSignal(prev => prev + 1); 
  };

  const handleToggleLock = () => {
    setIsCanvasLocked(prev => !prev);
    toast({ title: `Canvas ${!isCanvasLocked ? 'Locked' : 'Unlocked'}`, description: !isCanvasLocked ? "Canvas is now view-only." : "Canvas is now editable." });
  };

  const handleAddPage = () => {
    saveCurrentCanvasBeforeAction();
    if (!activeWhiteboardId || !activeWhiteboard) return;
    if (activeWhiteboard.pages.length >= MAX_PAGES_PER_WHITEBOARD) {
        toast({ title: "Page Limit Reached", description: `A whiteboard can have a maximum of ${MAX_PAGES_PER_WHITEBOARD} pages.`, variant: "destructive" });
        return;
    }
    setWhiteboards(prev => prev.map(wb => {
        if (wb.id === activeWhiteboardId) {
            const newPages = [...wb.pages, createNewPage(wb.pages.length)];
            return { ...wb, pages: newPages, activePageIndex: newPages.length - 1, lastModified: Date.now() };
        }
        return wb;
    }));
    setClearCanvasSignal(prev => prev + 1);
    setCanvasZoom(1);
    setPanOffset({ x: (canvasWidth - (canvasWidth * 1)) / 2, y: (canvasHeight - (canvasHeight * 1)) / 2 });
  };

  const handleSelectPage = (pageIndex: number) => {
    if (!activeWhiteboardId || !activeWhiteboard) return;
    if (pageIndex === activeWhiteboard.activePageIndex) return; 
    
    saveCurrentCanvasBeforeAction();

    if (pageIndex >= 0 && pageIndex < activeWhiteboard.pages.length) {
        setWhiteboards(prev => prev.map(wb => 
            wb.id === activeWhiteboardId ? { ...wb, activePageIndex: pageIndex, lastModified: Date.now() } : wb
        ));
        setCanvasZoom(1);
        setPanOffset({ x: (canvasWidth - (canvasWidth * 1)) / 2, y: (canvasHeight - (canvasHeight * 1)) / 2 });
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const toggleBottomBar = () => {
    setIsBottomBarOpen(prev => !prev);
  };

  const toggleHeader = () => {
    setIsHeaderOpen(prev => !prev);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        });
      }
    }
  };

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const handleZoom = (newZoomFactor: number) => {
    if (isCanvasLocked) return;
    const oldZoom = canvasZoom;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoomFactor));

    const viewportCenterX = canvasWidth / 2;
    const viewportCenterY = canvasHeight / 2;

    const worldPointAtViewportCenterX = (viewportCenterX - panOffset.x) / oldZoom;
    const worldPointAtViewportCenterY = (viewportCenterY - panOffset.y) / oldZoom;
    
    setCanvasZoom(newZoom);

    const newPanX = viewportCenterX - worldPointAtViewportCenterX * newZoom;
    const newPanY = viewportCenterY - worldPointAtViewportCenterY * newZoom;
    setPanOffset({ x: newPanX, y: newPanY });
  };

  const handleZoomIn = () => handleZoom(canvasZoom + ZOOM_STEP);
  const handleZoomOut = () => handleZoom(canvasZoom - ZOOM_STEP);

  const handleResetZoom = () => {
    if (isCanvasLocked) return;
    const newZoom = 1;
    setCanvasZoom(newZoom);
    // Center the view
    const newPanX = (canvasWidth - (canvasWidth * newZoom)) / 2;
    const newPanY = (canvasHeight - (canvasHeight * newZoom)) / 2;
    setPanOffset({ x: newPanX, y: newPanY });
  };

  // Ensure initial pan offset centers content when canvas dimensions are ready
  useEffect(() => {
    if (canvasWidth > 0 && canvasHeight > 0) {
        handleResetZoom(); // This will set zoom to 1 and center the pan
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasWidth, canvasHeight]);


  if (!activeWhiteboard || !activePage || canvasWidth === 0 || canvasHeight === 0) {
    return <div className="flex h-screen w-screen items-center justify-center bg-background"><p>Loading Payr Board...</p></div>;
  }

  return (
    <TooltipProvider delayDuration={300}>
    <div className="h-screen w-screen bg-muted/30 overflow-hidden relative">
      {canvasWidth > 0 && canvasHeight > 0 && (
        <CanvasArea
          ref={canvasAreaRef}
          width={canvasWidth}
          height={canvasHeight}
          tool={selectedTool}
          shapeType={selectedShapeType}
          color={selectedColor}
          brushSize={brushSize}
          activePageStrokeDataUrl={activePage.strokeDataUrl} 
          onDrawEnd={persistPageStrokeData}
          requestCompositeImageForExport={exportSignal > 0}
          onCompositeImageReadyForExport={handleCompositeImageReadyForExport}
          clearCanvasSignal={clearCanvasSignal}
          isLocked={isCanvasLocked}
          backgroundPattern={selectedBackgroundPattern} 
          canvasBackgroundColor={canvasBackgroundColor}
          canvasZoom={canvasZoom}
          setCanvasZoom={setCanvasZoom} // Pass the raw setter
          panOffset={panOffset}
          setPanOffset={setPanOffset} // Pass the raw setter
        />
      )}
      
      {!isFullscreen && isHeaderOpen && (
        <HeaderControls
            activeWhiteboardName={activeWhiteboard.name}
            onRenameActiveWhiteboard={handleRenameActiveWhiteboard}
            onNewWhiteboard={handleNewWhiteboard}
            onSaveWhiteboard={handleSaveWhiteboard}
            onManageWhiteboards={() => setIsManageDialogOpen(true)}
            canCreateNew={whiteboards.length < MAX_WHITEBOARDS}
        />
      )}
      
      {!isFullscreen && (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleHeader}
                    className="fixed top-3 right-3 z-30 rounded-md shadow-md bg-card/80 hover:bg-card"
                    style={{top: isHeaderOpen ? 'calc(3.5rem + 2*0.75rem)' : '0.75rem' }} // Adjust based on header height + margins
                    aria-label={isHeaderOpen ? "Close header" : "Open header"}
                >
                    {isHeaderOpen ? <PanelTopClose className="h-5 w-5" /> : <PanelTopOpen className="h-5 w-5" />}
                </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
                <p>{isHeaderOpen ? "Hide Header" : "Show Header"}</p>
            </TooltipContent>
        </Tooltip>
      )}


      {!isFullscreen && isSidebarOpen && (
          <DrawingToolsPanel
            selectedTool={selectedTool}
            onToolChange={handleToolChange}
            selectedShapeType={selectedShapeType}
            onShapeTypeChange={handleShapeTypeChange}
            selectedColor={selectedColor}
            onColorChange={setSelectedColor}
            brushSize={brushSize}
            onBrushSizeChange={setBrushSize}
            canvasBackgroundColor={canvasBackgroundColor}
            onCanvasBackgroundColorChange={handleCanvasBackgroundColorChange}
            isCanvasLocked={isCanvasLocked}
          />
      )}
      
      {!isFullscreen && selectedTool === 'hand' && (
        <div 
            className="fixed bottom-24 right-16 z-30 bg-card/80 backdrop-blur-sm text-foreground text-xs px-2 py-1 rounded-lg shadow-xl flex items-center space-x-1"
            aria-live="polite"
        >
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={isCanvasLocked || canvasZoom <= MIN_ZOOM} className="h-6 w-6">
                        <Minus className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Zoom Out</p></TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span 
                        onClick={handleResetZoom}
                        className="cursor-pointer tabular-nums w-10 text-center hover:bg-accent/50 rounded px-1"
                        title="Reset Zoom & Pan"
                        aria-label="Current zoom level, click to reset"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleResetZoom();}}
                    >
                        {Math.round(canvasZoom * 100)}%
                    </span>
                </TooltipTrigger>
                <TooltipContent><p>Reset Zoom & Pan</p></TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={isCanvasLocked || canvasZoom >= MAX_ZOOM} className="h-6 w-6">
                        <Plus className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Zoom In</p></TooltipContent>
            </Tooltip>
        </div>
      )}

      {!isFullscreen && (
        <Tooltip>
          <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleBottomBar}
                className="fixed bottom-24 right-3 z-30 rounded-md shadow-md bg-card/80 hover:bg-card"
                aria-label={isBottomBarOpen ? "Close bottom bar" : "Open bottom bar"}
              >
                {isBottomBarOpen ? <PanelBottomClose className="h-5 w-5" /> : <PanelBottomOpen className="h-5 w-5" />}
              </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{isBottomBarOpen ? "Hide Bottom Bar" : "Show Bottom Bar"}</p>
          </TooltipContent>
        </Tooltip>
      )}


      {!isFullscreen && isBottomBarOpen && (
        <CanvasBottomBar
          currentPage={activeWhiteboard.activePageIndex + 1}
          totalPages={activeWhiteboard.pages.length}
          onAddPage={handleAddPage}
          onSelectPage={handleSelectPage}
          canAddPage={activeWhiteboard.pages.length < MAX_PAGES_PER_WHITEBOARD}
          selectedBackgroundPattern={selectedBackgroundPattern}
          onBackgroundPatternChange={handleBackgroundPatternChange}
          onClearCanvas={handleClearCanvas}
          onExportCanvas={handleExportCanvas}
          isCanvasLocked={isCanvasLocked}
          onToggleLock={handleToggleLock}
          isFullscreen={isFullscreen} // Though it won't be shown in fullscreen
          onToggleFullscreen={handleToggleFullscreen}
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          selectedTool={selectedTool}
          onToolChange={handleToolChange}
        />
      )}

      <ManageWhiteboardsDialog
        isOpen={isManageDialogOpen}
        onClose={() => setIsManageDialogOpen(false)}
        whiteboards={whiteboards}
        activeWhiteboardId={activeWhiteboardId}
        onSelectWhiteboard={handleSelectWhiteboard}
        onDeleteWhiteboard={handleDeleteWhiteboard}
        onRenameWhiteboard={handleRenameWhiteboardFromDialog}
      />
    </div>
    </TooltipProvider>
  );
}
