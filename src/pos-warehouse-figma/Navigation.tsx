import React from 'react';
import { Button } from './ui/button';
import { Grid3X3, Table } from 'lucide-react';

interface NavigationProps {
  currentView: 'cards' | 'table';
  onViewChange: (view: 'cards' | 'table') => void;
}

export function Navigation({ currentView, onViewChange }: NavigationProps) {
  return (
    <div className="flex bg-muted rounded-lg p-1">
      <Button
        variant={currentView === 'cards' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('cards')}
        className="h-10 md:h-8 px-4 md:px-3 text-base md:text-sm"
      >
        <Grid3X3 className="h-5 w-5 md:h-4 md:w-4 mr-2 md:mr-1" />
        Карточки
      </Button>
      <Button
        variant={currentView === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('table')}
        className="h-10 md:h-8 px-4 md:px-3 text-base md:text-sm"
      >
        <Table className="h-5 w-5 md:h-4 md:w-4 mr-2 md:mr-1" />
        Таблица
      </Button>
    </div>
  );
}