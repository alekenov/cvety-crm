import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PhotoUploadProps {
  value?: string[]
  onChange: (urls: string[]) => void
  maxFiles?: number
  className?: string
}

export function PhotoUpload({ 
  value = [], 
  onChange, 
  maxFiles = 5,
  className 
}: PhotoUploadProps) {
  const [previews, setPreviews] = useState<string[]>(value)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // In a real app, you would upload files to a server here
    // For now, we'll create local object URLs
    const newPreviews = acceptedFiles.map(file => URL.createObjectURL(file))
    const updatedPreviews = [...previews, ...newPreviews].slice(0, maxFiles)
    setPreviews(updatedPreviews)
    onChange(updatedPreviews)
  }, [previews, onChange, maxFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: maxFiles - previews.length,
    disabled: previews.length >= maxFiles
  })

  const removeImage = (index: number) => {
    const updatedPreviews = previews.filter((_, i) => i !== index)
    setPreviews(updatedPreviews)
    onChange(updatedPreviews)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {previews.length < maxFiles && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
            previews.length >= maxFiles && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          {isDragActive ? (
            <p className="text-sm text-muted-foreground">Отпустите файлы здесь...</p>
          ) : (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Перетащите фотографии сюда или нажмите для выбора
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, GIF до 10MB • Максимум {maxFiles} фото
              </p>
            </div>
          )}
        </div>
      )}

      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img 
                  src={preview} 
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
              {index === 0 && (
                <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                  Главное фото
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {previews.length === 0 && (
        <div className="flex items-center justify-center p-8 border rounded-lg bg-muted/50">
          <div className="text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Фотографии не загружены</p>
          </div>
        </div>
      )}
    </div>
  )
}