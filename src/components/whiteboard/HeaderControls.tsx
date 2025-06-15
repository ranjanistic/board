
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
  <svg width="24" height="22" viewBox="0 0 76 73" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="43.984" cy="33.3027" r="7.91935" stroke="hsl(var(--accent))" strokeWidth="2"/>
    <circle cx="40.8492" cy="57.3548" r="6.93548" stroke="hsl(var(--primary))" strokeWidth="2"/>
    <line x1="22.0737" y1="62.0967" x2="40.8491" y2="57.3548" stroke="hsl(var(--accent))" strokeWidth="11.871" strokeLinecap="round"/>
    <line x1="40.8491" y1="57.3548" x2="51.0307" y2="42.7661" stroke="hsl(var(--accent))" strokeWidth="11.871" strokeLinecap="round"/>
    <line x1="43.9839" y1="33.3027" x2="57.7985" y2="23.5124" stroke="hsl(var(--primary))" strokeWidth="13.8468" strokeLinecap="round"/>
    <line x1="43.9839" y1="33.3027" x2="60.7502" y2="48.8833" stroke="hsl(var(--primary))" strokeWidth="13.8468" strokeLinecap="round"/>
    <circle cx="18.0077" cy="64.0645" r="10.8871" fill="hsl(var(--accent))"/>
    <circle cx="40.8491" cy="57.3548" r="5.93548" fill="hsl(var(--accent))"/>
    <circle cx="53.9835" cy="38.8306" r="5.93548" fill="hsl(var(--accent))"/>
    <circle cx="61.7338" cy="17.5806" r="12.8629" fill="hsl(var(--primary))"/>
    <circle cx="43.9839" cy="33.3027" r="6.91935" fill="hsl(var(--primary))"/>
    <circle cx="64.7015" cy="52.8185" r="6.91935" fill="hsl(var(--primary))"/>
  </svg>
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
        <h1 className="text-md font-headline font-semibold hidden sm:block">Payr Board</h1>
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

