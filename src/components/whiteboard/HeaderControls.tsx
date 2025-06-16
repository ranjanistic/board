
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FilePlus, Save, Folder } from 'lucide-react';

interface HeaderControlsProps {
  activeWhiteboardName: string;
  onRenameActiveWhiteboard: (newName: string) => void;
  onNewWhiteboard: () => void;
  onSaveWhiteboard: () => void;
  onManageWhiteboards: () => void;
  canCreateNew: boolean;
}

const LogoSvg = () => (
  <img src="https://static.vecteezy.com/system/resources/previews/047/299/947/non_2x/board-icon-symbol-design-illustration-vector.jpg" width={30} />
);


export default function HeaderControls({
  activeWhiteboardName,
  onRenameActiveWhiteboard,
  onNewWhiteboard,
  onSaveWhiteboard,
  onManageWhiteboards,
  canCreateNew,
}: HeaderControlsProps) {
  return (
    <header
      className="fixed top-3 left-3 right-3 p-3 bg-card/90 backdrop-blur-sm flex items-center justify-between space-x-4 shadow-xl rounded-lg z-20"
    >
      <div className="flex items-center space-x-2">
        <LogoSvg />
        <h1 className="text-md font-headline font-medium hidden sm:block text-gray-400">Unboard</h1>
      </div>
      <div className="flex-1 max-w-xs md:max-w-sm lg:max-w-md">
        <Input
          type="text"
          value={activeWhiteboardName}
          onChange={(e) => onRenameActiveWhiteboard(e.target.value)}
          placeholder="Whiteboard Name"
          className="text-center font-body font-medium h-9"
          aria-label="Current whiteboard name"
        />
      </div>
      <div className="flex items-center space-x-1 sm:space-x-1.5">
        <Button variant="outline" size="sm" onClick={onNewWhiteboard} disabled={!canCreateNew} aria-label="New whiteboard">
          <FilePlus className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline font-body">New</span>
        </Button>
        <Button variant="outline" size="sm" onClick={onSaveWhiteboard} aria-label="Save whiteboard">
          <Save className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline font-body">Save</span>
        </Button>
        <Button variant="outline" size="sm" onClick={onManageWhiteboards} aria-label="Manage whiteboards">
          <Folder className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline font-body">Manage</span>
        </Button>
      </div>
    </header>
  );
}

