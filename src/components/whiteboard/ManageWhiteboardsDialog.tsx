
"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Edit3, CheckCircle, XCircle } from 'lucide-react';
import type { Whiteboard } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';


interface ManageWhiteboardsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  whiteboards: Whiteboard[];
  activeWhiteboardId?: string;
  onSelectWhiteboard: (id: string) => void;
  onDeleteWhiteboard: (id: string) => void;
  onRenameWhiteboard: (id: string, newName: string) => void;
}

export default function ManageWhiteboardsDialog({
  isOpen,
  onClose,
  whiteboards,
  activeWhiteboardId,
  onSelectWhiteboard,
  onDeleteWhiteboard,
  onRenameWhiteboard,
}: ManageWhiteboardsDialogProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const { toast } = useToast();

  const handleStartRename = (wb: Whiteboard) => {
    setEditingId(wb.id);
    setNewName(wb.name);
  };

  const handleConfirmRename = () => {
    if (editingId && newName.trim()) {
      onRenameWhiteboard(editingId, newName.trim());
      toast({ title: "Renamed", description: `Whiteboard renamed to "${newName.trim()}".` });
    }
    setEditingId(null);
    setNewName('');
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setNewName('');
  };
  
  const handleDelete = (id: string, name: string) => {
    if (whiteboards.length <= 1) {
      toast({
        title: "Cannot Delete",
        description: "You must have at least one whiteboard.",
        variant: "destructive",
      });
      return;
    }
    onDeleteWhiteboard(id);
    toast({ title: "Deleted", description: `Whiteboard "${name}" deleted.` });
  }


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); handleCancelRename(); }}}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Whiteboards</DialogTitle>
          <DialogDescription>Select, rename, or delete your whiteboards. You can have up to 5.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-2">
            {whiteboards.sort((a,b) => b.lastModified - a.lastModified).map((wb) => (
              <div
                key={wb.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  wb.id === activeWhiteboardId ? 'bg-primary/20 border-primary ring-2 ring-primary/50' : 'bg-card hover:bg-muted/50'
                }`}
              >
                {editingId === wb.id ? (
                  <Input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onBlur={handleConfirmRename} // Confirm on blur might be too aggressive if user clicks away to copy text
                    onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmRename(); if (e.key === 'Escape') handleCancelRename();}}
                    autoFocus
                    className="flex-grow mr-2 h-9 text-sm"
                  />
                ) : (
                  <div 
                    className="flex-grow cursor-pointer group" 
                    onClick={() => {onSelectWhiteboard(wb.id); onClose();}}
                    title={`Load "${wb.name}"`}
                  >
                    <span className="font-medium group-hover:text-primary truncate block">{wb.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {wb.pages.length} page{wb.pages.length > 1 ? 's' : ''} - Modified {formatDistanceToNow(new Date(wb.lastModified), { addSuffix: true })}
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-1 shrink-0">
                  {editingId === wb.id ? (
                    <>
                      <Button variant="ghost" size="icon" onClick={handleConfirmRename} className="h-8 w-8" aria-label="Confirm rename">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={handleCancelRename} className="h-8 w-8" aria-label="Cancel rename">
                        <XCircle className="h-4 w-4 text-red-600" />
                      </Button>
                    </>
                  ) : (
                    <Button variant="ghost" size="icon" onClick={() => handleStartRename(wb)} className="h-8 w-8" aria-label="Rename whiteboard">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(wb.id, wb.name)}
                    disabled={whiteboards.length <= 1}
                    className="h-8 w-8"
                    aria-label="Delete whiteboard"
                  >
                    <Trash2 className="h-4 w-4 text-destructive hover:text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
