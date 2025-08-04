import { useState } from 'react';
import { Star, Send, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderNumber?: string;
  productName?: string;
  onSubmit?: (review: ReviewData) => void;
}

interface ReviewData {
  rating: number;
  comment: string;
  orderNumber?: string;
}

export function ReviewDialog({ 
  open, 
  onOpenChange, 
  orderNumber, 
  productName,
  onSubmit 
}: ReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    setIsSubmitting(true);
    
    try {
      const reviewData: ReviewData = {
        rating,
        comment: comment.trim(),
        orderNumber
      };
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onSubmit) {
        onSubmit(reviewData);
      }
      
      setIsSubmitted(true);
      
      // Auto close after success
      setTimeout(() => {
        onOpenChange(false);
        // Reset form for next time
        setTimeout(() => {
          setRating(0);
          setComment('');
          setIsSubmitted(false);
        }, 300);
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleStarHover = (starRating: number) => {
    setHoveredRating(starRating);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const getRatingText = (ratingValue: number) => {
    switch (ratingValue) {
      case 1: return 'Очень плохо';
      case 2: return 'Плохо';
      case 3: return 'Удовлетворительно';
      case 4: return 'Хорошо';
      case 5: return 'Отлично';
      default: return 'Выберите оценку';
    }
  };

  if (isSubmitted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <Card className="border-0 shadow-none">
            <CardContent className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-xl mb-2">Спасибо за отзыв!</CardTitle>
              <CardDescription>
                Ваша оценка поможет нам стать лучше
              </CardDescription>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Оценить заказ</DialogTitle>
          <DialogDescription>
            {orderNumber && `Заказ №${orderNumber}`}
            {productName && ` • ${productName}`}
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {getRatingText(hoveredRating || rating)}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Star Rating */}
            <div className="flex justify-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 hover:scale-110 transition-transform"
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => handleStarHover(star)}
                  onMouseLeave={handleStarLeave}
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Комментарий <span className="text-gray-500">(необязательно)</span>
              </label>
              <Textarea
                placeholder="Расскажите о своем опыте заказа..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <div className="text-xs text-gray-500 text-right">
                {comment.length}/500
              </div>
            </div>

            {/* Rating reminder */}
            {rating === 0 && (
              <Alert>
                <AlertDescription>
                  Пожалуйста, выберите оценку от 1 до 5 звезд
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Отправляется...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Отправить отзыв
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}