import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Gift, X } from 'lucide-react';

interface TestCardMessageProps {
  cardMessage: string;
  showCardMessageInput: boolean;
  onCardMessageChange: (message: string) => void;
  setShowCardMessageInput: (show: boolean) => void;
}

export const TestCardMessage: React.FC<TestCardMessageProps> = ({
  cardMessage,
  showCardMessageInput,
  onCardMessageChange,
  setShowCardMessageInput,
}) => {
  if (!showCardMessageInput) {
    return (
      <div className="panel">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowCardMessageInput(true)}
          className="text-primary hover:text-primary/80 w-full justify-start"
        >
          <Gift className="h-4 w-4 mr-2" />
          Добавить открытку к заказу
        </Button>
      </div>
    );
  }
  
  return (
    <div className="panel">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-gray-500" />
            <h3 className="text-base font-medium">Открытка</h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowCardMessageInput(false);
              onCardMessageChange('');
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="cardMessage">Текст открытки</Label>
          <Textarea
            id="cardMessage"
            placeholder="Напишите пожелания..."
            value={cardMessage}
            onChange={(e) => onCardMessageChange(e.target.value)}
            rows={4}
          />
        </div>
      </div>
    </div>
  );
};