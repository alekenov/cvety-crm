import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function SimplePOSWarehouse() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">POS Склад - Простая версия</h1>
      
      <Card className="p-4">
        <p>Эта страница работает!</p>
        <Button className="mt-4">Тестовая кнопка</Button>
      </Card>
    </div>
  );
}